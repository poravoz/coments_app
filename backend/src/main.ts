import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  if(!port) {
    throw new HttpException("Something went wrong", HttpStatus.NOT_FOUND);
  }
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const frontendPath = join(__dirname, '..', '..', 'frontend', 'build');
  
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    app.useStaticAssets(frontendPath);
    app.setBaseViewsDir(frontendPath);
  }

  await app.listen(port);
}

bootstrap();