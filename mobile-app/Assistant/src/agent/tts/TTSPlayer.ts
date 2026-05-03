/**
 * TTSPlayer.ts
 *
 * Text-to-Speech cu două moduri:
 *   - Offline: Android TTS nativ (react-native-tts)
 *   - Online:  gTTS prin serverul cloud — voce mai naturală
 *
 * Audio-ul e redirecționat automat la Pi prin conexiunea Bluetooth (call & media).
 * Nu mai e nevoie să trimitem WAV manual prin Bluetooth.
 */

import Tts from 'react-native-tts';

const CLOUD_WS_URL = 'ws://172.20.10.7:8765';

export class TTSPlayer {
  private _ttsReady = false;

  // ─── Inițializare ─────────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (this._ttsReady) return;
    try {
      console.log('[TTS] Încerc inițializare...');
      await Tts.getInitStatus();
      console.log('[TTS] getInitStatus OK');

      await Tts.setDefaultLanguage('en-US');
      console.log('[TTS] Limbă setată: en-US');

      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);
      this._ttsReady = true;
      console.log('[TTS] Android TTS inițializat (en-US)');
    } catch (err: any) {
      console.error(
        '[TTS] EROARE init:',
        JSON.stringify(err),
        err?.message,
        err?.code,
      );
    }
  }

  // ─── Redare ───────────────────────────────────────────────────────────────

  async speak(text: string, useCloud: boolean): Promise<void> {
    if (useCloud) {
      try {
        await this._speakCloud(text);
        return;
      } catch (err) {
        console.warn('[TTS] Cloud eșuat, fallback la nativ:', err);
      }
    }
    await this._speakNative(text);
  }

  // ─── Android TTS nativ ────────────────────────────────────────────────────

  private _speakNative(text: string): Promise<void> {
    return new Promise(resolve => {
      if (!this._ttsReady) {
        console.warn('[TTS] Android TTS neiniț., nu pot reda');
        resolve();
        return;
      }

      Tts.stop();

      let finished = false;
      const onFinish = () => {
        if (finished) return;
        finished = true;
        try {
          // remove listener if API supports it
          if ((Tts as any).removeEventListener) {
            (Tts as any).removeEventListener('tts-finish', onFinish as any);
          }
        } catch {}
        resolve();
      };

      try {
        if ((Tts as any).addEventListener) {
          (Tts as any).addEventListener('tts-finish', onFinish as any);
        }
      } catch {}

      // safety timeout in case event isn't fired
      const timeout = setTimeout(() => {
        onFinish();
      }, 10000);

      setTimeout(() => {
        Tts.speak(text);
        console.log(`[TTS] Nativ: "${text.substring(0, 80)}"`);
      }, 600);

      // ensure we clear timeout when resolved
      const origResolve = resolve;
      resolve = (v?: any) => {
        clearTimeout(timeout);
        try {
          origResolve(v);
        } catch {}
      };
    });
  }

  // ─── gTTS cloud ───────────────────────────────────────────────────────────

  private _speakCloud(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(CLOUD_WS_URL);
      (ws as any).binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout TTS cloud'));
      }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'tts_only', text }));
      };

      ws.onmessage = event => {
        if (event.data instanceof ArrayBuffer) {
          clearTimeout(timeout);
          ws.close();
          // Audio-ul ajunge la Pi automat prin Bluetooth (call & media)
          // Nu mai e nevoie să-l trimitem manual
          resolve();
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket TTS error'));
      };
    });
  }

  stop(): void {
    try {
      Tts.stop();
    } catch {}
  }
}
