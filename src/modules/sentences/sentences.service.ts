import { Injectable } from '@nestjs/common';
import { TodaySentenceResponseDto } from './dto/today-sentence.response';

@Injectable()
export class SentencesService {
  async getTodaySentence(): Promise<TodaySentenceResponseDto> {
    // TODO: 외부 Open API 연동 및 DB 저장 로직 구현
    return {
      sentence: '',
      translation: '',
      source: '',
      level: '',
      retrievedAt: new Date().toISOString(),
    };
  }
}

