# npm 캐시 최적화 가이드

## 현재 상황

### `setup-node@v4`의 `cache: 'npm'` 옵션

**동작 방식**:
- `setup-node@v4`의 `cache: 'npm'` 옵션은 내부적으로 `actions/cache`를 사용합니다.
- 자동으로 `package-lock.json`을 기반으로 캐시 키를 생성합니다.
- 캐시 경로: `~/.npm` (Linux), `~/npm` (macOS), `~\AppData\npm-cache` (Windows)

**장점**:
- 간단하고 자동화됨
- 별도 설정 불필요

**단점**:
- 캐시 키 제어가 제한적
- restore-keys 설정 불가

### 명시적 `actions/cache` 사용

**장점**:
- 캐시 키 세밀한 제어 가능
- `restore-keys`로 부분 캐시 활용 가능
- 캐시 동작 더 명확하게 제어

**단점**:
- `setup-node`의 캐시와 중복 가능 (하지만 cache key가 같으면 문제 없음)
- 설정이 약간 복잡해짐

## 권장 사항

### 현재 구성 (권장)

**`setup-node@v4`의 `cache: 'npm'` 사용**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # 자동 캐시 처리
```

**이유**:
- 이미 충분히 잘 작동함
- 간단하고 유지보수 용이
- 대부분의 경우 충분함

### 명시적 캐시 사용 (선택적)

**더 세밀한 제어가 필요한 경우**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    # cache 옵션 제거

- name: Cache npm dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**사용 시나리오**:
- 여러 프로젝트 간 캐시 공유
- 더 복잡한 캐시 전략 필요
- 캐시 동작 명시적 제어 필요

## 실제 효과 비교

### `setup-node`의 자동 캐시
- **캐시 적중률**: 높음 (package-lock.json 기반)
- **설정 복잡도**: 낮음
- **유지보수**: 쉬움

### 명시적 `actions/cache`
- **캐시 적중률**: 동일 또는 약간 높음 (restore-keys 활용)
- **설정 복잡도**: 중간
- **유지보수**: 약간 복잡

**결론**: 대부분의 경우 `setup-node`의 자동 캐시로 충분합니다.

## Docker 빌드 캐시와의 관계

### GitHub Actions npm 캐시
- **용도**: CI 단계의 `npm ci` 속도 향상
- **효과**: 의존성 설치 시간 단축 (약 30-50%)

### Docker 빌드 캐시
- **용도**: Docker 이미지 빌드 속도 향상
- **효과**: Docker 레이어 재사용 (약 50-70%)

**중요**: Docker 빌드 캐시가 더 중요합니다!

**이유**:
- Docker 빌드는 CI 단계보다 더 오래 걸림
- Docker 레이어 캐시는 이미지 빌드 전체를 가속화
- npm 캐시는 의존성 설치만 가속화

## 최적화 우선순위

### 1순위: Docker 빌드 캐시 (가장 중요)
```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 2순위: npm 캐시 (CI 단계)
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # 또는 명시적 actions/cache
```

### 3순위: 기타 최적화
- `.dockerignore` 개선
- 중복 빌드 제거
- 타입 체크만 수행

## 결론

### 현재 구성 권장
- `setup-node@v4`의 `cache: 'npm'` 사용
- 명시적 `actions/cache`는 선택 사항

### 추가할 필요성
- **낮음**: 현재 구성으로 충분
- **명시적 제어 필요 시**: 추가 가능

### 더 중요한 것
- **Docker 빌드 캐시 최적화**가 더 큰 효과
- npm 캐시는 보조적 역할

## 참고

- `setup-node@v4` 문서: https://github.com/actions/setup-node
- `actions/cache` 문서: https://github.com/actions/cache
- Docker 빌드 캐시: `.github/workflows/deploy.yml`의 `cache-from`/`cache-to` 설정

