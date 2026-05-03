declare module '@react-native-community/netinfo' {
  type NetInfoState = {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  };

  const NetInfo: {
    fetch(): Promise<NetInfoState>;
  };

  export default NetInfo;
}

declare module '@react-native-voice/voice' {
  export type SpeechResultsEvent = {
    value?: string[];
  };

  type SpeechErrorEvent = {
    error?: {
      message?: string;
    };
  };

  type VoiceModule = {
    onSpeechResults: ((e: SpeechResultsEvent) => void) | null;
    onSpeechPartialResults: ((e: SpeechResultsEvent) => void) | null;
    onSpeechError: ((e: SpeechErrorEvent) => void) | null;
    destroy(): Promise<void>;
    removeAllListeners(): void;
  };

  const Voice: VoiceModule;
  export default Voice;
}

declare module 'react-native-fs' {
  type DownloadProgressData = {
    bytesWritten: number;
    contentLength: number;
  };

  type DownloadFileOptions = {
    fromUrl: string;
    toFile: string;
    progress?: (res: DownloadProgressData) => void;
    progressDivider?: number;
  };

  const RNFS: {
    TemporaryDirectoryPath: string;
    DocumentDirectoryPath: string;
    exists(path: string): Promise<boolean>;
    writeFile(
      path: string,
      contents: string,
      encoding: 'base64',
    ): Promise<void>;
    unlink(path: string): Promise<void>;
    downloadFile(options: DownloadFileOptions): {
      promise: Promise<void>;
    };
  };

  export default RNFS;
}

declare module 'react-native-zip-archive' {
  export function unzip(source: string, target: string): Promise<string>;
}
