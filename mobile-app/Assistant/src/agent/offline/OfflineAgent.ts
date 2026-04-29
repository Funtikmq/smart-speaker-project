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

import { IntentClassifier, IntentName } from './IntentClassifier';
import { ConversationContext } from './ConversationContext';
import { TimeService, DateService, AlarmService } from '../../services';

export interface OfflineResponse {
  text: string;
  action?: string;
  param?: string;
}

const PARAM_QUESTIONS: Record<string, string> = {
  time: 'For what time?',
  day: 'For which day?',
};

export class OfflineAgent {
  private classifier = new IntentClassifier();
  private context = new ConversationContext();
  private timeService = new TimeService();
  private dateService = new DateService();
  private alarmService = new AlarmService();

  async process(transcript: string): Promise<OfflineResponse> {
    const t = transcript.toLowerCase().trim();
    console.log(`[Offline] Procesez: "${t}"`);

    // ── Dialog în curs ────────────────────────────────────────────────────
    if (this.context.hasPendingIntent) {
      return this._continueDialog(t);
    }

    // ── Clasificare intenție nouă ─────────────────────────────────────────
    const result = this.classifier.classify(t);
    console.log(`[Offline] Intent: ${result.intent} (score: ${result.score})`);

    return this._handleIntent(result.intent, result.params);
  }

  // ─── Handler intenție ─────────────────────────────────────────────────────

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

      default:
        return {
          text: "Sorry, I didn't understand that. You can ask me for the time, date, or to set an alarm.",
        };
    }
  }

  // ─── Alarmă ───────────────────────────────────────────────────────────────

  private async _handleAlarm(
    params: Record<string, string>,
  ): Promise<OfflineResponse> {
    const required = this.classifier.getRequiredParams('alarm');
    const missing = required.filter(p => !params[p]);

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
      console.error('[Offline] Eroare setare alarmă:', err);
      return { text: 'Sorry, I could not set the alarm. Please try again.' };
    }
  }

  // ─── Continuare dialog ────────────────────────────────────────────────────

  private async _continueDialog(transcript: string): Promise<OfflineResponse> {
    const pendingIntent = this.context.pendingIntent!;
    const nextParam = this.context.nextMissingParam!;

    console.log(
      `[Offline] Dialog în curs: intent=${pendingIntent}, aștept=${nextParam}`,
    );

    const extracted = this._extractParam(nextParam, transcript);

    if (!extracted) {
      const question = PARAM_QUESTIONS[nextParam] ?? 'Could you repeat that?';
      return { text: `I didn't catch that. ${question}` };
    }

    this.context.addParam(nextParam, extracted);

    if (this.context.isComplete()) {
      if (pendingIntent === 'alarm') {
        return this._executeAlarm(this.context.collectedParams);
      }
    }

    const nextMissing = this.context.nextMissingParam!;
    const question =
      PARAM_QUESTIONS[nextMissing] ?? 'Can you give me more details?';
    return { text: question };
  }

  // ─── Extragere parametru din răspuns liber ────────────────────────────────

  private _extractParam(paramName: string, text: string): string | null {
    switch (paramName) {
      case 'time': {
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
        if (text.includes('tomorrow')) return 'tomorrow';
        if (text.includes('today')) return 'today';
        const days = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];
        return days.find(d => text.includes(d)) ?? null;
      }
      default:
        return null;
    }
  }

  resetContext(): void {
    this.context.reset();
  }
}
