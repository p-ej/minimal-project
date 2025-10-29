import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTestDto } from './dtos/create-test.dto';

@ApiTags('default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
