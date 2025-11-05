import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BoardService } from './board.service';

@ApiTags('board')
@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @ApiOperation({ summary: 'Board 모듈 테스트' })
  @ApiOkResponse({
    description: '테스트 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Board 모듈 테스트 성공!' },
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
    return this.boardService.getTest();
  }
}
