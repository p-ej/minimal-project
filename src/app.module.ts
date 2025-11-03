import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from './test/test.entitiy';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ConfigModule 설정 (환경변수 관리)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    // TypeORM 설정 (ConfigService를 통해 환경변수 주입)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [Test],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        charset: 'utf8mb4',
        extra: {
          charset: 'utf8mb4',
          connectionLimit: 10,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Test]),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
