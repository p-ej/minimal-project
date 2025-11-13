import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SentencesService } from './sentences.service';
import { TodaySentenceResponseDto } from './dto/today-sentence.response';

@ApiTags('Sentences')
@Controller('sentences')
export class SentencesController {
  constructor(private readonly sentencesService: SentencesService) {}

  @Get('today')
  @ApiOperation({
    summary: '오늘의 한 문장 추천',
    description:
      '외부 Open API와 연동하여 오늘의 문장을 추천하고 저장된 결과를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '오늘의 문장을 성공적으로 조회한 경우',
    type: TodaySentenceResponseDto,
  })
  getTodaySentence(): Promise<TodaySentenceResponseDto> {
    return this.sentencesService.getTodaySentence();
  }
}

