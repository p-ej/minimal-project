# 빌드용
FROM node:20-alpine AS builder
WORKDIR /var/app

# 의존성 파일만 먼저 복사 (캐시 최적화)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 런타임용
FROM node:20-alpine
WORKDIR /var/app
ENV NODE_ENV=production

# 의존성만 설치 (devDependencies 제외)
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force

# 빌드된 파일만 복사
COPY --from=builder /var/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]