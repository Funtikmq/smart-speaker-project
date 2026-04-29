/**
 * agent/index.ts — barrel export
 *
 * Tot ce importă screens/ vine de aici:
 *
 *   import { useAgent, AgentState, AgentPhase } from '../agent';
 */

export { useAgent, AgentController } from './AgentController';
export type { AgentState, AgentPhase } from './AgentController';
export { BluetoothAudioReceiver } from './bluetooth/BluetoothAudioReciver';
export type { BtStatus } from './bluetooth/BluetoothAudioReciver';
export { AudioBuffer } from './bluetooth/AudioBuffer';
export { STTProcessor } from './stt/STTProcessor';
export type { STTResult } from './stt/STTProcessor';
export { AUDIO_FORMAT } from './protocol';