import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Test } from './test/test.entitiy';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTestDto } from './dtos/create-test.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
  ) {}

  async create(dto: CreateTestDto) {
    try {
      const newTest = this.testRepo.create({ ...dto });
      return await this.testRepo.save(newTest);
    } catch (error) {
      this.logger.error('데이터베이스 생성 오류:', error);
      throw this.handleDatabaseError(error, 'CREATE');
    }
  }

  async findAll() {
    try {
      return await this.testRepo.find();
    } catch (error) {
      this.logger.error('데이터베이스 조회 오류:', error);
      throw this.handleDatabaseError(error, 'READ');
    }
  }

  /**
   * 데이터베이스 에러를 분석하여 적절한 에러 메시지와 코드를 반환
   */
  private handleDatabaseError(error: any, operation: 'CREATE' | 'READ') {
    const errorCode = error?.code || error?.errno || 'UNKNOWN';
    const errorMessage = error?.message || '알 수 없는 오류';

    // 연결 오류
    if (
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT' ||
      errorMessage.includes('connect') ||
      errorMessage.includes('connection')
    ) {
      return new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: '데이터베이스 연결에 실패했습니다.',
          error: 'Database Connection Error',
          details: {
            code: errorCode,
            message:
              '데이터베이스 서버에 연결할 수 없습니다. 호스트, 포트, 네트워크 설정을 확인해주세요.',
            operation,
          },
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 인증 오류
    if (
      errorCode === 'ER_ACCESS_DENIED_ERROR' ||
      errorMessage.includes('access denied') ||
      errorMessage.includes('authentication')
    ) {
      return new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: '데이터베이스 인증에 실패했습니다.',
          error: 'Database Authentication Error',
          details: {
            code: errorCode,
            message: '데이터베이스 사용자명 또는 비밀번호가 올바르지 않습니다.',
            operation,
          },
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 데이터베이스/테이블 없음
    if (
      errorCode === 'ER_BAD_DB_ERROR' ||
      errorCode === 'ER_NO_SUCH_TABLE' ||
      errorMessage.includes("doesn't exist") ||
      errorMessage.includes('Unknown database')
    ) {
      return new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: '데이터베이스 또는 테이블을 찾을 수 없습니다.',
          error: 'Database Not Found Error',
          details: {
            code: errorCode,
            message: '데이터베이스 이름 또는 테이블이 존재하지 않습니다.',
            operation,
          },
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 제약 조건 위반 (중복 키, 외래 키 등)
    if (
      errorCode === 'ER_DUP_ENTRY' ||
      errorCode === 'ER_NO_REFERENCED_ROW_2' ||
      errorMessage.includes('Duplicate entry') ||
      errorMessage.includes('foreign key')
    ) {
      return new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message:
            operation === 'CREATE'
              ? '중복된 데이터 또는 제약 조건 위반이 발생했습니다.'
              : '데이터 제약 조건 오류가 발생했습니다.',
          error: 'Database Constraint Error',
          details: {
            code: errorCode,
            message: errorMessage,
            operation,
          },
        },
        HttpStatus.CONFLICT,
      );
    }

    // 기타 데이터베이스 오류
    return new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '데이터베이스 작업 중 오류가 발생했습니다.',
        error: 'Database Error',
        details: {
          code: errorCode,
          message: errorMessage,
          operation,
          rawError:
            process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development'
              ? errorMessage
              : undefined,
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  getHealth(): string {
    return 'OK';
  }
}
