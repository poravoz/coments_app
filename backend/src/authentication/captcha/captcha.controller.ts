import { Body, Controller, Post } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { ValidateCaptchaDto } from './dto/validate-captcha.dto';
import { CheckTokenDto } from './dto/check-token.dto';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Post('generate')
  generateCaptcha() {
    return this.captchaService.generateCaptcha();
  }

  @Post('validate')
  validateCaptcha(@Body() validateCaptchaDto: ValidateCaptchaDto) {
    const valid = this.captchaService.validateCaptcha(
      validateCaptchaDto.token, 
      validateCaptchaDto.value
    );
    return { valid };
  }

  @Post('check-token')
  checkToken(@Body() checkTokenDto: CheckTokenDto) {
    const valid = this.captchaService.isTokenValid(checkTokenDto.token);
    return { valid };
  }
}