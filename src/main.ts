import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const projectConfig = app.get(ConfigService);

  const prefix = projectConfig.get<string>('PREFIX');
  app.setGlobalPrefix(prefix);

  const title = projectConfig.get<string>('SWAGGER_TITLE');
  const description = projectConfig.get<string>('SWAGGER_DESCRIPTION');
  const version = projectConfig.get<string>('SWAGGER_VERSION');
  const swaggerConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = projectConfig.get<number>('PORT');
  await app.listen(port);
}
bootstrap();
