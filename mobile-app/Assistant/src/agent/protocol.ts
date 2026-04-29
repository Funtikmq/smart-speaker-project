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
};

export type PiMessage = CheckInternetMsg | RecordingStoppedMsg;

export type NetStatusMsg = {
  type: 'net_status';
  online: boolean;
};
