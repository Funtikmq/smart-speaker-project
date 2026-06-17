export interface ParsedCalendarDate {
  value: string;
  matchedText: string;
  date: Date;
}

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const DAY_WORDS: Record<string, number> = {
  one: 1,
  first: 1,
  two: 2,
  second: 2,
  three: 3,
  third: 3,
  four: 4,
  fourth: 4,
  five: 5,
  fifth: 5,
  six: 6,
  sixth: 6,
  seven: 7,
  seventh: 7,
  eight: 8,
  eighth: 8,
  nine: 9,
  ninth: 9,
  ten: 10,
  tenth: 10,
  eleven: 11,
  eleventh: 11,
  twelve: 12,
  twelfth: 12,
  thirteen: 13,
  thirteenth: 13,
  fourteen: 14,
  fourteenth: 14,
  fifteen: 15,
  fifteenth: 15,
  sixteen: 16,
  sixteenth: 16,
  seventeen: 17,
  seventeenth: 17,
  eighteen: 18,
  eighteenth: 18,
  nineteen: 19,
  nineteenth: 19,
  twenty: 20,
  twentieth: 20,
  thirty: 30,
  thirtieth: 30,
  thirtyone: 31,
  thirtyfirst: 31,
};

const DAY_SUFFIXES: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
};

const DAY_WORD_PATTERN =
  '(?:one|first|two|second|three|third|four|fourth|five|fifth|six|sixth|seven|seventh|eight|eighth|nine|ninth|ten|tenth|eleven|eleventh|twelve|twelfth|thirteen|thirteenth|fourteen|fourteenth|fifteen|fifteenth|sixteen|sixteenth|seventeen|seventeenth|eighteen|eighteenth|nineteen|nineteenth|twenty|twentieth|thirty|thirtieth)(?:\\s+(?:one|first|two|second|three|third|four|fourth|five|fifth|six|sixth|seven|seventh|eight|eighth|nine|ninth))?';
const DAY_PATTERN = `(?:\\d{1,2}(?:st|nd|rd|th)?|${DAY_WORD_PATTERN})`;

export class CalendarDateParser {
  parse(text: string, now = new Date()): ParsedCalendarDate | null {
    const normalized = this.normalize(text);
    return (
      this.parseDayBeforeMonth(normalized, now) ??
      this.parseMonthBeforeDay(normalized, now)
    );
  }

  resolve(value: string, now = new Date()): Date | null {
    const match = value.match(/^date:(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    return new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
    );
  }

  isCalendarDateValue(value?: string): boolean {
    return Boolean(value?.match(/^date:\d{4}-\d{2}-\d{2}$/));
  }

  private parseDayBeforeMonth(
    text: string,
    now: Date,
  ): ParsedCalendarDate | null {
    const monthAlternation = Object.keys(MONTHS).join('|');
    const match = text.match(
      new RegExp(
        `\\b(?:on\\s+)?(?:the\\s+)?(${DAY_PATTERN})\\s+(?:of\\s+)?(${monthAlternation})\\b`,
        'i',
      ),
    );
    if (!match) return null;

    const day = this.parseDay(match[1]);
    if (!day) return null;

    return this.buildResult(day, MONTHS[match[2].toLowerCase()], match[0], now);
  }

  private parseMonthBeforeDay(
    text: string,
    now: Date,
  ): ParsedCalendarDate | null {
    const monthAlternation = Object.keys(MONTHS).join('|');
    const match = text.match(
      new RegExp(
        `\\b(?:on\\s+)?(${monthAlternation})\\s+(?:the\\s+)?(${DAY_PATTERN})\\b`,
        'i',
      ),
    );
    if (!match) return null;

    const day = this.parseDay(match[2]);
    if (!day) return null;

    return this.buildResult(day, MONTHS[match[1].toLowerCase()], match[0], now);
  }

  private buildResult(
    day: number,
    month: number,
    matchedText: string,
    now: Date,
  ): ParsedCalendarDate | null {
    if (day < 1 || day > 31 || month < 0) return null;

    let year = now.getFullYear();
    let date = new Date(year, month, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (date.getTime() < today.getTime()) {
      year += 1;
      date = new Date(year, month, day);
    }

    return {
      value: `date:${year}-${String(month + 1).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`,
      matchedText: matchedText.trim(),
      date,
    };
  }

  private parseDay(input: string): number | null {
    const normalized = input
      .toLowerCase()
      .replace(/\b(the|of|on)\b/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const numeric = normalized.match(/^(\d{1,2})(?:st|nd|rd|th)?$/);
    if (numeric) return parseInt(numeric[1], 10);

    const compact = normalized.replace(/\s+/g, '');
    if (DAY_WORDS[compact]) return DAY_WORDS[compact];

    const parts = normalized.split(' ');
    if (parts.length === 2) {
      const tens = DAY_WORDS[parts[0]];
      const unit = DAY_SUFFIXES[parts[1]] ?? DAY_WORDS[parts[1]];
      if (tens === 20 && unit && unit < 10) return tens + unit;
      if (tens === 30 && unit === 1) return 31;
    }

    return DAY_WORDS[normalized] ?? null;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
