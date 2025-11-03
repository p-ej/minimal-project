import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Users 모듈 테스트' })
  @ApiOkResponse({
    description: '테스트 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Users 모듈 테스트 성공!' },
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
    return this.usersService.getTest();
  }
}
