# 목표
- 풀스택 싸이클경험
## 단계별 목표
1. 인프라 및 배포 + CI/CD
2. 백엔드
3. 프론트

# 프로젝트 설명
- 영어 학습
- 단어장 및 단어 맞추기
- 문장 추천

# 프로젝트 구성
- 프론트엔드, 백엔드, 인프라
- AI 활용
- DB

# 기술 스택
- **백엔드**: NestJS 10, TypeORM, class-validator/class-transformer, Swagger UI
- **데이터베이스**: AWS RDS (MariaDB), TypeORM Entity 관리, 로컬 개발용 Docker 기반 MariaDB
- **인프라**: AWS ECS(Fargate) 기반 Docker 운영, AWS ECR, EC2 프록시, AWS Parameter Store, Docker(로컬/운영)
- **CI/CD**: GitHub Actions 기반 이미지 빌드 및 ECS 배포 파이프라인
- **기타**: ESLint/Prettier 코드 품질 관리, Jest 테스트, 환경변수 검증(`@nestjs/config`)

# 구성 상황
- Nestjs
- Docker, ECR, ECS
- Github  Action (CI/CD)
* Need: ALB, Route 53, Domain
- 현재 계정으로 로드밸런서가 생성이 안되어 ECS 태스크마다 바뀌는 IP로 접속해야 하는 번거로움이 있었음
- EC2 인스턴스를 프록시로 두고 Route 53 + 커스텀 도메인과 연결하여 유동 IP 문제를 해결함
- 운영 DB는 AWS RDS를 사용하고, 환경 변수는 운영(AWS Parameter Store)과 로컬(.env)로 분리 관리 중
- 운영 환경 또한 Docker 이미지 기반으로 배포(ECS Fargate)


