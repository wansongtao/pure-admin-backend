import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import getSystemConfig from './common/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ResponseExceptionFilter } from './common/filters/response-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(
    new ResponseExceptionFilter(),
    new PrismaClientExceptionFilter(),
  );

  const systemConfig = getSystemConfig(app.get(ConfigService));

  const prefix = systemConfig.PREFIX;
  app.setGlobalPrefix(prefix);

  const title = systemConfig.SWAGGER_TITLE;
  const description = systemConfig.SWAGGER_DESCRIPTION;
  const version = systemConfig.SWAGGER_VERSION;
  const swaggerConfig = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.listen(systemConfig.PORT);
}
bootstrap();
