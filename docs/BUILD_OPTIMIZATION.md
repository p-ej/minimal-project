# 빌드 시간 최적화 가이드

## 최적화 내용

### 1. 중복 빌드 제거

**문제**:
- CI 단계에서 `npm run build` 실행
- Docker 빌드에서도 `npm run build` 실행
- **동일한 빌드를 두 번 수행** → 불필요한 시간 소모

**해결**:
- CI 단계: 타입 체크만 수행 (`tsc --noEmit`)
- Docker 빌드: 실제 빌드 수행 (한 번만)

**효과**: 빌드 시간 약 30-50% 단축 (의존성에 따라 다름)

### 2. Dockerfile 최적화

#### 변경 전
```dockerfile
RUN npm ci
RUN npm run build
```

#### 변경 후
```dockerfile
RUN npm ci --prefer-offline --no-audit
RUN npm run build
RUN npm ci --omit=dev --prefer-offline --no-audit && \
    npm cache clean --force
```

**최적화 포인트**:
- `--prefer-offline`: 로컬 캐시 우선 사용
- `--no-audit`: 보안 감사 스킵 (빌드 시간 단축)
- `npm cache clean`: 불필요한 캐시 제거 (이미지 크기 감소)

### 3. .dockerignore 개선

**추가된 제외 항목**:
- `test/`: 테스트 파일 (빌드 불필요)
- `scripts/`: 스크립트 파일 (빌드 불필요)
- `*.tsbuildinfo`: TypeScript 증분 빌드 정보 (빌드 불필요)
- `.github/`: GitHub 설정 파일 (빌드 불필요)
- `docker-compose.*.yml`: Docker Compose 파일 (빌드 불필요)
- `redeploy.ps1`: 배포 스크립트 (빌드 불필요)

**효과**: Docker 컨텍스트 크기 감소 → 빌드 시간 단축

### 4. GitHub Actions 빌드 캐시 최적화

**추가된 설정**:
```yaml
build-args: |
  BUILDKIT_INLINE_CACHE=1     # 인라인 캐시 활성화
platforms: linux/amd64        # 플랫폼 명시 (빌드 시간 단축)
```

**효과**:
- 인라인 캐시로 레이어 재사용성 향상
- 플랫폼 명시로 불필요한 크로스 플랫폼 빌드 방지

## 예상 빌드 시간 개선

### 변경 전
- CI 단계: ~2-3분 (npm ci + build)
- Docker 빌드: ~3-5분
- **총**: ~5-8분

### 변경 후
- CI 단계: ~1-2분 (npm ci + type check)
- Docker 빌드: ~2-4분 (캐시 활용)
- **총**: ~3-6분

**예상 개선**: 약 30-40% 시간 단축

## 추가 최적화 팁

### 1. Docker BuildKit 활용

**현재 설정**:
- `docker/setup-buildx-action@v3` 사용
- `driver: docker-container` 설정

**추가 최적화 가능**:
- 멀티 스테이지 빌드 최적화 (이미 적용됨)
- 병렬 빌드 활용

### 2. npm 캐시 활용

**GitHub Actions**:
- `cache: 'npm'` 설정으로 자동 캐시 활용

**Docker**:
- `--prefer-offline` 옵션으로 로컬 캐시 우선 사용

### 3. 의존성 최적화

**package.json 검토**:
- 불필요한 의존성 제거
- devDependencies는 런타임에서 제외 (이미 적용됨)

### 4. 빌드 단계 분리 (고급)

더 빠른 피드백을 위해:
- CI: 타입 체크만 (빠름)
- Docker: 실제 빌드 (한 번만)

**현재 구성**: 이미 적용됨 ✅

## 빌드 시간 모니터링

### GitHub Actions에서 확인

1. **Actions 탭** → 워크플로우 실행 선택
2. **각 단계별 실행 시간 확인**:
   - Type check: ~1-2분
   - Build and push: ~2-4분
   - Deploy to ECS: ~1-2분

### 개선 효과 측정

**변경 전후 비교**:
- 총 배포 시간 측정
- 각 단계별 시간 비교
- 캐시 적중률 확인

## 문제 해결

### 빌드가 여전히 느린 경우

1. **캐시 확인**:
   - GitHub Actions 캐시가 제대로 작동하는지 확인
   - Docker 레이어 캐시 확인

2. **의존성 확인**:
   - `package.json`의 의존성 개수 확인
   - 불필요한 의존성 제거

3. **네트워크 확인**:
   - npm 레지스트리 접근 속도
   - ECR 푸시 속도

### 타입 체크 에러 발생 시

CI 단계에서 타입 체크만 수행하므로:
- 타입 에러는 CI 단계에서 발견
- 빌드는 Docker에서만 수행
- 타입 에러 시 CI 실패, Docker 빌드 스킵

## 요약

### ✅ 적용된 최적화

1. 중복 빌드 제거 (CI는 타입 체크만)
2. Dockerfile 최적화 (npm 옵션 추가)
3. .dockerignore 개선 (불필요한 파일 제외)
4. GitHub Actions 캐시 최적화 (인라인 캐시, 플랫폼 명시)

### 📊 예상 효과

- 빌드 시간: 30-40% 단축
- Docker 이미지 크기: 약간 감소
- 배포 시간: 전체적으로 단축

### 🔄 추가 최적화 가능

- 의존성 최적화 (불필요한 패키지 제거)
- 멀티 스테이지 빌드 추가 최적화
- 병렬 빌드 활용

