import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import { AudioBuffer } from '../bluetooth/AudioBuffer';

const { VoskFile } = NativeModules as { VoskFile: any };

const MODEL_DIR = `${RNFS.DocumentDirectoryPath}/vosk-model-small-en-us-0.15`;
const MODEL_ASSET = 'vosk-model-small-en-us-0.15';
const MODEL_REQUIRED_FILES = [
  `${MODEL_DIR}/am/final.mdl`,
  `${MODEL_DIR}/conf/model.conf`,
];

export type VoskInitCallback = (progress: number, status: string) => void;

export class VoskSTT {
  private _initialized = false;

  private async _isModelReady(): Promise<boolean> {
    for (const filePath of MODEL_REQUIRED_FILES) {
      const exists = await RNFS.exists(filePath);
      if (!exists) return false;
    }
    return true;
  }

  private async _copyModelFromAssets(
    onProgress?: VoskInitCallback,
  ): Promise<void> {
    onProgress?.(10, 'Se copiază modelul...');
    await RNFS.unlink(MODEL_DIR).catch(() => {});
    await VoskFile.copyModelFromAssets(MODEL_ASSET, MODEL_DIR);
    console.log('[Vosk] Model copiat din assets în:', MODEL_DIR);
  }

  async init(onProgress?: VoskInitCallback): Promise<void> {
    if (this._initialized) return;

    if (!VoskFile) {
      throw new Error('VoskFile native module nu este disponibil pe Android.');
    }

    const modelReady = await this._isModelReady();
    if (!modelReady) {
      console.warn('[Vosk] Model lipsă/incomplet. Recopiez din assets...');
      await this._copyModelFromAssets(onProgress);
    }

    onProgress?.(50, 'Se încarcă modelul...');
    console.log('[Vosk] Încarc modelul din:', MODEL_DIR);

    try {
      await VoskFile.loadModel(MODEL_DIR);
    } catch (err) {
      console.error('[Vosk] loadModel a eșuat la prima încercare:', err);
      console.warn('[Vosk] Recopiez modelul și reîncerc încărcarea...');
      await this._copyModelFromAssets(onProgress);
      await VoskFile.loadModel(MODEL_DIR);
    }

    this._initialized = true;
    console.log('[Vosk] Model încărcat.');
    onProgress?.(100, 'Model gata');
  }

  async transcribe(buffer: AudioBuffer): Promise<string> {
    if (!this._initialized) {
      throw new Error('VoskSTT: apelați init() mai întâi.');
    }

    const wavPath = `${RNFS.TemporaryDirectoryPath}/pi_audio_${Date.now()}.wav`;
    await (RNFS as any).writeFile(wavPath, buffer.toWAVBase64(), 'base64');
    console.log(
      `[Vosk] WAV: ${wavPath} (${buffer.durationSeconds.toFixed(1)}s)`,
    );

    try {
      const text =
        (await VoskFile.transcribeFile(wavPath))?.toString().trim() || '';
      console.log(`[Vosk] Transcriere: "${text}"`);
      await RNFS.unlink(wavPath).catch(() => {});
      return text;
    } catch (err) {
      console.error('[Vosk] Eroare transcriere:', err);
      await RNFS.unlink(wavPath).catch(() => {});
      return '';
    }
  }

  destroy(): void {
    this._initialized = false;
  }

  get isReady(): boolean {
    return this._initialized;
  }
}
