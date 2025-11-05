# ECS 배포 시 네트워크 구성 자동 설정

## 문제

ECS 배포 시 새로운 태스크가 생성될 때 **퍼블릭 IP가 자동으로 활성화**되는 문제가 발생했습니다.

## 해결 방법

GitHub Actions 배포 워크플로우에 **서비스 네트워크 구성 업데이트 단계**를 추가하여 배포 전에 퍼블릭 IP를 비활성화합니다.

## 구현 내용

### `.github/workflows/deploy.yml` 수정

배포 전에 다음 단계가 실행됩니다:

1. **현재 서비스의 네트워크 구성 확인**
   - 서브넷 ID 가져오기
   - 보안 그룹 ID 가져오기

2. **서비스 네트워크 구성 업데이트**
   - `assignPublicIp=DISABLED` 설정
   - 기존 서브넷과 보안 그룹 유지

3. **ECS 배포 실행**
   - 업데이트된 네트워크 구성으로 새 태스크 생성

### 코드 구조

```yaml
- name: Update ECS service network configuration (disable public IP)
  run: |
    # 현재 서비스의 네트워크 구성 가져오기
    SUBNETS=$(aws ecs describe-services ...)
    SECURITY_GROUPS=$(aws ecs describe-services ...)
    
    # 퍼블릭 IP 비활성화하여 서비스 업데이트
    aws ecs update-service \
      --network-configuration "awsvpcConfiguration={...,assignPublicIp=DISABLED}" \
      ...
```

## 동작 방식

### 배포 프로세스

1. **코드 빌드 및 이미지 푸시**
2. **태스크 정의 렌더링**
3. **서비스 네트워크 구성 업데이트** ← 새로 추가
   - 퍼블릭 IP 비활성화
4. **ECS 배포 실행**
   - 새 태스크가 퍼블릭 IP 없이 생성됨

### 네트워크 구성 업데이트

**업데이트 전**:
```json
{
  "awsvpcConfiguration": {
    "subnets": ["subnet-xxx", "subnet-yyy"],
    "securityGroups": ["sg-xxx"],
    "assignPublicIp": "ENABLED"  // ❌ 문제
  }
}
```

**업데이트 후**:
```json
{
  "awsvpcConfiguration": {
    "subnets": ["subnet-xxx", "subnet-yyy"],
    "securityGroups": ["sg-xxx"],
    "assignPublicIp": "DISABLED"  // ✅ 해결
  }
}
```

## 확인 방법

### 배포 후 확인

1. **GitHub Actions 로그 확인**:
   - "Update ECS service network configuration" 단계 확인
   - 업데이트 성공 메시지 확인

2. **ECS 콘솔 확인**:
   - **ECS → Services → 서비스 선택 → Networking 탭**
   - **Auto-assign public IP**: ❌ **Disabled** 확인

3. **실제 태스크 확인**:
   - **ECS → Tasks → 태스크 선택 → Details → Network**
   - **Public IP**: 없음 또는 "-" 확인

## 수동 설정 (필요한 경우)

### AWS 콘솔에서 수동 설정

1. **ECS → Services → 서비스 선택**
2. **Update** 클릭
3. **Networking** 섹션:
   - **Auto-assign public IP**: ❌ **체크 해제**
4. **Update** 클릭

### AWS CLI로 수동 설정

```bash
# 서비스 네트워크 구성 확인
aws ecs describe-services \
  --cluster cluster-nestjs-second \
  --services app \
  --query 'services[0].networkConfiguration'

# 서비스 네트워크 구성 업데이트
aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

## 주의사항

### 서브넷 및 보안 그룹 확인

- ⚠️ **서브넷 ID 확인**: 프라이빗 서브넷만 사용해야 함
- ⚠️ **보안 그룹 확인**: 올바른 보안 그룹이 설정되어 있는지 확인

### 업데이트 실패 시

워크플로우는 업데이트 실패 시에도 계속 진행됩니다:
- 이미 올바르게 설정되어 있으면 업데이트가 건너뛰어짐
- 네트워크 구성이 변경되면 수동으로 확인 필요

## 이점

### ✅ 자동화
- 배포 시마다 자동으로 퍼블릭 IP 비활성화
- 수동 설정 불필요

### ✅ 일관성
- 모든 배포에서 동일한 네트워크 구성 보장
- 실수로 퍼블릭 IP 활성화 방지

### ✅ 보안
- 태스크가 인터넷에 직접 노출되지 않음
- VPC 엔드포인트를 통한 안전한 접근

## 다음 단계

1. **배포 실행**: GitHub Actions로 배포 실행
2. **확인**: 새 태스크가 퍼블릭 IP 없이 생성되는지 확인
3. **모니터링**: 배포 로그에서 네트워크 구성 업데이트 성공 확인

## 관련 문서

- `docs/ECS_PUBLIC_IP_CONFIGURATION.md`: 퍼블릭 IP 설정 상세 가이드
- `docs/ECS_SUBNET_CONFIGURATION.md`: 서브넷 구성 가이드
- `docs/DEPLOYMENT_TIMEOUT_ANALYSIS.md`: 배포 타임아웃 분석

