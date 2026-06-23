/**
 * OfflineAgent.ts
 *
 * Router principal pentru comenzi offline.
 * Folosește IntentClassifier pentru a detecta intenția și
 * ConversationContext pentru dialog multi-turn.
 *
 * Exemple:
 *   "what time is it"              → "The time is 10:30 AM."
 *   "what date is tomorrow"        → "The date tomorrow is Monday, April 27, 2026."
 *   "what date was yesterday"      → "The date yesterday was Saturday, April 25, 2026."
 *   "what day was the day before yesterday" → "The day the day before yesterday was Friday."
 *   "what day will it be the day after tomorrow" → "The day the day after tomorrow is Tuesday."
 *   "set an alarm"                 → "For what time?"
 *   "at 8 AM"                      → "Alarm set for 8:00 AM today."
 */

import {
  IntentClassifier,
  type IntentName,
  ConversationContext,
} from './index';
import {
  TimeService,
  DateService,
  AlarmService,
  CalendarService,
  CalendarDateParser,
  SpeechDateTimeParser,
} from '../../services';

export interface OfflineResponse {
  text: string;
  action?: string;
  param?: string;
}

const PARAM_QUESTIONS: Record<string, string> = {
  time: 'For what time?',
  day: 'For which day?',
  title: 'What is the event title?',
};

export class OfflineAgent {
  private classifier = new IntentClassifier();
  private context = new ConversationContext();
  private parser = new SpeechDateTimeParser();
  private timeService = new TimeService();
  private dateService = new DateService();
  private alarmService = new AlarmService();
  private calendarService = new CalendarService();
  private calendarDateParser = new CalendarDateParser();

  hasPendingContext(): boolean {
    return this.context.hasPendingIntent;
  }

  async process(transcript: string): Promise<OfflineResponse> {
    const t = transcript.toLowerCase().trim();
    console.log(`[Offline] Processing: "${t}"`);

    // ── Ongoing dialog ────────────────────────────────────────────────────
    if (this.context.hasPendingIntent) {
      return this._continueDialog(t);
    }

    // ── New intent classification ─────────────────────────────────────────
    const result = this.classifier.classify(t);
    console.log(`[Offline] Intent: ${result.intent} (score: ${result.score})`);
    const params: Record<string, string> = { ...result.params };
    if (result.intent === 'alarm') {
      const parsed = this.parser.parseAlarmInput(t);
      if (parsed.time) {
        params.time = parsed.time;
      }
      if (parsed.day) {
        params.day = parsed.day;
      }
    } else if (result.intent === 'event') {
      Object.assign(params, this._extractEventParams(t));
    }

    return this._handleIntent(result.intent, params);
  }

  // ─── Intent handler ─────────────────────────────────────────────────────

  private async _handleIntent(
    intent: IntentName,
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    const offset =
      params.offset !== undefined ? parseInt(params.offset, 10) : 0;

    switch (intent) {
      case 'time':
        return { text: this.timeService.getTime() };

      case 'date':
        return { text: this.dateService.getDate(offset) };

      case 'weekday':
        return { text: this.dateService.getWeekday(offset) };

      case 'alarm':
        return this._handleAlarm(params);

      case 'event':
        return this._handleEvent(params);

      default:
        return {
          text: "Sorry, I didn't understand that. You can ask me for the time, date, to set an alarm, or to add a calendar event.",
        };
    }
  }

  // ─── Alarm ───────────────────────────────────────────────────────────────

  private async _handleAlarm(
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    const required = this.classifier.getRequiredParams('alarm');
    const missing = required.filter((paramName: string) => !params[paramName]);

    if (missing.length > 0) {
      this.context.start('alarm', params, missing);
      const question =
        PARAM_QUESTIONS[missing[0]] ?? 'Can you give me more details?';
      return { text: question };
    }

    return this._executeAlarm(params);
  }

  private async _executeAlarm(
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    try {
      const text = await this.alarmService.setAlarm({
        time: params.time,
        day: params.day,
      });
      this.context.reset();
      return { text, action: 'alarm', param: params.time };
    } catch (err: any) {
      this.context.reset();
      console.error('[Offline] Alarm setup error:', err);
      return { text: 'Sorry, I could not set the alarm. Please try again.' };
    }
  }

  // Event

  private async _handleEvent(
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    const required = this.classifier.getRequiredParams('event');
    const missing = required.filter((paramName: string) => !params[paramName]);

    if (missing.length > 0) {
      this.context.start('event', params, missing);
      const question =
        PARAM_QUESTIONS[missing[0]] ?? 'Can you give me more details?';
      return { text: question };
    }

    return this._executeEvent(params);
  }

  private async _executeEvent(
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    try {
      const text = await this.calendarService.setEvent({
        title: params.title,
        day: params.day,
        time: params.time,
      });
      this.context.reset();
      return { text, action: 'event', param: params.title };
    } catch (err: any) {
      this.context.reset();
      console.error('[Offline] Calendar event setup error:', err);
      return {
        text: 'Sorry, I could not save the calendar event. Please try again.',
      };
    }
  }

  // ─── Continue dialog ────────────────────────────────────────────────────

  private async _continueDialog(transcript: string): Promise<OfflineResponse> {
    const pendingIntent = this.context.pendingIntent!;
    const nextParam = this.context.nextMissingParam!;

    console.log(
      `[Offline] Dialog in progress: intent=${pendingIntent}, waiting=${nextParam}`,
    );

    if (pendingIntent === 'alarm') {
      const extracted = this.parser.parseAlarmInput(transcript);

      if (extracted.time) {
        this.context.addParam('time', extracted.time);
      }

      if (extracted.day) {
        this.context.addParam('day', extracted.day);
      }

      if (!this.context.collectedParams[nextParam]) {
        const question = PARAM_QUESTIONS[nextParam] ?? 'Could you repeat that?';
        return { text: `I didn't catch that. ${question}` };
      }
    } else if (pendingIntent === 'event') {
      const extracted = this._extractEventParams(transcript);

      if (extracted.title) {
        this.context.addParam('title', extracted.title);
      }

      if (extracted.day) {
        this.context.addParam('day', extracted.day);
      }

      if (extracted.time) {
        this.context.addParam('time', extracted.time);
      }

      if (!this.context.collectedParams[nextParam]) {
        const fallback = this._extractParam(nextParam, transcript);
        if (fallback) {
          this.context.addParam(nextParam, fallback);
        }
      }

      if (!this.context.collectedParams[nextParam]) {
        const question = PARAM_QUESTIONS[nextParam] ?? 'Could you repeat that?';
        return { text: `I didn't catch that. ${question}` };
      }
    } else {
      const extracted = this._extractParam(nextParam, transcript);

      if (!extracted) {
        const question = PARAM_QUESTIONS[nextParam] ?? 'Could you repeat that?';
        return { text: `I didn't catch that. ${question}` };
      }

      this.context.addParam(nextParam, extracted);
    }

    if (this.context.isComplete()) {
      if (pendingIntent === 'alarm') {
        return this._executeAlarm(this.context.collectedParams);
      }
      if (pendingIntent === 'event') {
        return this._executeEvent(this.context.collectedParams);
      }
    }

    const nextMissing = this.context.nextMissingParam!;
    const question =
      PARAM_QUESTIONS[nextMissing] ?? 'Can you give me more details?';
    return { text: question };
  }

  // ─── Extract parameter from free-form answer ──────────────────────────────

  private _extractParam(paramName: string, text: string): string | null {
    switch (paramName) {
      case 'time': {
        const fromWords = this.parser.parseTimeFromWords(text);
        if (fromWords) return fromWords;

        // Fallback to a digit regex (e.g. "8:00 am", "14:30")
        const match = text.match(
          /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
        );
        if (!match) return null;
        const h = match[1];
        const m = match[2] ? `:${match[2]}` : ':00';
        const period = match[3] ? ` ${match[3].toUpperCase()}` : '';
        return `${h}${m}${period}`;
      }
      case 'day': {
        return this.parser.extractDayReference(text);
      }
      case 'title': {
        return this._extractEventTitle(text);
      }
      default:
        return null;
    }
  }

  private _extractEventParams(text: string): Record<string, string> {
    const params: Record<string, string> = {};
    const calendarDate = this.calendarDateParser.parse(text);
    const textWithoutCalendarDate = calendarDate
      ? this._removeTextSpan(text, calendarDate.matchedText)
      : text;
    const day = calendarDate?.value ?? this.parser.extractDayReference(text);
    const time = this.parser.parseTimeFromWords(textWithoutCalendarDate);

    if (time) {
      params.time = time;
    }

    if (day) {
      params.day = day;
    }

    const title = this._extractEventTitle(textWithoutCalendarDate);
    if (title) {
      params.title = title;
    }

    return params;
  }

  private _extractEventTitle(text: string): string | null {
    const normalized = text
      .toLowerCase()
      .replace(/[.,!?;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const explicit = normalized.match(
      /\b(?:called|named|titled|title)\s+(.+?)(?:\s+(?:today|tomorrow|on|at)\b|$)/,
    );
    if (explicit?.[1]) {
      return this._cleanEventTitle(explicit[1]);
    }

    const afterCommand = normalized.replace(
      /^(?:please\s+)?(?:set|said|sent|add|create|schedule)\s+(?:(?:a|an|am|in)\s+)?(?:calendar\s+)?(?:event)?\s*/i,
      '',
    );
    const withoutDateTime = afterCommand
      .replace(
        /\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*$/i,
        '',
      )
      .replace(/\b(?:for|on)\s*$/i, '')
      .replace(/\b(?:on|at)\s+.*$/i, '')
      .trim();

    return this._cleanEventTitle(withoutDateTime);
  }

  private _removeTextSpan(text: string, span: string): string {
    const escaped = span.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'i'), ' ');
  }

  private _cleanEventTitle(title: string): string | null {
    const cleaned = title
      .replace(
        /^(?:please\s+)?(?:(?:set|said|sent|add|create|schedule)\s+)?(?:(?:a|an|am|in)\s+)?(?:calendar\s+)?(?:event\s+)?(?:for|about)?\s*/i,
        '',
      )
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned || cleaned.length < 2) return null;

    return cleaned.replace(/\b\w/g, char => char.toUpperCase());
  }

  resetContext(): void {
    this.context.reset();
  }
}
