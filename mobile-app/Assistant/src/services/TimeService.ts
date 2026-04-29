/**
 * TimeService.ts
 * Returnează ora curentă de pe dispozitiv — zero permisiuni, zero net.
 */

export class TimeService {
  getTime(): string {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;

    if (m === 0) {
      return `The time is ${h12} ${period} exactly.`;
    }
    return `The time is ${h12}:${m.toString().padStart(2, '0')} ${period}.`;
  }
}
