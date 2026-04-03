import { MotionGuidanceStatus, MotionGuidanceMode } from '../contracts/types';
import { trackEvent } from '../analytics/events';

/**
 * motionGuidanceService
 * Wrapper defensivo sob a SpeechSynthesis API do browser.
 * Evita erros bloqueantes e degrada a voz para "silent" nativamente.
 */
class GuidanceService {
  private currentStatus: MotionGuidanceStatus = 'idle' as MotionGuidanceStatus;
  private isAvailable: boolean = false;

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isAvailable = true;
      this.currentStatus = 'ready';
    } else {
      this.isAvailable = false;
      this.currentStatus = 'unsupported';
    }
  }

  public getStatus(): MotionGuidanceStatus {
    return this.currentStatus;
  }

  public speakDiscrete(text: string, mode: MotionGuidanceMode): void {
    if (mode === 'silent' || mode === 'text_only') return;
    if (!this.isAvailable || this.currentStatus === 'unsupported') return;

    try {
      // Cancel previous utterances so it doesn't spam or stack up
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-PT';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => { this.currentStatus = 'active'; };
      utterance.onend = () => { this.currentStatus = 'ready'; };
      utterance.onerror = () => { this.currentStatus = 'failed'; };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.currentStatus = 'failed';
      trackEvent('motion_guidance_failed');
    }
  }

  public stop(): void {
    if (this.isAvailable) {
      window.speechSynthesis.cancel();
      this.currentStatus = 'ready';
    }
  }
}

export const motionGuidanceService = new GuidanceService();
