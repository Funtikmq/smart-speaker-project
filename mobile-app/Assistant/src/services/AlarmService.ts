/**
 * AlarmService.ts
 * Setează alarme reale pe Android folosind AlarmManager nativ.
 *
 * Această abordare creează alarme persistente care vor suna chiar dacă
 * aplicația e închisă. Folosim native AlarmManager via AlarmModule.
 */

import { NativeAlarmManager } from '../native/NativeAlarmManager';
import { SpeechDateTimeParser } from './SpeechDateTimeParser';

export interface AlarmParams {
  time: string; // ex: "8:00 AM", "14:30"
  day?: string; // ex: "tomorrow", "monday", "today"
}

export class AlarmService {
  private parser = new SpeechDateTimeParser();

  /**
   * Setează o alarmă și returnează textul de confirmare pentru TTS.
   */
  async setAlarm(params: AlarmParams): Promise<string> {
    const now = new Date();
    const date = this.parser.resolveDate(params.day);
    const { hours, minutes } = this._parseTime(params.time);

    date.setHours(hours, minutes, 0, 0);

    // Dacă ora a trecut deja azi și nu e specificată ziua, mutăm pe mâine
    if (date.getTime() < Date.now() && !params.day) {
      date.setDate(date.getDate() + 1);
    }

    const spokenTime = this.parser.formatTimeForSpeech(params.time);
    const spokenDay = this.parser.formatDayForSpeech(now, date, params.day);

    try {
      // Apelează Clock app nativă pentru a crea alarma
      const dayLabel = params.day ? ` ${params.day}` : '';
      const label = `Smart Speaker${dayLabel}`;
      await NativeAlarmManager.setAlarmInClockApp(hours, minutes, label);

      console.log(
        `[Alarm] Setat în Clock app: ${hours}:${minutes
          .toString()
          .padStart(2, '0')} pe ${params.day || 'today'}`,
      );
      return `Alarm set for ${spokenTime}${spokenDay}.`;
    } catch (error) {
      console.error('[Alarm] Eroare setare alarmă:', error);
      throw error;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private _parseTime(timeStr: string): { hours: number; minutes: number } {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return { hours: 8, minutes: 0 };

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3]?.toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return { hours, minutes };
  }
}
