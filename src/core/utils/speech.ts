// ---------------------------------------------------------------------------
// Speech Engine — browser-only TTS wrapper
// ---------------------------------------------------------------------------

/**
 * Thin wrapper around the Web Speech API (SpeechSynthesis).
 *
 * Safe to import in Node/SSR contexts — the constructor checks for the
 * presence of `window.speechSynthesis` and sets `available` accordingly.
 */
export class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private rate: number = 0.8;
  private available: boolean = false;

  constructor() {
    this.available =
      typeof window !== 'undefined' &&
      typeof window.speechSynthesis !== 'undefined' &&
      window.speechSynthesis !== null;

    if (this.available) {
      this.synth = window.speechSynthesis;
    }
  }

  /** Whether speech synthesis is supported in the current environment. */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Set the speaking rate (clamped to 0.5–1.5).
   */
  setRate(rate: number): void {
    this.rate = Math.min(1.5, Math.max(0.5, rate));
  }

  /**
   * Speak a word or phrase aloud.
   * Returns a promise that resolves when speech completes or rejects on error.
   */
  speak(word: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.available || !this.synth) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = this.rate;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        // "interrupted" happens when cancel() is called — treat as success
        if (event.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(`Speech error: ${event.error}`));
        }
      };

      this.synth.speak(utterance);
    });
  }

  /** Cancel any ongoing speech immediately. */
  cancel(): void {
    if (this.available && this.synth) {
      this.synth.cancel();
    }
  }
}

/** Singleton instance */
export const speechEngine = new SpeechEngine();
