export const AUDIO_FORMAT = {
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  chunkBytes: 2560,
} as const;

export type CheckInternetMsg = {
  type: 'check_internet';
};

export type RecordingStoppedMsg = {
  type: 'recording_stopped';
  use_cloud: boolean;
  // If set to false, server should skip synthesizing/sending TTS audio
  // and only reply with textual response. Defaults to true if omitted.
  play_tts_on_server?: boolean;
};

export type PiMessage = CheckInternetMsg | RecordingStoppedMsg;

export type NetStatusMsg = {
  type: 'net_status';
  online: boolean;
};
