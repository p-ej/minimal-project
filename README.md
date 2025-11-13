# Minimal Project

## 목표
- 풀스택 개발 사이클을 온전히 경험하며 인프라 → 백엔드 → 프론트엔드 순으로 완성도 높이기

### 단계별 로드맵
1. 인프라 및 배포 파이프라인 구축 (CI/CD 포함)
2. 안정적인 백엔드 API 서버 구현
3. 프론트엔드 서비스 개발

## 프로젝트 개요
- 영어 학습 서비스
- 주요 기능: 단어장, 단어 맞추기, 문장 추천

## 아키텍처 구성 요소
- 프론트엔드, 백엔드, 인프라 전 영역 자체 구축
- AI 활용 시나리오 검토
- 데이터베이스 설계 및 운영

## 기술 스택
- **백엔드**: NestJS 10, TypeORM, class-validator/class-transformer, Swagger UI
- **데이터베이스**: AWS RDS(MariaDB), TypeORM 엔티티 관리, 로컬 개발용 Docker 기반 MariaDB
- **인프라**: AWS ECS(Fargate) 기반 Docker 운영, AWS ECR, EC2 프록시, AWS Parameter Store, Docker(로컬/운영)
- **CI/CD**: GitHub Actions로 이미지 빌드 및 ECS 배포 자동화
- **품질 관리**: ESLint, Prettier, Jest, `@nestjs/config` 기반 환경변수 검증

## 인프라 구성 현황 (2025-10-28 기준)
- NestJS 애플리케이션 가동
- Docker / AWS ECR / AWS ECS 파이프라인 구축
- GitHub Actions로 CI/CD 연결
- ALB, Route 53, Domain은 향후 도입 예정
- 로드밸런서 생성 제한으로 ECS 태스크마다 IP가 바뀌는 문제를 경험
  - EC2 인스턴스를 프록시로 두고 Route 53 + 커스텀 도메인에 연결해 유동 IP 이슈 해결
- 운영 DB는 AWS RDS 사용
- 환경 변수는 운영(AWS Parameter Store)과 로컬(.env)로 분리 관리
- 운영 환경 또한 Docker 이미지(ECS Fargate) 기반으로 배포 중

## 환경 변수 전략
- **로컬 개발**: `.env` 파일로 관리 (예: DB 접속 정보 등)
- **운영 환경**: AWS Systems Manager Parameter Store에서 SecureString으로 관리, ECS Task Role이 파라미터를 로드
- 공통 설정은 `@nestjs/config` + 커스텀 `env-loader` 유틸리티가 주입

## 변경 이력

### 2025-11-13
- 기본 `AppController`, `AppService`, `Test` 엔티티, `Users` 모듈 제거로 API 초기화
- `/` 루트 경로에 경량 헬스 체크 200 응답 추가
- `@nestjs/terminus` 기반 `HealthModule`/`HealthController` 도입, `/health` 엔드포인트에서 DB ping 확인
- README 구조 전면 재정리 및 Docker Compose 가이드 업데이트
- 헬스 체크 모듈을 모놀리식 구조에 맞춰 `modules/health`로 재배치

### 2025-10-28
- NestJS 애플리케이션 최초 구성
- Docker, AWS ECR/ECS, GitHub Actions(CI/CD) 파이프라인 설정
- ALB 미사용으로 ECS 태스크 IP 변경 이슈, EC2 프록시 + Route 53 + 도메인 연결로 대응
- 운영 DB: AWS RDS, 환경 변수는 Parameter Store/`.env`로 분리 관리
- 운영 환경은 Docker 이미지(ECS Fargate) 기반으로 배포

## 로컬 개발 가이드

### Docker Compose 주요 명령
```bash
# 이전 볼륨 포함 전체 정리
docker compose down -v

# 이미지 빌드 및 컨테이너 실행
docker compose up -d --build

# 실행 상태 확인
docker compose ps

# 로그 스트리밍
docker compose logs -f db
docker compose logs -f app

# 마이그레이션 실행 (컨테이너 내부)
docker compose exec app npm run migration:generate -- src/migrations/Init
docker compose exec app npm run migration:run
```

### 개발 시 참고 사항
- `app` 컨테이너는 `npm ci` 후 `npm run start:dev`를 실행하도록 구성
- `db` 컨테이너는 MariaDB 11 이미지를 기반으로 하며, 볼륨 `db_data`에 데이터 저장
- `.env` 예제는 민감 정보를 포함하지 않도록 관리 (문서에서는 placeholder 사용)
