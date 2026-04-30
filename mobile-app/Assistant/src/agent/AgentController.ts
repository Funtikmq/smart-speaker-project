/**
 * AgentController.ts
 *
 * Creierul agentului — descrie fluxul real implementat acum:
 *
 * Flow actual:
 *   1. Pi detectează wake word și pornește recorderul.
 *   2. Pi trimite PCM chunks prin RFCOMM la aplicația mobilă.
 *   3. Telefonul bufferizează audio; la `recording_stopped` decide în funcție
 *      de flag-ul `use_cloud` primit de la Pi:
 *        - `use_cloud = true`:
 *            • telefonul trimite PCM la serverul cloud (WebSocket)
 *            • redăm `response` cu TTS nativ pe telefon (audio va fi transmis
 *              către Pi prin A2DP/streaming), apoi trimitem `tts_done` la Pi
 *        - `use_cloud = false`:
 *            • telefonul folosește STT local (Vosk), procesează intentul local
 *   4. Raw audio TTS primit direct de la server este ignorat în aplicație —
 *      preferăm redare nativă pe telefon pentru consistență A2DP.
 *
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  BluetoothAudioReceiver,
  BtStatus,
} from './bluetooth/BluetoothAudioReciver';
import { AudioBuffer } from './bluetooth/AudioBuffer';
import { STTProcessor, STTResult } from './stt/STTProcessor';
import { TTSPlayer } from './tts/TTSPlayer';
import { OfflineAgent } from './offline/OfflineAgent';

// ─── Tipuri stare ─────────────────────────────────────────────────────────────

export type AgentPhase =
  | 'idle' // Așteptăm wake word pe Pi
  | 'connecting' // Ne conectăm la Pi prin Bluetooth
  | 'listening' // Pi înregistrează, primim audio
  | 'processing' // Am primit tot audio-ul, facem STT
  | 'responding' // Am textul, generăm răspunsul
  | 'speaking' // Redăm TTS
  | 'error';

export interface AgentState {
  phase: AgentPhase;
  btStatus: BtStatus;
  transcript: string; // Textul transcris (afișat în UI)
  partialText: string; // Text parțial în timp real
  response: string; // Răspunsul asistentului
  error: string | null;
  audioStats: {
    chunksReceived: number;
    durationSeconds: number;
    totalBytes: number;
  };
}

const INITIAL_STATE: AgentState = {
  phase: 'idle',
  btStatus: 'disconnected',
  transcript: '',
  partialText: '',
  response: '',
  error: null,
  audioStats: { chunksReceived: 0, durationSeconds: 0, totalBytes: 0 },
};

// ─── AgentController class ────────────────────────────────────────────────────

export class AgentController {
  private bt: BluetoothAudioReceiver;
  private stt: STTProcessor;
  private tts: TTSPlayer;
  private offlineAgent: OfflineAgent;
  private audioBuffer = new AudioBuffer();
  private _chunksReceived = 0;

  // Callback spre React hook
  private _onStateChange: ((s: Partial<AgentState>) => void) | null = null;

  constructor(private readonly piMacAddress: string) {
    this.bt = new BluetoothAudioReceiver(piMacAddress);
    this.stt = new STTProcessor();
    this.tts = new TTSPlayer();
    this.offlineAgent = new OfflineAgent();

    // Vosk offline — inițializăm în background
    this.stt.initVosk().catch(e => console.warn('[Agent] Vosk init:', e));

    // Când serverul trimite răspuns text → afișăm în UI și redăm prin TTS nativ
    this.stt._onResponseText = async (text: string) => {
      this._emit({ response: text, phase: 'speaking' });
      try {
        await this.tts.speak(text, false);
        // Semnalăm Pi-ului că TTS s-a terminat
        await this.bt.sendCommand({ type: 'tts_done' });
        console.log('[Agent] tts_done trimis la Pi (online)');
      } catch (err) {
        console.warn('[Agent] Eroare la redare TTS nativ:', err);
      }
    };

    // Când serverul trimite audio TTS raw — ignorăm (vom reda textul nativ)
    this.stt._onTTSReceived = (audioBytes: Uint8Array) => {
      console.log(
        `[Agent] Ignor audio TTS raw de la server (${audioBytes.length} bytes)`,
      );
    };

    // Wiring Bluetooth → AgentController
    this.bt.onStatusChange = this._onBtStatus.bind(this);
    this.bt.onAudioChunk = this._onAudioChunk.bind(this);
    this.bt.onRecordingStopped = this._onRecordingStopped.bind(this);
  }

  // ─── Conectare ────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    this._emit({ phase: 'connecting', error: null });
    try {
      await this.tts.init();
      await this.bt.connect();
      console.log('[Agent] Conectat la Pi, gata de ascultare.');
      this._emit({ phase: 'idle' });
    } catch (err: any) {
      this._emit({ phase: 'error', error: err.message });
      throw err;
    }
  }

  disconnect(): void {
    this.bt.disconnect();
    this.stt.destroy();
    this._emit(INITIAL_STATE);
  }

  // ─── Callbacks Bluetooth ──────────────────────────────────────────────────

  private _onBtStatus(status: BtStatus): void {
    this._emit({ btStatus: status });

    if (status === 'receiving_audio') {
      this.audioBuffer.clear();
      this._chunksReceived = 0;
      this._emit({
        phase: 'listening',
        transcript: '',
        partialText: '',
        response: '',
        audioStats: { chunksReceived: 0, durationSeconds: 0, totalBytes: 0 },
      });
    }
  }

  private _onAudioChunk(chunk: Uint8Array): void {
    this.audioBuffer.addChunk(chunk);
    this._chunksReceived++;

    if (this._chunksReceived % 10 === 0) {
      this._emit({
        audioStats: {
          chunksReceived: this._chunksReceived,
          durationSeconds: this.audioBuffer.durationSeconds,
          totalBytes: this.audioBuffer.totalBytes,
        },
      });
    }
  }

  private async _onRecordingStopped(useCloud: boolean): Promise<void> {
    console.log(
      `[Agent] Recording stopped. useCloud=${useCloud}, duration=${this.audioBuffer.durationSeconds.toFixed(
        1,
      )}s`,
    );

    this._emit({
      phase: 'processing',
      audioStats: {
        chunksReceived: this._chunksReceived,
        durationSeconds: this.audioBuffer.durationSeconds,
        totalBytes: this.audioBuffer.totalBytes,
      },
    });

    try {
      const result = await this.stt.transcribe(
        this.audioBuffer,
        useCloud,
        partial => this._emit({ partialText: partial }),
      );

      this._emit({
        transcript: result.text,
        partialText: '',
        phase: 'responding',
      });

      if (useCloud) {
        await this._handleOnline(result);
      } else {
        await this._handleOffline(result);
      }
    } catch (err: any) {
      console.error('[Agent] Eroare procesare:', err);
      this._emit({ phase: 'error', error: err.message });
    } finally {
      setTimeout(() => this._emit({ phase: 'idle', partialText: '' }), 3000);
    }
  }

  // ─── Online ───────────────────────────────────────────────────────────────

  private async _handleOnline(sttResult: STTResult): Promise<void> {
    // STTProcessor gestionează transcrierea, răspunsul și TTS-ul prin callbacks.
    console.log(`[Agent] Online flow complet: "${sttResult.text}"`);
  }

  // ─── Offline ──────────────────────────────────────────────────────────────

  private async _handleOffline(sttResult: STTResult): Promise<void> {
    const response = await this.offlineAgent.process(sttResult.text);
    this._emit({ response: response.text, phase: 'speaking' });
    console.log(`[Agent] Offline răspuns: "${response.text}"`);

    // TTS nativ — audio ajunge la Pi automat prin Bluetooth (call & media)
    await this.tts.speak(response.text, false);

    // Semnalăm Pi-ului că TTS s-a terminat
    await this.bt.sendCommand({ type: 'tts_done' });
    console.log('[Agent] tts_done trimis la Pi');
  }

  // ─── Emit stare ───────────────────────────────────────────────────────────

  private _emit(partial: Partial<AgentState>): void {
    this._onStateChange?.(partial);
  }

  setStateListener(cb: (s: Partial<AgentState>) => void): void {
    this._onStateChange = cb;
  }
}

// ─── React Hook ───────────────────────────────────────────────────────────────

export function useAgent(piMacAddress: string) {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const controllerRef = useRef<AgentController | null>(null);

  useEffect(() => {
    const controller = new AgentController(piMacAddress);
    controllerRef.current = controller;

    controller.setStateListener(partial => {
      setState(prev => ({ ...prev, ...partial }));
    });

    return () => {
      controller.disconnect();
      controllerRef.current = null;
    };
  }, [piMacAddress]);

  const connect = useCallback(async () => {
    await controllerRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    controllerRef.current?.disconnect();
  }, []);

  return { state, connect, disconnect };
}
