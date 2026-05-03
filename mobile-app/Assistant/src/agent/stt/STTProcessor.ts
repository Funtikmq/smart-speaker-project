/**
 * STTProcessor.ts
 */

import { AudioBuffer } from '../bluetooth/AudioBuffer';
import { VoskSTT } from './VoskSTT';

export type STTResult = {
  text: string;
  confidence: number;
  source: 'local' | 'cloud';
};

export type STTProgressCallback = (partial: string) => void;

const CLOUD_WS_URL = 'ws://172.20.10.7:8765';

export class STTProcessor {
  private _vosk: VoskSTT | null = null;
  private _voskReady: Promise<void> | null = null; // ← așteptăm inițializarea

  // Callbacks setate de AgentController
  public _onTTSReceived: ((audio: Uint8Array) => void) | null = null;
  public _onResponseText: ((text: string) => void) | null = null;

  async initVosk(): Promise<void> {
    await this._ensureVoskReady();
  }

  private async _ensureVoskReady(): Promise<void> {
    if (!this._vosk) {
      this._vosk = new VoskSTT();
    }

    // Dacă nu avem inițializare în curs sau Vosk a fost distrus între timp,
    // relansăm init pentru a permite sesiuni multiple connect/disconnect.
    if (!this._voskReady || !this._vosk.isReady) {
      this._voskReady = this._vosk.init();
    }

    await this._voskReady;
  }

  async transcribe(
    buffer: AudioBuffer,
    useCloud: boolean,
    onPartial?: STTProgressCallback,
  ): Promise<STTResult> {
    if (useCloud) {
      return this._transcribeCloud(buffer, onPartial);
    } else {
      return this._transcribeLocal(buffer);
    }
  }

  // ─── Online: WebSocket → Whisper cloud ───────────────────────────────────

  private _transcribeCloud(
    buffer: AudioBuffer,
    onPartial?: STTProgressCallback,
  ): Promise<STTResult> {
    return new Promise((resolve, reject) => {
      onPartial?.('Conectare la server...');

      const ws = new WebSocket(CLOUD_WS_URL);
      (ws as any).binaryType = 'arraybuffer';

      let transcriptionText = '';

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout server STT (15s)'));
      }, 15000);

      ws.onopen = () => {
        onPartial?.('Se trimite audio...');
        const pcm = buffer.toPCM16();
        ws.send(pcm);
        // Inform server that the client (phone) prefers to handle TTS
        // locally (native TTS). This hints the server to skip sending
        // back synthesized audio. Default server behavior remains unchanged
        // if this field is omitted (for Pi direct connections).
        ws.send(
          JSON.stringify({
            type: 'recording_stopped',
            play_tts_on_server: false,
          }),
        );
        onPartial?.('Se transcrie...');
      };

      ws.onmessage = event => {
        if (event.data instanceof ArrayBuffer) {
          clearTimeout(timeout);
          const audioBytes = new Uint8Array(event.data);
          console.log(`[STT] TTS audio primit: ${audioBytes.length} bytes`);
          this._onTTSReceived?.(audioBytes);
          ws.close();
          resolve({
            text: transcriptionText,
            confidence: 1.0,
            source: 'cloud',
          });
          return;
        }

        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'transcription') {
            transcriptionText = msg.text || '';
            onPartial?.(transcriptionText);
            console.log(`[STT] Transcriere: "${transcriptionText}"`);
          } else if (msg.type === 'response') {
            console.log(`[STT] Răspuns text: "${msg.text}"`);
            this._onResponseText?.(msg.text);
          }
        } catch (e) {
          console.warn('[STT] Mesaj neparsabil:', e);
        }
      };

      ws.onerror = e => {
        clearTimeout(timeout);
        reject(new Error(`Eroare WebSocket STT: ${JSON.stringify(e)}`));
      };

      ws.onclose = e => {
        clearTimeout(timeout);
        if (e.code !== 1000 && !transcriptionText) {
          reject(new Error(`WebSocket închis: ${e.code}`));
        }
      };
    });
  }

  // ─── Local (Vosk offline) ─────────────────────────────────────────────────

  private async _transcribeLocal(buffer: AudioBuffer): Promise<STTResult> {
    await this._ensureVoskReady();

    const text = await this._vosk!.transcribe(buffer);
    return {
      text: text || '[Vosk: nimic recunoscut]',
      confidence: 1.0,
      source: 'local',
    };
  }

  destroy(): void {
    this._vosk?.destroy();
    this._vosk = null;
    this._voskReady = null;
  }
}
