# 환경변수 설정 가이드

이 프로젝트는 로컬과 운영 환경을 구분하여 환경변수를 관리합니다.

## 환경 구분

- **로컬 환경** (`NODE_ENV=local` 또는 `development`): `.env` 파일 사용
- **운영 환경** (`NODE_ENV=production` 또는 기타): AWS Parameter Store 사용

## 로컬 환경 설정

1. 프로젝트 루트에 `.env` 파일을 생성합니다:
```bash
cp .env.example .env
```

2. `.env` 파일에 필요한 환경변수를 설정합니다:
```env
NODE_ENV=local
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
```

## 운영 환경 설정 (AWS Parameter Store)

### 1. AWS Parameter Store에 파라미터 생성

AWS Console에서 Systems Manager → Parameter Store로 이동하여 다음 경로에 파라미터를 생성합니다:

기본 경로: `/prod/{APP_NAME}/`

예시:
- `/prod/minimal-project/DB_HOST`
- `/prod/minimal-project/DB_PORT`
- `/prod/minimal-project/DB_USER`
- `/prod/minimal-project/DB_PASS`
- `/prod/minimal-project/DB_NAME`
- `/prod/minimal-project/APP_NAME`
- `/prod/minimal-project/PORT`

### 2. IAM 권한 설정

애플리케이션이 실행되는 환경(ECS, EC2, Lambda 등)에 다음 IAM 권한을 부여합니다:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:ap-northeast-2:*:parameter/prod/minimal-project/*"
    }
  ]
}
```

또는 기존 정책 사용:
- `AmazonSSMReadOnlyAccess` (읽기 전용)
- `AmazonSSMFullAccess` (권장하지 않음, 과도한 권한)

### 3. 환경변수 설정

운영 환경에서는 다음 환경변수를 설정합니다:

```bash
NODE_ENV=production
AWS_REGION=ap-northeast-2
PARAM_STORE_PATH=/prod/minimal-project
APP_NAME=minimal-project
```

## 환경변수 목록

### 필수 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DB_HOST` | 데이터베이스 호스트 | `localhost` 또는 `db.example.com` |
| `DB_PORT` | 데이터베이스 포트 | `3306` |
| `DB_USER` | 데이터베이스 사용자명 | `myuser` |
| `DB_PASS` | 데이터베이스 비밀번호 | `mypassword` |
| `DB_NAME` | 데이터베이스 이름 | `mydb` |

### 선택 환경변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `NODE_ENV` | 실행 환경 | `local` |
| `PORT` / `APP_PORT` | 애플리케이션 포트 | `3000` |
| `APP_NAME` | 애플리케이션 이름 | `minimal-project` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `PARAM_STORE_PATH` | Parameter Store 경로 | `/prod/{APP_NAME}` |

## 동작 원리

1. 애플리케이션 시작 시 `main.ts`에서 `loadEnvironmentVariables()` 함수가 호출됩니다.
2. `NODE_ENV`를 확인하여:
   - 로컬 환경: `dotenv`를 사용하여 `.env` 파일 로드
   - 운영 환경: `aws-param-store`를 사용하여 AWS Parameter Store에서 파라미터 로드
3. 로드된 환경변수는 `@nestjs/config`의 `ConfigModule`을 통해 관리됩니다.
4. `ConfigService`를 통해 타입 안전하게 환경변수에 접근할 수 있습니다.

## 코드에서 사용 예시

```typescript
import { ConfigService } from '@nestjs/config';

constructor(private readonly configService: ConfigService) {}

// 환경변수 접근
const dbHost = this.configService.get<string>('database.host');
const port = this.configService.get<number>('env.port');
```

