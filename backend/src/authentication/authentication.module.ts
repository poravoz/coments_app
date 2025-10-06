import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { UsersModule } from '../users/users.module';
import { AuthenticationController } from './authentication.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './jwt-strategy/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-strategy/jwt.strategy';
import { JwtRefreshTokenStrategy } from './jwt-strategy/jwt-refresh-token-strategy';
import { CaptchaModule } from './captcha/captcha.module';

@Module({
    imports: [
        UsersModule, 
        PassportModule,
        ConfigModule,
        CaptchaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}s`,
                },
            }),
        }),
    ],
    providers: [AuthenticationService, LocalStrategy, JwtStrategy, JwtRefreshTokenStrategy],
    exports: [JwtRefreshTokenStrategy],
    controllers: [AuthenticationController]
})

export class AuthenticationModule {}