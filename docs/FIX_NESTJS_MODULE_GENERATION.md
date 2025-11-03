# NestJS 모듈 생성 에러 해결 가이드

## 발생한 에러

```
Error: Cannot read properties of undefined (reading 'text')
Failed to execute command: node @nestjs/schematics:module --name=modules/users ...
```

## 문제 원인

1. **버전 불일치**: `@nestjs/cli` (10.x)와 `@nestjs/schematics` (9.x) 버전이 맞지 않음
2. **명령어 형식**: 경로를 포함한 모듈 이름 사용

## 해결 방법

### 1. 패키지 버전 업데이트 (완료됨)

`package.json`에서 `@nestjs/schematics`를 10.x 버전으로 업데이트했습니다.

```bash
# 패키지 재설치
npm install
```

### 2. 올바른 모듈 생성 명령어

#### 방법 1: 경로 지정 옵션 사용 (권장)

```bash
# modules 폴더에 users 모듈 생성
nest g module users --path modules/users

# 또는 전체 경로 지정
nest g module modules/users/users
```

#### 방법 2: 먼저 폴더 생성 후 모듈 생성

```bash
# 폴더 먼저 생성
mkdir -p src/modules/users

# 해당 폴더로 이동해서 생성
cd src/modules/users
nest g module users --no-spec
```

#### 방법 3: 단순히 이름만 사용

```bash
# src/modules/users/users.module.ts 생성
nest g module modules/users/users
```

### 3. 모듈 생성 명령어 옵션

```bash
# 기본 생성
nest g module users

# 경로 지정
nest g module users --path modules/users

# 테스트 파일 제외
nest g module users --no-spec

# AppModule에 자동 import 제외
nest g module users --no-skip-import

# 플랫 구조 (폴더 없이 파일만)
nest g module users --flat
```

## 전체 모듈 생성 예시

### Users 모듈 전체 생성

```bash
# 모듈
nest g module modules/users/users

# 컨트롤러
nest g controller modules/users/users --no-spec

# 서비스
nest g service modules/users/users --no-spec

# 엔티티 (TypeORM)
# 수동으로 src/modules/users/entities/user.entity.ts 생성
```

### 또는 간단하게

```bash
# resources로 한 번에 생성
nest g resource modules/users/users
```

이 명령어는 다음을 생성합니다:
- 모듈
- 컨트롤러
- 서비스
- DTO (생성, 수정)
- 엔티티 (선택)

## 트러블슈팅

### 여전히 에러가 발생한다면?

1. **node_modules 재설치**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **NestJS CLI 재설치**:
   ```bash
   npm install -g @nestjs/cli@latest
   ```

3. **버전 확인**:
   ```bash
   nest --version
   npm list @nestjs/cli @nestjs/schematics
   ```

4. **캐시 클리어**:
   ```bash
   # NestJS CLI 캐시 클리어 (있는 경우)
   rm -rf .nest
   ```

5. **수동으로 모듈 생성**:
   ```bash
   # 폴더 생성
   mkdir -p src/modules/users
   
   # 파일 생성
   # src/modules/users/users.module.ts
   ```

### 수동 모듈 파일 예시

`src/modules/users/users.module.ts`:
```typescript
import { Module } from '@nestjs/common';

@Module({})
export class UsersModule {}
```

`src/app.module.ts`에 import:
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
  // ...
})
```

