import { NativeCalendarManager } from '../native/NativeCalendarManager';
import { SpeechDateTimeParser } from './SpeechDateTimeParser';

export interface CalendarEventParams {
  title: string;
  day: string;
  time?: string;
}

export class CalendarService {
  private parser = new SpeechDateTimeParser();

  async setEvent(params: CalendarEventParams): Promise<string> {
    const date = this.parser.resolveDate(params.day);
    const hasExplicitTime = Boolean(params.time);
    const { hours, minutes } = hasExplicitTime
      ? this._parseTime(params.time!)
      : { hours: 8, minutes: 0 };

    date.setHours(hours, minutes, 0, 0);

    const end = new Date(date);
    end.setHours(end.getHours() + 1);

    const result = await NativeCalendarManager.createEvent(
      params.title,
      date.getTime(),
      end.getTime(),
      !hasExplicitTime,
    );

    const actualDate = new Date(result.startMillis);
    const spokenTime = this.parser.formatTimeForSpeech(
      `${actualDate.getHours()}:${actualDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
    );
    const spokenDay = this.parser.formatDayForSpeech(
      new Date(),
      actualDate,
      params.day,
    );

    return `Event "${params.title}" saved for ${spokenTime}${spokenDay}.`;
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
}
