import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import loadEnv from './utils/loadEnv';

async function bootstrap() {
  const env = process.env.NODE_ENV || 'development';
  loadEnv(env);

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  await app.listen(port);
}
bootstrap();
