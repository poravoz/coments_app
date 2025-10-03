import { Body, Req, Controller, HttpCode, Post, UseGuards, HttpException, HttpStatus, Res, Get } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { RegisterDto } from './dto/register.dto';
import type RequestWithUser from './interfaces/requestWithUser.interface';
import { LocalAuthenticationGuard } from './guards/localAuthentication.guard';
import type { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import JwtRefreshGuard from './guards/jwt-refresh-guards';

@Controller('authentication')
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService,
        private readonly usersService: UsersService,
    ) {}

    @Post('register')
    async register (@Body() registrationData: RegisterDto) {
        return this.authenticationService.register(registrationData);
    }

    @HttpCode(200)
    @UseGuards(LocalAuthenticationGuard)
    @Post('log-in')
    async logIn(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
        const { user } = request;

        if (!user.id) throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);

        const accessCookie = this.authenticationService.getCookieWithJwtAccessToken(user.id);
        const { cookie: refreshCookie, token: refreshToken } = this.authenticationService.getCookieWithJwtRefreshToken(user.id);
        await this.usersService.setCurrentRefreshToken(refreshToken, user.id);
        response.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

        const { password, currentHashedRefreshToken, ...safeUser } = user;
        return { ...safeUser };
    }

    @UseGuards(JwtRefreshGuard)
    @Post('log-out')
    async logOut(@Req() request: RequestWithUser, @Res({ passthrough: true }) response: Response) {
      const user = request.user;
      if (!user || !user.id) throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    
      await this.usersService.removeRefreshToken(user.id as string);
      const cookies = this.authenticationService.getCookiesForLogOut();
      response.setHeader('Set-Cookie', cookies);
    
      return { message: 'Logged out successfully' };
    }
    
    
    
    @UseGuards(JwtRefreshGuard)
    @Get()
    authenticate(@Req() request: RequestWithUser) {
    const user = request.user;
    user.password = undefined;
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