import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTestDto } from './dtos/create-test.dto';

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
    return {
      nodeEnv: this.configService.get<string>('env.nodeEnv'),
      port: this.configService.get<number>('env.port'),
      awsRegion: this.configService.get<string>('aws.region'),
      paramStorePath: this.configService.get<string>('aws.paramStorePath'),
    };
  }
}
