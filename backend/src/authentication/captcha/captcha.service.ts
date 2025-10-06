import { Injectable } from '@nestjs/common';
import { 
  CAPTCHA_CHARS, 
  CAPTCHA_LENGTH, 
  CAPTCHA_EXPIRATION_MS, 
  CAPTCHA_CLEANUP_DELAY_MS 
} from './constants/captcha.constants';

@Injectable()
export class CaptchaService {
  private captchas = new Map<string, { text: string; created: number; validated: boolean }>();

  async generateCaptcha(): Promise<{ token: string; text: string; }> {
    const { v4: uuidv4 } = await import('uuid');
    let text = '';
    for (let i = 0; i < CAPTCHA_LENGTH; i++) {
      text += CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length));
    }
    
    const token = uuidv4();
    
    this.captchas.set(token, { 
      text, 
      created: Date.now(),
      validated: false 
    });
    
    setTimeout(() => this.cleanup(), CAPTCHA_EXPIRATION_MS);
    
    return { token, text };
  }

  validateCaptcha(token: string, value: string): boolean {
    if (!token || !value) return false; 
    
    const captchaData = this.captchas.get(token);
    if (!captchaData) return false;

    if (Date.now() - captchaData.created > CAPTCHA_EXPIRATION_MS) {
      this.captchas.delete(token);
      return false;
    }

    const valid = captchaData.text === value.toUpperCase();
    
    if (valid) {
      captchaData.validated = true;
      setTimeout(() => {
        this.captchas.delete(token);
      }, CAPTCHA_CLEANUP_DELAY_MS);
    }
    
    return valid;
  }

  isTokenValid(token: string): boolean {
    const captchaData = this.captchas.get(token);
    if (!captchaData) return false;
    
    return Date.now() - captchaData.created <= CAPTCHA_EXPIRATION_MS;
  }

  private cleanup() {
    const now = Date.now();
    for (const [token, data] of this.captchas.entries()) {
      if (now - data.created > CAPTCHA_EXPIRATION_MS) {
        this.captchas.delete(token);
      }
    }
  }
}