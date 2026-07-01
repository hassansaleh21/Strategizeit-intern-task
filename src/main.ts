import { NestFactory } from '@nestjs/core';
import {
  UnprocessableEntityException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedactSensitiveFieldsInterceptor } from './common/interceptors/redact-sensitive-fields.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  // Any DTO validation failure (e.g. malformed email) resolves to 422, per A1-01.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException(
          errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        ),
    }),
  );

  // Second line of defense: nothing logged through this interceptor can leak
  // a raw password/token, even if a future logger is added elsewhere.
  app.useGlobalInterceptors(new RedactSensitiveFieldsInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Formify Auth')
    .setDescription('A1-01: AuthController.login()')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Auth service listening on http://localhost:${port}/api/v1`);
}

bootstrap();
