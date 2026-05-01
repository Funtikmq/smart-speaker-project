export type SpokenDayReference =
  | 'today'
  | 'tomorrow'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ParsedAlarmInput {
  time: string | null;
  day: SpokenDayReference | null;
}

type ParsedTimeParts = {
  hours: number;
  minutes: number;
  period: 'am' | 'pm' | null;
};

const UNITS_DICT: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

const TENS_DICT: Record<string, number> = {
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fourty: 40,
  fifty: 50,
};

const FILLER_TOKENS = new Set([
  'for',
  'at',
  'a',
  'an',
  'the',
  'please',
  'alarm',
  'set',
  'to',
  'of',
  'in',
  'on',
  'clock',
  'oclock',
  'and',
]);

const DAY_TOKENS = new Set<SpokenDayReference | string>([
  'today',
  'tomorrow',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'alaltaieri',
  'ieri',
  'poimaine',
  'poimâine',
  'maine',
  'mâine',
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);
}

function wordToNumber(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return UNITS_DICT[normalized] ?? TENS_DICT[normalized] ?? null;
}

function parseNumericPhrase(tokens: string[]): number | null {
  if (!tokens.length) return null;

  if (tokens.length === 1) {
    const single = tokens[0];
    if (/^\d+$/.test(single)) return parseInt(single, 10);
    return wordToNumber(single);
  }

  const first = wordToNumber(tokens[0]);
  const second = wordToNumber(tokens[1]);

  if (first !== null && second !== null) {
    if (first >= 20 && first % 10 === 0 && second < 10) return first + second;
    if (first < 10 && second < 10) return first * 10 + second;
  }

  let total = 0;
  let seen = false;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      total += parseInt(token, 10);
      seen = true;
      continue;
    }

    const value = wordToNumber(token);
    if (value === null) return null;
    total += value;
    seen = true;
  }

  return seen ? total : null;
}

export class NaturalLanguageDateTimeService {
  parseAlarmInput(text: string): ParsedAlarmInput {
    return {
      time: this.parseTimeFromWords(text),
      day: this.extractDayReference(text),
    };
  }

  parseTimeFromWords(text: string): string | null {
    const parts = this._parseTimeParts(text);
    if (!parts) return null;

    const minutes = parts.minutes.toString().padStart(2, '0');
    if (parts.period) {
      return `${parts.hours}:${minutes} ${parts.period.toUpperCase()}`;
    }

    return `${parts.hours}:${minutes}`;
  }

  extractDayReference(text: string): SpokenDayReference | null {
    const t = text.toLowerCase().trim();

    if (t.includes('today')) return 'today';
    if (t.includes('tomorrow')) return 'tomorrow';

    const weekdays: SpokenDayReference[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    return weekdays.find(day => t.includes(day)) ?? null;
  }

  resolveDate(day?: string): Date {
    const now = new Date();
    if (!day || day === 'today') return new Date(now);

    if (day === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

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
      const date = new Date(now);
      const currentDay = date.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      date.setDate(date.getDate() + daysUntil);
      return date;
    }

    return new Date(now);
  }

  formatTimeForSpeech(timeStr: string): string {
    const parts = this._parseTimeParts(timeStr);
    if (!parts) return timeStr.toLowerCase();

    const minutes = parts.minutes.toString().padStart(2, '0');
    if (parts.period) {
      return `${parts.hours}:${minutes} ${parts.period}`;
    }

    return parts.minutes === 0 ? `${parts.hours}` : `${parts.hours}:${minutes}`;
  }

  formatDayForSpeech(now: Date, date: Date, day?: string): string {
    if (!day || day === 'today') {
      return this._isSameDay(now, date) ? ' today' : ' tomorrow';
    }

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

  private _parseTimeParts(text: string): ParsedTimeParts | null {
    const tokens = normalizeTokens(text);
    const timeTokens: string[] = [];

    for (const token of tokens) {
      if (DAY_TOKENS.has(token)) {
        continue;
      }

      if (FILLER_TOKENS.has(token)) {
        if (timeTokens.length === 0) {
          continue;
        }

        if (token === 'and') {
          continue;
        }
      }

      const isNumeric =
        /^\d+$/.test(token) ||
        token === 'am' ||
        token === 'pm' ||
        wordToNumber(token) !== null;

      if (isNumeric) {
        timeTokens.push(token);
        continue;
      }

      if (timeTokens.length > 0) {
        break;
      }
    }

    if (!timeTokens.length) return null;

    let period: 'am' | 'pm' | null = null;
    const periodIndex = timeTokens.findIndex(
      token => token === 'am' || token === 'pm',
    );
    if (periodIndex >= 0) {
      period = timeTokens[periodIndex] as 'am' | 'pm';
      timeTokens.splice(periodIndex, 1);
    }

    if (!timeTokens.length) return null;

    const hourToken = timeTokens[0];
    const hours = /^\d+$/.test(hourToken)
      ? parseInt(hourToken, 10)
      : wordToNumber(hourToken);

    if (hours === null || hours < 0 || hours > 23) return null;

    let minutes = 0;
    const minuteTokens = timeTokens.slice(1);
    if (minuteTokens.length > 0) {
      if (minuteTokens.includes('hundred')) {
        minutes = 0;
      } else {
        const parsedMinutes = parseNumericPhrase(minuteTokens);
        if (parsedMinutes === null || parsedMinutes < 0) return null;
        minutes = parsedMinutes;
        if (minutes > 59) minutes = minutes % 100;
        if (minutes > 59) minutes = 0;
      }
    }

    return { hours, minutes, period };
  }

  private _isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
