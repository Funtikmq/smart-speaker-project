/**
 * AlarmService.ts
 * Setează alarme reale pe Android folosind @notifee/react-native.
 *
 * Instalare: npm install @notifee/react-native
 *
 * Permisiuni necesare în AndroidManifest.xml:
 *   <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
 *   <uses-permission android:name="android.permission.USE_EXACT_ALARM"/>
 */

import notifee, {
  TriggerType,
  AndroidImportance,
  TimestampTrigger,
} from '@notifee/react-native';

export interface AlarmParams {
  time: string; // ex: "8:00 AM", "14:30"
  day?: string; // ex: "tomorrow", "monday", "today"
}

export class AlarmService {
  /**
   * Setează o alarmă și returnează textul de confirmare pentru TTS.
   */
  async setAlarm(params: AlarmParams): Promise<string> {
    const date = this._resolveDate(params.day);
    const { hours, minutes } = this._parseTime(params.time);

    date.setHours(hours, minutes, 0, 0);

    // Dacă ora a trecut deja azi și nu e specificată ziua, mutăm pe mâine
    if (date.getTime() < Date.now() && !params.day) {
      date.setDate(date.getDate() + 1);
    }

    // Creăm canalul de notificări (necesar pe Android 8+)
    await notifee.createChannel({
      id: 'alarm_channel',
      name: 'Alarms',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        title: 'Alarm',
        body: `Alarm for ${params.time}`,
        android: {
          channelId: 'alarm_channel',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500],
          pressAction: { id: 'default' },
        },
      },
      trigger,
    );

    const dayLabel = this._dayLabel(date, params.day);
    console.log(`[Alarm] Setat pentru ${date.toISOString()}`);
    return `Alarm set for ${params.time}${dayLabel}.`;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private _resolveDate(day?: string): Date {
    const now = new Date();
    if (!day || day === 'today') return new Date(now);

    if (day === 'tomorrow') {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }

    // Ziua săptămânii
    const weekdays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const targetDay = weekdays.indexOf(day.toLowerCase());
    if (targetDay !== -1) {
      const d = new Date(now);
      const currentDay = d.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      d.setDate(d.getDate() + daysUntil);
      return d;
    }

    return new Date(now);
  }

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

  private _dayLabel(date: Date, day?: string): string {
    if (!day || day === 'today') return ' today';
    if (day === 'tomorrow') return ' tomorrow';
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return ` on ${days[date.getDay()]}`;
  }
}
