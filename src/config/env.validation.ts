import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  validateSync,
} from 'class-validator';

/**
 * 환경변수 검증용 DTO
 */
class EnvironmentVariables {
  @IsNotEmpty()
  @IsString()
  DB_HOST: string;

  @IsNotEmpty()
  @IsString()
  DB_PORT: string;

  @IsNotEmpty()
  @IsString()
  DB_USER: string;

  @IsNotEmpty()
  @IsString()
  DB_PASS: string;

  @IsNotEmpty()
  @IsString()
  DB_NAME: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  APP_NAME?: string;

  @IsOptional()
  @IsString()
  AWS_REGION?: string;

  @IsOptional()
  @IsString()
  PARAM_STORE_PATH?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  APP_PORT?: string;
}

/**
 * 환경변수 검증 함수
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true, // 선택적 필드는 skip
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
