/**
 * 환경변수 검증 및 타입 정의
 */
export default () => ({
  // 환경 설정
  env: {
    nodeEnv: process.env.NODE_ENV || 'local',
    port: parseInt(process.env.PORT || process.env.APP_PORT || '3000', 10),
  },

  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize:
      process.env.NODE_ENV === 'local' ||
      process.env.NODE_ENV === 'development',
    logging:
      process.env.NODE_ENV === 'local' ||
      process.env.NODE_ENV === 'development',
  },

  // AWS Parameter Store 설정
  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-2',
    paramStorePath:
      process.env.PARAM_STORE_PATH ||
      `/prod/${process.env.APP_NAME || 'minimal-project'}`,
  },
});

