/**
 * DateService.ts
 * Returnează data și ziua săptămânii de pe dispozitiv — zero permisiuni, zero net.
 * Suportă: azi, ieri, alaltaieri, mâine, poimâine (via offset în zile).
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export class DateService {
  getDate(offset = 0): string {
    const d = this._offsetDate(offset);
    const weekday = DAYS[d.getDay()];
    const month = MONTHS[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const label = this._dayLabel(offset);
    return `The date ${label} is ${weekday}, ${month} ${day}, ${year}.`;
  }

  getWeekday(offset = 0): string {
    const d = this._offsetDate(offset);
    const weekday = DAYS[d.getDay()];
    const label = this._dayLabel(offset);
    return `The day ${label} is ${weekday}.`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _offsetDate(offset: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }

  private _dayLabel(offset: number): string {
    switch (offset) {
      case -2:
        return 'the day before yesterday';
      case -1:
        return 'yesterday';
      case 0:
        return 'today';
      case 1:
        return 'tomorrow';
      case 2:
        return 'the day after tomorrow';
      default:
        return offset < 0
          ? `${Math.abs(offset)} days ago`
          : `in ${offset} days`;
    }
  }
}
