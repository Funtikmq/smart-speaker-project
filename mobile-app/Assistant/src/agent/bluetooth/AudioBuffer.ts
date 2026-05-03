/**
 * AudioBuffer.ts
 *
 * Acumulează chunk-urile PCM16 primite de la Pi și le asamblează
 * într-un buffer complet gata pentru STT.
 *
 * Pi trimite: PCM16, 16kHz, mono, chunks de 2560 bytes
 * STT primește: același format, dar ca buffer continuu sau fișier WAV
 */

import { AUDIO_FORMAT } from '../protocol';

export class AudioBuffer {
  private _chunks: Uint8Array[] = [];
  private _totalBytes = 0;

  // ─── Acumulare ────────────────────────────────────────────────────────────

  addChunk(chunk: Uint8Array): void {
    this._chunks.push(chunk);
    this._totalBytes += chunk.length;
  }

  get totalBytes(): number {
    return this._totalBytes;
  }

  get durationSeconds(): number {
    // bytes / (sampleRate * channels * bytesPerSample)
    return (
      this._totalBytes / (AUDIO_FORMAT.sampleRate * AUDIO_FORMAT.channels * 2)
    );
  }

  clear(): void {
    this._chunks = [];
    this._totalBytes = 0;
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  /**
   * Returnează tot audio-ul ca un singur Uint8Array PCM16 raw.
   * Folosit pentru STT local (Vosk, Whisper on-device).
   */
  toPCM16(): Uint8Array {
    const result = new Uint8Array(this._totalBytes);
    let offset = 0;
    for (const chunk of this._chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  /**
   * Construiește un fișier WAV complet (cu header RIFF) din datele acumulate.
   * Folosit pentru STT cloud (Whisper pe server sau Android SpeechRecognizer).
   *
   * Format WAV output: 16kHz, 16-bit, mono — același ca input.
   */
  toWAV(): Uint8Array {
    const pcm = this.toPCM16();
    const header = _buildWavHeader({
      sampleRate: AUDIO_FORMAT.sampleRate,
      numChannels: AUDIO_FORMAT.channels,
      bitsPerSample: AUDIO_FORMAT.bitsPerSample,
      dataLength: pcm.length,
    });

    const wav = new Uint8Array(header.length + pcm.length);
    wav.set(header, 0);
    wav.set(pcm, header.length);
    return wav;
  }

  /**
   * Returnează un base64 string al fișierului WAV.
   * Util pentru trimiterea prin HTTP sau afișare în UI.
   */
  toWAVBase64(): string {
    const wav = this.toWAV();
    return _bytesToBase64(wav);
  }
}

// ─── WAV header builder ───────────────────────────────────────────────────────

interface WavParams {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  dataLength: number; // bytes PCM
}

function _buildWavHeader(p: WavParams): Uint8Array {
  const blockAlign = (p.numChannels * p.bitsPerSample) / 8;
  const byteRate = p.sampleRate * blockAlign;
  const chunkSize = 36 + p.dataLength;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const enc = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  enc(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  enc(8, 'WAVE');
  enc(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM subchunk size
  view.setUint16(20, 1, true); // AudioFormat = PCM
  view.setUint16(22, p.numChannels, true);
  view.setUint32(24, p.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, p.bitsPerSample, true);
  enc(36, 'data');
  view.setUint32(40, p.dataLength, true);

  return new Uint8Array(header);
}

function _bytesToBase64(bytes: Uint8Array): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const byte3 = index + 2 < bytes.length ? bytes[index + 2] : 0;

    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(triplet >> 18) & 0x3f];
    output += alphabet[(triplet >> 12) & 0x3f];
    output += index + 1 < bytes.length ? alphabet[(triplet >> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? alphabet[triplet & 0x3f] : '=';
  }

  return output;
}
