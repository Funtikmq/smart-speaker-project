/**
 * IntentClassifier.ts
 *
 * Clasifică intenția utilizatorului pe baza unui sistem de scoruri.
 * Fiecare keyword găsit în transcript adaugă puncte intenției respective.
 * Câștigă intenția cu scorul maxim (dacă depășește pragul minim).
 */

export type IntentName = 'time' | 'date' | 'weekday' | 'alarm' | 'unknown';

export interface IntentResult {
  intent: IntentName;
  score: number;
  params: Record<string, string>;
}

interface IntentDefinition {
  name: IntentName;
  keywords: { word: string; weight: number }[];
  requiredParams: string[];
  extractParams: (text: string) => Record<string, string>;
}

// ─── Extragere offset zi ──────────────────────────────────────────────────────

export function extractDayOffset(text: string): number {
  if (text.includes('day before yesterday') || text.includes('alaltaieri'))
    return -2;
  if (text.includes('yesterday') || text.includes('ieri')) return -1;
  if (
    text.includes('day after tomorrow') ||
    text.includes('poimâine') ||
    text.includes('poimaine')
  )
    return 2;
  if (
    text.includes('tomorrow') ||
    text.includes('mâine') ||
    text.includes('maine')
  )
    return 1;
  return 0; // today / default
}

// ─── Definiții intenții ───────────────────────────────────────────────────────

const INTENTS: IntentDefinition[] = [
  {
    name: 'time',
    keywords: [
      { word: 'time', weight: 2 },
      { word: 'clock', weight: 2 },
      { word: 'hour', weight: 2 },
      { word: 'what time', weight: 3 },
      { word: "what's the time", weight: 3 },
      { word: 'current time', weight: 3 },
    ],
    requiredParams: [],
    extractParams: () => ({}),
  },
  {
    name: 'date',
    keywords: [
      { word: 'date', weight: 3 },
      { word: 'what date', weight: 4 },
      { word: "what's today", weight: 3 },
      { word: "what's the date", weight: 4 },
      { word: 'what is the date', weight: 4 },
    ],
    requiredParams: [],
    extractParams: text => ({ offset: String(extractDayOffset(text)) }),
  },
  {
    name: 'weekday',
    keywords: [
      { word: 'what day', weight: 3 },
      { word: 'which day', weight: 3 },
      { word: 'day of the week', weight: 4 },
      { word: 'day is it', weight: 3 },
      { word: 'day is today', weight: 3 },
      { word: 'day was yesterday', weight: 4 },
      { word: 'day was', weight: 3 },
      { word: 'day will', weight: 3 },
    ],
    requiredParams: [],
    extractParams: text => ({ offset: String(extractDayOffset(text)) }),
  },
  {
    name: 'alarm',
    keywords: [
      { word: 'alarm', weight: 3 },
      { word: 'set alarm', weight: 4 },
      { word: 'set an alarm', weight: 4 },
      { word: 'set the alarm', weight: 4 },
      { word: 'wake me', weight: 3 },
      { word: 'wake me up', weight: 4 },
      { word: 'remind me', weight: 2 },
      { word: 'alarm for', weight: 3 },
    ],
    requiredParams: ['time'],
    extractParams: extractAlarmParams,
  },
];

const MIN_SCORE = 2;

// ─── Classifier ───────────────────────────────────────────────────────────────

export class IntentClassifier {
  classify(transcript: string): IntentResult {
    const t = transcript.toLowerCase().trim();

    let bestIntent: IntentDefinition = INTENTS[INTENTS.length - 1];
    let bestScore = 0;

    for (const intent of INTENTS) {
      let score = 0;
      for (const kw of intent.keywords) {
        if (t.includes(kw.word)) {
          score += kw.weight;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    if (bestScore < MIN_SCORE) {
      return { intent: 'unknown', score: 0, params: {} };
    }

    return {
      intent: bestIntent.name,
      score: bestScore,
      params: bestIntent.extractParams(t),
    };
  }

  getRequiredParams(intent: IntentName): string[] {
    return INTENTS.find(i => i.name === intent)?.requiredParams ?? [];
  }
}

// ─── Extragere parametri alarmă ───────────────────────────────────────────────

function extractAlarmParams(text: string): Record<string, string> {
  const params: Record<string, string> = {};

  const timeMatch = text.match(
    /(?:at|for)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  );
  if (timeMatch) {
    const h = timeMatch[1];
    const m = timeMatch[2] ? `:${timeMatch[2]}` : ':00';
    const period = timeMatch[3] ? ` ${timeMatch[3].toUpperCase()}` : '';
    params.time = `${h}${m}${period}`;
  }

  if (text.includes('tomorrow')) params.day = 'tomorrow';
  else if (text.includes('today')) params.day = 'today';
  else {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const found = days.find(d => text.includes(d));
    if (found) params.day = found;
  }

  return params;
}
