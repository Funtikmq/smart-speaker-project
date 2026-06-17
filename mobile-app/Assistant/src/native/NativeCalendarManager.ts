import { NativeModules, Platform } from 'react-native';

const { CalendarModule } = NativeModules;

export interface NativeCalendarEventResult {
  eventId: number;
  startMillis: number;
}

export class NativeCalendarManager {
  static async createEvent(
    title: string,
    startMillis: number,
    endMillis: number,
    autoIncrementHour: boolean,
  ): Promise<NativeCalendarEventResult> {
    if (Platform.OS !== 'android') {
      console.warn('[NativeCalendarManager] Not on Android, skipping');
      return { eventId: -1, startMillis };
    }

    if (!CalendarModule) {
      throw new Error('CalendarModule not available');
    }

    return CalendarModule.createEvent(
      title,
      startMillis,
      endMillis,
      autoIncrementHour,
    );
  }
}
