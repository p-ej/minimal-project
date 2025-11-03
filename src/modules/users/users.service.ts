import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getTest(): { message: string; timestamp: Date } {
    return {
      message: 'Users 모듈 테스트 성공!',
      timestamp: new Date(),
    };
  }
}

