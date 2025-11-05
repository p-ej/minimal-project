# 빠른 해결: 보안 그룹 통일 방법

## 가장 확실한 해결 방법

**엔드포인트와 태스크가 같은 보안 그룹을 사용**하면 네트워크 통신 문제가 대부분 해결됩니다.

## 단계별 가이드

### 1단계: 태스크 보안 그룹 확인

**ECS → Services → `role-nestjs-second-service-d85kzfam` → Networking 탭**

**Security groups** 확인 및 기록:
- 예: `sg-0123456789abcdef0`

### 2단계: ECR API 엔드포인트 보안 그룹 수정

1. **VPC → Endpoints**
2. **`com.amazonaws.ap-northeast-2.ecr.api` 엔드포인트 선택**
3. **Actions → Modify security groups**
4. **1단계에서 확인한 태스크 보안 그룹 추가** (또는 기존 그룹 제거 후 추가)
5. **Save changes**

### 3단계: ECR DKR 엔드포인트 보안 그룹 수정

1. **VPC → Endpoints**
2. **`com.amazonaws.ap-northeast-2.ecr.dkr` 엔드포인트 선택**
3. **Actions → Modify security groups**
4. **동일한 태스크 보안 그룹 추가**
5. **Save changes**

### 4단계: 변경 확인

**각 엔드포인트의 Security 탭**에서:
- 태스크와 같은 보안 그룹이 연결되어 있는지 확인
- ✅ 확인되면 완료

## 왜 이 방법이 효과적인가?

1. **같은 보안 그룹 내부 통신은 기본적으로 허용**
   - 별도의 인바운드/아웃바운드 규칙 설정 불필요

2. **설정 실수 가능성 최소화**
   - 복잡한 규칙 설정 없이 간단하게 해결

3. **일관성 보장**
   - 모든 통신이 같은 보안 그룹을 통해 이루어짐

## 추가 확인사항

### 보안 그룹 규칙이 자동으로 올바른지 확인 (선택사항)

**EC2 → Security Groups → 태스크 보안 그룹 선택**

**인바운드 규칙** (자동 생성됨):
```
Type: All traffic
Source: 같은 보안 그룹 (sg-xxxxx)
```

**아웃바운드 규칙**:
```
Type: All traffic
Destination: 0.0.0.0/0
```

이미 올바르게 설정되어 있을 것입니다.

## 예상 결과

이 변경 후:
- ✅ 첫 시도 성공
- ✅ 배포 시간 단축
- ✅ 실패 태스크 없음

## 주의사항

- 보안 그룹을 변경하면 **즉시 적용**됩니다 (재부팅 불필요)
- 기존 실행 중인 태스크는 영향을 받지 않음
- 다음 배포부터 효과 적용

