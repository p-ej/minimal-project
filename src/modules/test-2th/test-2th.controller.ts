import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Test2thService } from './test-2th.service';

@ApiTags('test-2th')
@Controller('test-2th')
export class Test2thController {
  constructor(private readonly test2thService: Test2thService) {}

  @ApiOperation({ summary: 'Test-2th 모듈 테스트' })
  @ApiOkResponse({
    description: '테스트 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test-2th 모듈 테스트 성공!' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @Get('test')
  getTest() {
    return this.test2thService.getTest();
  }

  @ApiOperation({ summary: 'Test-2th 모듈 정보 조회' })
  @ApiOkResponse({
    description: '모듈 정보 반환',
    schema: {
      type: 'object',
      properties: {
        module: { type: 'string', example: 'test-2th' },
        version: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'active' },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @Get('info')
  getInfo() {
    return this.test2thService.getInfo();
  }
}

