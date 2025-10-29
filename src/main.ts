import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  

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

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
