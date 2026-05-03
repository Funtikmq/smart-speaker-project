import { NativeModules, Platform } from 'react-native';

const { AlarmModule } = NativeModules;

/**
 * Interfață wrapper pentru AlarmManager nativ.
 * Permite setarea și anularea de alarme reale pe Android.
 */
export class NativeAlarmManager {
  /**
   * Setează o alarmă în Android Clock app nativă
   * @param hours - ora (0-23)
   * @param minutes - minute (0-59)
   * @param label - descriere alarme
   */
  static async setAlarmInClockApp(
    hours: number,
    minutes: number,
    label: string,
  ): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('[NativeAlarmManager] Not on Android, skipping');
      return;
    }

    if (!AlarmModule) {
      throw new Error('AlarmModule not available');
    }

    try {
      const result = await AlarmModule.setAlarmInClockApp(
        hours,
        minutes,
        label,
      );
      console.log(`[NativeAlarmManager] ${result}`);
    } catch (error) {
      console.error(
        '[NativeAlarmManager] Error setting alarm in Clock app:',
        error,
      );
      throw error;
    }
  }
}
