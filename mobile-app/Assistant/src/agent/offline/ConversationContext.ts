/**
 * ConversationContext.ts
 *
 * Reține starea dialogului între tururi.
 * Dacă userul spune "set an alarm" fără oră, agentul întreabă
 * "For what time?" și reține că așteaptă parametrul 'time'.
 */

export interface ConversationState {
  pendingIntent: string | null;
  collectedParams: Record<string, string>;
  missingParams: string[];
}

export class ConversationContext {
  private _state: ConversationState = {
    pendingIntent: null,
    collectedParams: {},
    missingParams: [],
  };

  get hasPendingIntent(): boolean {
    return this._state.pendingIntent !== null;
  }

  get pendingIntent(): string | null {
    return this._state.pendingIntent;
  }

  get collectedParams(): Record<string, string> {
    return this._state.collectedParams;
  }

  get missingParams(): string[] {
    return this._state.missingParams;
  }

  get nextMissingParam(): string | null {
    return this._state.missingParams[0] ?? null;
  }

  /**
   * Începe o nouă intenție cu parametrii deja colectați și cei lipsă.
   */
  start(
    intent: string,
    collected: Record<string, string>,
    missing: string[],
  ): void {
    this._state = {
      pendingIntent: intent,
      collectedParams: { ...collected },
      missingParams: [...missing],
    };
  }

  /**
   * Adaugă un parametru colectat și îl scoate din lista de lipsă.
   */
  addParam(key: string, value: string): void {
    this._state.collectedParams[key] = value;
    this._state.missingParams = this._state.missingParams.filter(
      p => p !== key,
    );
  }

  /**
   * Resetează contextul după ce intenția a fost executată sau anulată.
   */
  reset(): void {
    this._state = {
      pendingIntent: null,
      collectedParams: {},
      missingParams: [],
    };
  }

  isComplete(): boolean {
    return this._state.missingParams.length === 0;
  }
}
