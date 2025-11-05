import { Injectable } from '@nestjs/common';

@Injectable()
export class Test2thService {
  getTest(): { message: string; timestamp: string } {
    return {
      message: 'Test-2th 모듈 테스트 성공!',
      timestamp: new Date().toISOString(),
    };
  }

  getInfo(): {
    module: string;
    version: string;
    status: string;
    timestamp: string;
  } {
    return {
      module: 'test-2th',
      version: '1.0.0',
      status: 'active',
      timestamp: new Date().toISOString(),
    };
  }
}

