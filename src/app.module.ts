import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './test/test.entitiy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [Test],
      synchronize: true, // 개발용 자동 스키마 생성
      logging: true,
    }),
    TypeOrmModule.forFeature([Test]),
   ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
