import { UsersService } from "src/users/users.service";
import  { PostgresErrorCode }  from "../database/postgresErrorCodes.enum";
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from "./interfaces/tokenPayload.interface";
import { UserEntity } from "src/users/entities/user.entity";

@Injectable()
export class AuthenticationService {
    private failedLoginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

    public incrementFailedLogin(email: string) {
      const now = new Date();
      const existing = this.failedLoginAttempts.get(email);
      
      if (existing) {
        const timeDiff = now.getTime() - existing.lastAttempt.getTime();
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (timeDiff > thirtyMinutes) {
          this.failedLoginAttempts.set(email, { count: 1, lastAttempt: now });
        } else {
          this.failedLoginAttempts.set(email, { 
            count: existing.count + 1, 
            lastAttempt: now 
          });
        }
      } else {
        this.failedLoginAttempts.set(email, { count: 1, lastAttempt: now });
      }
    }
  
    public resetFailedLogin(email: string) {
      this.failedLoginAttempts.delete(email);
    }
  
    public isCaptchaRequired(email: string): boolean {
      const attempts = this.failedLoginAttempts.get(email);
      if (!attempts) return false;

      const now = new Date();
      const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (timeDiff > thirtyMinutes) {
        this.failedLoginAttempts.delete(email);
        return false;
      }

      return attempts.count >= 3;
    }
    
    public getCookiesForLogOut() {
        return [
          'Authentication=; HttpOnly; Path=/; Max-Age=0',
          'Refresh=; HttpOnly; Path=/; Max-Age=0'
        ];
    }

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    public async register(registrationData: RegisterDto) {
        const hashedPassword = await bcrypt.hash(registrationData.password, 10);
        try {
            const createdUser = await this.usersService.createUser({
                ...registrationData,
                password: hashedPassword
            });
            createdUser.password = undefined;
            return createdUser;
        } catch(error) {
            if(error?.code === PostgresErrorCode.UniqueViolation) {
                throw new HttpException("Something went wrong", HttpStatus.BAD_REQUEST);
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getAuthenticatedUser(email: string, plainTextPassword: string): Promise<UserEntity> {
        try {
          const user = await this.usersService.getUserByEmail(email);
          if (!user.password) {
            throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
          }
          
          const isPasswordValid = await this.verifyPassword(plainTextPassword, user.password);
          if (!isPasswordValid) {
            throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
          }

          user.password = undefined;
          return user;
        } catch (error) {
          throw error;
        }
      }
    
    private async verifyPassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
        const isPasswordMatching = await bcrypt.compare(
          plainTextPassword,
          hashedPassword
        );
        return isPasswordMatching;
      }

      public async checkAuth(user: UserEntity) {
        if (!user) {
          throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
        }
        
        const { password, currentHashedRefreshToken, ...safeUser } = user;
        return safeUser;
      }

      public getCookieWithJwtAccessToken(userId: string) {
        const payload: TokenPayload = { userId };
        const token = this.jwtService.sign(payload, {
          secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: `${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}s`
        });
        return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}`;
      }

      public getCookieWithJwtRefreshToken(userId: string) {
        const payload: TokenPayload = { userId };
        const token = this.jwtService.sign(payload, {
          secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}d`
        });
        const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}d`;
        return {
          cookie,
          token
        }
      }

      public getCookieForLogOut() {
        return `Authentication=; HttpOnly; Path=/; Max-Age=0`;
      }
}