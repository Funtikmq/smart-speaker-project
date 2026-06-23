/**
 * AgentController.ts
 *
 * Agent controller - describes the current runtime flow:
 *
 * Flow actual:
 *   1. Pi detectează wake word și pornește recorderul.
 *   2. Pi trimite PCM chunks prin RFCOMM la aplicația mobilă.
 *   3. The phone always runs local Vosk STT first.
 *   4. The transcript is routed locally or forwarded to cloud based on the
 *      detected intent.
 *   5. Raw TTS audio received directly from the server is ignored by the app;
 *      native phone TTS keeps playback consistent through A2DP.
 *
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  BluetoothAudioReceiver,
  BtStatus,
} from './bluetooth/BluetoothAudioReciver';
import { AudioBuffer } from './bluetooth/AudioBuffer';
import { STTProcessor, STTResult } from './stt/STTProcessor';
import { TTSPlayer } from './tts/TTSPlayer';
import { OfflineAgent } from './offline/OfflineAgent';
import { IntentClassifier } from './offline/IntentClassifier';

// ─── Tipuri stare ─────────────────────────────────────────────────────────────

export type AgentPhase =
  | 'idle' // Waiting for the wake word on the Pi
  | 'connecting' // Connecting to the Pi over Bluetooth
  | 'listening' // The Pi is recording and we are receiving audio
  | 'processing' // We received all audio and are running STT
  | 'responding' // We have text and are deciding how to answer
  | 'speaking' // We are playing TTS
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
  private intentClassifier: IntentClassifier;
  private _acceptCloudCallbacks = false;
  private audioBuffer = new AudioBuffer();
  private _chunksReceived = 0;
  private _state: AgentState = INITIAL_STATE;
  private _isProcessingRecording = false;

  // Multiple listeners so each screen can subscribe without clobbering the others.
  private _stateListeners = new Set<(s: Partial<AgentState>) => void>();

  constructor(private readonly piMacAddress: string) {
    this.bt = new BluetoothAudioReceiver(piMacAddress);
    this.stt = new STTProcessor();
    this.tts = new TTSPlayer();
    this.offlineAgent = new OfflineAgent();
    this.intentClassifier = new IntentClassifier();

    // Vosk offline - initialize in the background.
    this.stt
      .initVosk()
      .catch(e => console.warn('[Agent] Vosk init failed:', e));

    // When the server sends text, update the UI and speak it natively.
    this.stt._onResponseText = async (text: string) => {
      if (!this._acceptCloudCallbacks) {
        console.log('[Agent] Ignoring stale cloud response text callback.');
        return;
      }

      this._emit({ response: text, phase: 'speaking' });
      try {
        await this.tts.speak(text, false);
        await this.bt.sendCommand({ type: 'tts_done' });
        console.log('[Agent] Sent tts_done to Pi (cloud flow)');
      } catch (err) {
        console.warn('[Agent] Native TTS playback failed:', err);
      }
    };

    this.stt._onCommand = async (commandMsg: any) => {
      if (!this._acceptCloudCallbacks) {
        console.log('[Agent] Ignoring stale cloud command callback.');
        return;
      }

      console.log(
        `[Agent] Command received from server: ${JSON.stringify(commandMsg)}`,
      );
      if (commandMsg.command === 'play_youtube' && commandMsg.payload?.url) {
        // Open it on the phone; audio will route to the speaker over A2DP.
        console.log(`[Agent] Opening on phone: ${commandMsg.payload.url}`);
        Linking.openURL(commandMsg.payload.url).catch(err =>
          console.error('[Agent] Linking.openURL failed:', err),
        );
      } else {
        console.log('[Agent] Forwarding command to the Pi...');
        await this.bt.sendCommand(commandMsg);
      }
    };

    // Ignore raw TTS audio from the server and prefer native playback.
    this.stt._onTTSReceived = (audioBytes: Uint8Array) => {
      console.log(
        `[Agent] Ignoring raw TTS audio from server (${audioBytes.length} bytes)`,
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
      console.log('[Agent] Connected to Pi and ready to listen.');
      this._emit({ phase: 'idle' });
    } catch (err: any) {
      this._emit({ phase: 'error', error: err.message });
      throw err;
    }
  }

  disconnect(force = false): void {
    if (!force) {
      console.log('[Agent] Ignoring non-forced disconnect request');
      return;
    }

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
    if (this._isProcessingRecording) {
      console.warn('[Agent] Ignoring duplicate recording_stopped while busy.');
      return;
    }

    this._isProcessingRecording = true;

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
        false,
        partial => this._emit({ partialText: partial }),
      );

      this._emit({
        transcript: result.text,
        partialText: '',
        phase: 'responding',
      });

      if (this._shouldUseCloud(result.text)) {
        await this._handleCloud(result.text);
      } else {
        await this._handleOffline(result);
      }
    } catch (err: any) {
      console.error('[Agent] Processing failed:', err);
      this._emit({
        phase: 'error',
        error: err.message || 'Processing failed.',
      });
    } finally {
      this._isProcessingRecording = false;
      setTimeout(() => this._emit({ phase: 'idle', partialText: '' }), 3000);
    }
  }

  private _shouldUseCloud(text: string): boolean {
    if (this.offlineAgent.hasPendingContext()) {
      return false;
    }

    const intent = this.intentClassifier.classify(text).intent;
    return intent === 'unknown';
  }

  // ─── Cloud ───────────────────────────────────────────────────────────────

  private async _handleCloud(text: string): Promise<void> {
    this._acceptCloudCallbacks = false;

    const netState = await NetInfo.fetch();
    const online = !!netState.isConnected && !!netState.isInternetReachable;

    if (!online) {
      const feedback =
        'No internet connection is available for cloud requests.';
      this._emit({ response: feedback, phase: 'speaking' });
      await this.tts.speak(feedback, false);
      await this.bt.sendCommand({ type: 'tts_done' });
      console.log('[Agent] Cloud request blocked: no internet connection.');
      return;
    }

    console.log(`[Agent] Sending request to cloud: "${text}"`);

    try {
      this._acceptCloudCallbacks = true;
      await this.stt.queryCloud(text);
      console.log('[Agent] Cloud flow completed.');
    } catch (err) {
      this._acceptCloudCallbacks = false;
      const feedback =
        'Cloud service is unavailable right now. Please try again later.';
      this._emit({ response: feedback, phase: 'speaking' });
      try {
        await this.tts.speak(feedback, false);
        await this.bt.sendCommand({ type: 'tts_done' });
      } catch (speechError) {
        console.warn('[Agent] Cloud fallback speech error:', speechError);
      }
      console.warn('[Agent] Cloud request failed:', err);
    } finally {
      this._acceptCloudCallbacks = false;
    }
  }

  // ─── Offline ──────────────────────────────────────────────────────────────

  private async _handleOffline(sttResult: STTResult): Promise<void> {
    const response = await this.offlineAgent.process(sttResult.text);
    this._emit({ response: response.text, phase: 'speaking' });
    console.log(`[Agent] Local response: "${response.text}"`);

    // Native TTS - audio reaches the Pi automatically through Bluetooth.
    await this.tts.speak(response.text, false);

    await this.bt.sendCommand({ type: 'tts_done' });
    console.log('[Agent] Sent tts_done to Pi');
  }

  // ─── Emit stare ───────────────────────────────────────────────────────────

  private _emit(partial: Partial<AgentState>): void {
    this._state = { ...this._state, ...partial };
    this._stateListeners.forEach(listener => listener(partial));
  }

  setStateListener(cb: (s: Partial<AgentState>) => void): () => void {
    this._stateListeners.add(cb);
    cb(this._state);
    return () => {
      this._stateListeners.delete(cb);
    };
  }

  getState(): AgentState {
    return this._state;
  }
}

// Shared controller singleton for the app — reuse across mounts
let sharedAgentController: AgentController | null = null;

function getSharedAgentController(piMacAddress: string): AgentController {
  if (!sharedAgentController) {
    sharedAgentController = new AgentController(piMacAddress);
  }
  return sharedAgentController;
}

// ─── React Hook ───────────────────────────────────────────────────────────────

export function useAgent(piMacAddress: string) {
  const [state, setState] = useState<AgentState>(INITIAL_STATE);
  const controllerRef = useRef<AgentController | null>(null);

  useEffect(() => {
    const controller = getSharedAgentController(piMacAddress);
    controllerRef.current = controller;

    setState(controller.getState());

    const unsubscribe = controller.setStateListener(partial => {
      setState(prev => ({ ...prev, ...partial }));
    });

    // Do NOT disconnect the shared controller on unmount — only unsubscribe.
    return () => {
      unsubscribe();
      controllerRef.current = null;
    };
  }, [piMacAddress]);

  const connect = useCallback(async () => {
    await controllerRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    controllerRef.current?.disconnect(true);
  }, []);

  return { state, connect, disconnect };
}
