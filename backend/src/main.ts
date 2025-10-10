import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const clientOrigin = configService.get<string>('CLIENT_ORIGIN');

  app.enableCors({
    origin: clientOrigin,
    credentials: true,
  });

  const port = configService.get<number>('PORT');
  if (!port) throw new Error('PORT is not defined');
  await app.listen(port);
  
}
bootstrap();
