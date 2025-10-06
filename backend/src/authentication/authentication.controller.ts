import { Body, Req, Controller, HttpCode, Post, UseGuards, HttpException, HttpStatus, Res, Get, UnauthorizedException } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegisterDto } from './dto/register.dto';
import type RequestWithUser from './interfaces/requestWithUser.interface';
import type { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import JwtRefreshGuard from './guards/jwt-refresh-guards';
import { CaptchaService } from './captcha/captcha.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto & { captchaToken?: string; captchaValue?: string },
  ) {
    const { captchaToken, captchaValue, ...registrationData } = body;

    if (!captchaToken || !captchaValue) {
      throw new HttpException('CAPTCHA required', HttpStatus.BAD_REQUEST);
    }

    const valid = this.captchaService.validateCaptcha(captchaToken, captchaValue);
    if (!valid) {
      throw new HttpException('Invalid CAPTCHA', HttpStatus.BAD_REQUEST);
    }

    return this.authenticationService.register(registrationData);
  }

  @HttpCode(200)
  @Post('log-in')
  async logIn(
    @Body() body: { email: string; password: string; captchaToken?: string; captchaValue?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password, captchaToken, captchaValue } = body;

    const captchaRequired = this.authenticationService.isCaptchaRequired(email);
    
    if (captchaRequired) {
      if (!captchaToken || !captchaValue) {
        throw new HttpException('CAPTCHA required after multiple failed attempts', HttpStatus.BAD_REQUEST);
      }

      const valid = this.captchaService.validateCaptcha(captchaToken, captchaValue);
      if (!valid) {
        throw new HttpException('Invalid CAPTCHA', HttpStatus.BAD_REQUEST);
      }
    }

    try {
      const user = await this.authenticationService.getAuthenticatedUser(email, password);
      
      if (!user.id) {
        throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.authenticationService.resetFailedLogin(email);

      const accessCookie = this.authenticationService.getCookieWithJwtAccessToken(user.id);
      const { cookie: refreshCookie, token: refreshToken } = this.authenticationService.getCookieWithJwtRefreshToken(user.id);
      await this.usersService.setCurrentRefreshToken(refreshToken, user.id);
      response.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

      const { password: _, currentHashedRefreshToken, ...safeUser } = user;
      return { ...safeUser };
    } catch (error) {
      if (error.status === HttpStatus.BAD_REQUEST) {
        this.authenticationService.incrementFailedLogin(email);
      }
      throw error;
    }
  }

  @Post('check-captcha-requirement')
  async checkCaptchaRequirement(@Body() body: { email: string }) {
    const captchaRequired = this.authenticationService.isCaptchaRequired(body.email);
    return { captchaRequired };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('log-out')
  async logOut(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    const user = request.user;
    if (!user || !user.id) throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);

    await this.usersService.removeRefreshToken(user.id);
    const cookies = this.authenticationService.getCookiesForLogOut();
    response.setHeader('Set-Cookie', cookies);

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtRefreshGuard)
  @Get()
  authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    if (user.password) {
      user.password = undefined;
    }
    return user;
  }

  @UseGuards(JwtRefreshGuard)
  @Get('check-auth')
  async checkAuth(@Req() request: RequestWithUser) {
    return this.authenticationService.checkAuth(request.user);
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    if (!request.user?.id) {
      throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const accessTokenCookie = this.authenticationService.getCookieWithJwtAccessToken(request.user.id);
    response.setHeader('Set-Cookie', accessTokenCookie);
    return request.user;
  }
}