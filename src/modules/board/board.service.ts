import { Injectable } from '@nestjs/common';

@Injectable()
export class BoardService {
  getTest(): { message: string; timestamp: string } {
    return {
      message: 'Board 모듈 테스트 성공!',
      timestamp: new Date().toISOString(),
    };
  }
}
