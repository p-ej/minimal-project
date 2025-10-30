import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTestDto } from './dtos/create-test.dto';
import { paramStoreValues } from './config/env-loader.util';

@ApiTags('default')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: '테스트 생성' })
  @ApiCreatedResponse({ description: '생성됨' })
  @Post()
  async create(@Body() dto: CreateTestDto) {
    return await this.appService.create(dto);
  }

  @ApiOperation({ summary: '테스트 목록' })
  @ApiOkResponse({ description: '조회 성공' })
  @Get()
  async findAll() {
    return await this.appService.findAll();
  }

  @ApiOperation({ summary: '서비스 상태 확인' })
  @ApiOkResponse({ description: '성공' })
  @Get('/health')
  getHealth(): string {
    console.log('Request GET /health');
    return this.appService.getHealth();
  }

  @ApiOperation({ summary: '현재 실행 환경 조회' })
  @ApiOkResponse({ description: '환경 정보 반환' })
  @Get('/env')
  getEnv() {
    // 민감정보 마스킹 규칙
    const maskKeys = ['PASS', 'PASSWORD', 'SECRET', 'TOKEN', 'KEY'];
    const maskedParamStore = Object.entries(paramStoreValues).reduce(
      (acc, [k, v]) => {
        const upper = k.toUpperCase();
        const shouldMask = maskKeys.some((m) => upper.includes(m));
        acc[k] = shouldMask ? '***' : v;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      nodeEnv: this.configService.get<string>('env.nodeEnv'),
      port: this.configService.get<number>('env.port'),
      awsRegion: this.configService.get<string>('aws.region'),
      paramStorePath: this.configService.get<string>('aws.paramStorePath'),
      parameterStore: maskedParamStore,
    };
  }
}
