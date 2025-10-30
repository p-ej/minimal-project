import * as dotenv from 'dotenv';
import * as AWSParamStore from 'aws-param-store';

/**
 * 환경변수 로드 유틸리티
 * - 로컬 환경: .env 파일 로드
 * - 운영 환경: AWS Parameter Store에서 환경변수 로드
 */
// Parameter Store에서 로드된 원본 값을 보관 (민감정보 노출 주의: 컨트롤러에서 마스킹하여 사용)
export const paramStoreValues: Record<string, string> = {};

export async function loadEnvironmentVariables(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV || 'local';
  const isLocal = nodeEnv === 'local' || nodeEnv === 'development';

  if (isLocal) {
    // 로컬 환경: .env 파일 로드
    console.log('🔧 Loading environment variables from .env file...');
    dotenv.config();
  } else {
    // 운영 환경: AWS Parameter Store에서 로드
    console.log(
      `🔧 Loading environment variables from AWS Parameter Store (NODE_ENV: ${nodeEnv})...`,
    );

    const paramStorePath =
      process.env.PARAM_STORE_PATH ||
      `/prod/${process.env.APP_NAME || 'minimal-project'}`;
    const awsRegion = process.env.AWS_REGION || 'ap-northeast-2';

    try {
      // 1) 경로 기반으로 시도 (개별 파라미터들)
      const parameters = AWSParamStore.getParametersByPathSync(paramStorePath, {
        region: awsRegion,
        recursive: true,
      }) as Array<{ Name: string; Value: string; Type?: string }>;

      if (parameters && Array.isArray(parameters) && parameters.length > 0) {
        // 개별 파라미터들을 환경변수로 설정
        parameters.forEach((param) => {
          const paramName = param.Name.split('/').pop();
          if (paramName && param.Value) {
            process.env[paramName] = param.Value;
            paramStoreValues[paramName] = param.Value;
          }
        });
      } else {
        // 2) 단일 JSON 파라미터로 시도
        const jsonParamKey = process.env.PARAM_STORE_JSON_KEY || paramStorePath;
        const singleParam = AWSParamStore.getParameterSync(jsonParamKey, {
          region: awsRegion,
          withDecryption: true,
        }) as { Name: string; Value: string } | null;

        if (!singleParam || !singleParam.Value) {
          throw new Error(
            `No parameters found at path '${paramStorePath}' and JSON parameter '${jsonParamKey}' is empty or missing`,
          );
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(singleParam.Value);
        } catch (e) {
          throw new Error(
            `JSON parameter '${jsonParamKey}' has invalid JSON: ${(e as Error).message}`,
          );
        }

        Object.entries(parsed).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          const stringValue = String(value);
          process.env[key] = stringValue;
          paramStoreValues[key] = stringValue;
        });
      }

      console.log(
        `✅ Loaded ${parameters.length} parameters from AWS Parameter Store`,
      );
    } catch (error) {
      console.error(
        '❌ Failed to load parameters from AWS Parameter Store:',
        error,
      );
      throw new Error(
        `Failed to load environment variables from AWS Parameter Store: ${error.message}`,
      );
    }
  }
}
