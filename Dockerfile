FROM node:20-alpine

# 빌드 도구 설치 (일부 패키지 빌드에 필요)
RUN apk add --no-cache python3 make g++

RUN mkdir -p /var/app
WORKDIR /var/app

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

EXPOSE 3000

# 개발 모드 기본 명령 (docker-compose에서 오버라이드 가능)
CMD ["npm", "run", "start:prod"]