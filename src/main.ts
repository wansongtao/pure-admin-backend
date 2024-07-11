import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ResponseExceptionFilter } from './common/filters/response-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new ResponseExceptionFilter());

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
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = projectConfig.get<number>('PORT');
  await app.listen(port);
}
bootstrap();
