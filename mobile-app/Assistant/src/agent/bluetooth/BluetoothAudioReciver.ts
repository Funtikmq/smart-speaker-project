/**
 * BluetoothAudioReceiver.ts
 *
 * Protocolul REAL al Pi-ului (bluetooth_client.py):
 *   Fiecare mesaj = 1 byte tip + 2 bytes lungime big-endian + N bytes date
 *
 *   Tipuri:
 *     0x01 MSG_AUDIO   — chunk PCM16 audio (2560 bytes de obicei)
 *     0x02 MSG_COMMAND — JSON (recording_stopped, check_internet etc.)
 *     0x03 MSG_STATUS  — JSON (connected etc.)
 *
 * Telefonul = CLIENT RFCOMM, Pi-ul = SERVER RFCOMM.
 * Telefonul se conectează la adresa MAC a Pi-ului pe canalul 2.
 */

import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothDeviceReadEvent,
} from 'react-native-bluetooth-classic';
import NetInfo from '@react-native-community/netinfo';
import { PiMessage, NetStatusMsg } from '../protocol';

// ─── Constante protocol ───────────────────────────────────────────────────────

const MSG_AUDIO = 0x01;
const MSG_COMMAND = 0x02;
const MSG_STATUS = 0x03;

const HEADER_SIZE = 3; // 1 byte tip + 2 bytes lungime

// ─── Tipuri callback ──────────────────────────────────────────────────────────

export type AudioChunkCallback = (pcm16Bytes: Uint8Array) => void;
export type RecordingDoneCallback = (useCloud: boolean) => void;
export type StatusCallback = (status: BtStatus) => void;

export type BtStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'receiving_audio'
  | 'error';

// ─── BluetoothAudioReceiver ───────────────────────────────────────────────────

export class BluetoothAudioReceiver {
  private device: BluetoothDevice | null = null;
  private subscription: any = null;

  // Buffer intern pentru asamblarea frame-urilor parțiale
  private _rawBuffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);

  // Callbacks publice — setate de AgentController
  public onAudioChunk: AudioChunkCallback | null = null;
  public onRecordingStopped: RecordingDoneCallback | null = null;
  public onStatusChange: StatusCallback | null = null;

  private _status: BtStatus = 'disconnected';

  constructor(private readonly macAddress: string) {}

  // ─── Conectare ────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    this._setStatus('connecting');
    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      const found = paired.find((d: any) => d.address === this.macAddress);
      if (!found) {
        throw new Error(`Pi-ul (${this.macAddress}) nu e paired cu telefonul.`);
      }

      // charset 'latin1' (ISO-8859-1) — singurul charset Java care mapează
      // 1:1 bytes 0-255 fără să corupă date binare (PCM audio)
      this.device = await RNBluetoothClassic.connectToDevice(this.macAddress, {
        delimiter: '',
        charset: 'latin1',
      });
      this.subscription = this.device!.onDataReceived(this._onData.bind(this));

      this._setStatus('connected');
      console.log('[BT] Conectat la Pi:', this.macAddress);
    } catch (err) {
      this._setStatus('error');
      throw err;
    }
  }

  disconnect(): void {
    this.subscription?.remove();
    this.subscription = null;
    this.device?.disconnect().catch(() => {});
    this.device = null;
    this._rawBuffer = new Uint8Array(0);
    this._setStatus('disconnected');
    console.log('[BT] Deconectat.');
  }

  get status(): BtStatus {
    return this._status;
  }

  // ─── Trimitere mesaj la Pi ────────────────────────────────────────────────

  /**
   * Trimite un mesaj JSON la Pi cu același protocol:
   * 1 byte tip (MSG_COMMAND) + 2 bytes lungime + JSON bytes
   */
  async sendCommand(msg: object): Promise<void> {
    if (!this.device) throw new Error('Nu ești conectat la Pi.');

    const jsonBytes = _utf8Encode(JSON.stringify(msg));
    const frame = new Uint8Array(HEADER_SIZE + jsonBytes.length);

    frame[0] = MSG_COMMAND;
    frame[1] = (jsonBytes.length >> 8) & 0xff; // big-endian high byte
    frame[2] = jsonBytes.length & 0xff; // big-endian low byte
    frame.set(jsonBytes, HEADER_SIZE);

    await this.device.write(_bytesToBase64(frame), 'base64');
  }

  // ─── Parsing date primite ─────────────────────────────────────────────────

  private _onData(event: BluetoothDeviceReadEvent): void {
    // Cu charset=latin1, fiecare caracter din string are charCode = valoarea byte-ului original
    const str = event.data as string;
    const incoming = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      incoming[i] = str.charCodeAt(i) & 0xff;
    }

    // DEBUG — log primul frame primit ca să verificăm protocolul
    if (this._rawBuffer.length === 0 && incoming.length > 0) {
      console.log(
        `[BT] Primul frame: ${incoming.length} bytes, ` +
          `tip=0x${incoming[0].toString(16)}, ` +
          `len=${(incoming[1] << 8) | incoming[2]}`,
      );
    }

    this._rawBuffer = _concat(this._rawBuffer, incoming);
    this._processBuffer();
  }

  /**
   * Parsăm frame-uri complete din buffer.
   * Format: [tip:1][lungime:2 big-endian][date:lungime]
   */
  private _processBuffer(): void {
    while (this._rawBuffer.length >= HEADER_SIZE) {
      const msgType = this._rawBuffer[0];
      const length = (this._rawBuffer[1] << 8) | this._rawBuffer[2];

      // Așteptăm frame complet
      if (this._rawBuffer.length < HEADER_SIZE + length) break;

      const payload = this._rawBuffer.slice(HEADER_SIZE, HEADER_SIZE + length);
      this._rawBuffer = this._rawBuffer.slice(HEADER_SIZE + length);

      console.log(`[BT] Frame: tip=0x${msgType.toString(16)}, len=${length}`);
      this._handleFrame(msgType, payload);
    }
  }

  private async _handleFrame(
    msgType: number,
    payload: Uint8Array,
  ): Promise<void> {
    if (msgType === MSG_AUDIO) {
      // Chunk PCM16 de la microfon — trimitem direct la AgentController
      this._setStatus('receiving_audio');
      this.onAudioChunk?.(payload);
    } else if (msgType === MSG_COMMAND || msgType === MSG_STATUS) {
      // Mesaj JSON
      try {
        const msg: PiMessage = JSON.parse(_utf8Decode(payload));
        console.log('[BT] Mesaj Pi:', msg);

        if (msg.type === 'check_internet') {
          // Pi întreabă dacă telefonul are internet — răspundem imediat
          const netState = await NetInfo.fetch();
          const online =
            !!netState.isConnected && !!netState.isInternetReachable;
          const reply: NetStatusMsg = { type: 'net_status', online };
          await this.sendCommand(reply);
          console.log('[BT] Răspuns net_status:', online);
        } else if (msg.type === 'recording_stopped') {
          // Pi a terminat înregistrarea
          this._setStatus('connected');
          this.onRecordingStopped?.(msg.use_cloud);
        }
      } catch (err) {
        console.warn('[BT] JSON invalid:', err);
      }
    } else {
      console.warn('[BT] Tip mesaj necunoscut:', msgType);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _setStatus(s: BtStatus): void {
    if (this._status === s) return;
    this._status = s;
    this.onStatusChange?.(s);
  }
}

// ─── Utilitar ─────────────────────────────────────────────────────────────────

function _concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function _utf8Encode(text: string): Uint8Array {
  const escaped = unescape(encodeURIComponent(text));
  const bytes = new Uint8Array(escaped.length);

  for (let index = 0; index < escaped.length; index += 1) {
    bytes[index] = escaped.charCodeAt(index);
  }

  return bytes;
}

function _utf8Decode(bytes: Uint8Array): string {
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return decodeURIComponent(escape(binary));
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
