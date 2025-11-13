import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { loadEnvironmentVariables } from './config/env-loader.util';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // 환경변수 로드 (로컬: .env, 운영: AWS Parameter Store)
  await loadEnvironmentVariables();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // DTO 유효성 검증(권장)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger 문서 설정
  const config = new DocumentBuilder()
    .setTitle('Minimal Project API')
    .setDescription('NestJS v10 + TypeORM + MariaDB')
    .setVersion('1.0.0')
    .addBearerAuth() // 필요 시 인증 스키마 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Lightweight health check without dedicated controller
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const port = configService.get<number>('env.port') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
