# ECS 태스크 중지 문제 해결 가이드

## ⚠️ 중요: 태스크 정의와 서비스 네트워크 구성

### 태스크 정의 (`ecs-task-def.json`)

**태스크 정의에는 네트워크 구성을 포함할 수 없습니다!**

✅ **태스크 정의에 포함 가능한 것**:
- `networkMode`: `"awsvpc"` (Fargate 필수)
- 컨테이너 정의, CPU, 메모리, 역할 등

❌ **태스크 정의에 포함 불가능한 것**:
- `assignPublicIp` (서브넷, 보안 그룹 포함)
- 네트워크 구성은 **서비스 레벨**에서만 관리

### 서비스 네트워크 구성

**ECS 서비스**에서 네트워크 구성을 관리:
- 서브넷 선택
- 보안 그룹 설정
- 퍼블릭 IP 활성화/비활성화

## 태스크 중지 원인 확인

### 1. 태스크 이벤트 확인

1. **ECS → Tasks → 중지된 태스크 선택**
2. **Details 탭 → Events** 섹션 확인
3. **중지된 이유 확인**:
   - `Essential container in task exited`
   - `Task failed to start`
   - `ResourceInitializationError`
   - 기타 에러 메시지

### 2. CloudWatch Logs 확인

1. **CloudWatch → Log groups**
2. **`/ecs/role-nestjs-second` 또는 관련 로그 그룹** 확인
3. **에러 로그 확인**

### 3. 태스크 상태 확인

**ECS → Tasks → 태스크 선택**:
- **Last status**: `STOPPED`
- **Stopped reason**: 확인
- **Stopped at**: 시간 확인

## 일반적인 중지 원인

### 1. 애플리케이션 크래시

**증상**:
- `Essential container in task exited`
- Exit code: 1 또는 다른 에러 코드

**확인 방법**:
- CloudWatch Logs에서 애플리케이션 에러 확인
- 환경 변수 누락 확인

**해결 방법**:
- 애플리케이션 로그 확인
- 환경 변수 설정 확인
- Parameter Store 파라미터 확인

### 2. 네트워크 구성 문제

**증상**:
- `ResourceInitializationError`
- `CannotPullContainerError`
- `i/o timeout`

**확인 방법**:
- 서비스 네트워크 구성 확인
- VPC 엔드포인트 연결 확인
- 보안 그룹 규칙 확인

**해결 방법**:
- 서비스 네트워크 구성 복구
- VPC 엔드포인트 재확인
- 보안 그룹 규칙 수정

### 3. IAM 권한 문제

**증상**:
- `AccessDenied`
- `UnauthorizedOperation`

**확인 방법**:
- 태스크 실행 역할 권한 확인
- CloudWatch Logs 권한 확인
- Parameter Store 권한 확인

**해결 방법**:
- IAM 역할 정책 확인 및 수정
- 필요한 권한 추가

## 서비스 네트워크 구성 복구

### 방법 1: AWS 콘솔에서 수정

1. **ECS → Services → 서비스 선택**
2. **Update** 클릭
3. **Networking** 섹션 확인:
   - **Subnets**: 프라이빗 서브넷 2개 선택
   - **Security groups**: 올바른 보안 그룹 선택
   - **Auto-assign public IP**: ❌ **체크 해제** (비활성화)
4. **Update** 클릭

### 방법 2: AWS CLI로 수정

```bash
# 현재 서비스 네트워크 구성 확인
aws ecs describe-services \
  --cluster cluster-nestjs-second \
  --services app \
  --query 'services[0].networkConfiguration'

# 서비스 네트워크 구성 업데이트
aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --force-new-deployment
```

## 태스크 정의 복구

### 현재 태스크 정의 확인

`ecs-task-def.json` 파일이 올바른지 확인:

```json
{
  "family": "role-nestjs-second",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "3072",
  "executionRoleArn": "role-nestjs",
  "taskRoleArn": "role-nestjs",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "REPLACE_IMAGE_URI",
      "portMappings": [{ 
        "containerPort": 80, 
        "protocol": "tcp",
        "name": "container-nestjs-80-tcp",
        "appProtocol": "http"
      }],
      "essential": true
    }
  ]
}
```

**⚠️ 중요**: 네트워크 구성(`assignPublicIp`, `subnets`, `securityGroups`)은 **태스크 정의에 포함하지 않습니다**!

## 서비스 재배포

### 방법 1: 강제 새 배포

1. **ECS → Services → 서비스 선택**
2. **Update** 클릭
3. **Force new deployment** 체크
4. **Update** 클릭

### 방법 2: GitHub Actions 재배포

1. **GitHub → Actions**
2. **최근 배포 워크플로우 확인**
3. **에러 발생 시**: 로그 확인
4. **정상 시**: 수동으로 재배포 (`workflow_dispatch`)

## GitHub Actions 워크플로우 확인

### 네트워크 구성 업데이트 단계 문제

워크플로우의 네트워크 구성 업데이트 단계에서 문제가 발생했을 수 있습니다.

**확인 사항**:
1. **서비스 이름이 올바른지 확인**: `ECS_SERVICE: app`
2. **서브넷 ID가 올바른지 확인**
3. **보안 그룹 ID가 올바른지 확인**

**임시 해결**:
- 워크플로우의 네트워크 구성 업데이트 단계를 주석 처리
- AWS 콘솔에서 수동으로 설정

## 단계별 복구 절차

### 1단계: 태스크 중지 이유 확인

```bash
# AWS CLI로 태스크 이벤트 확인
aws ecs describe-tasks \
  --cluster cluster-nestjs-second \
  --tasks TASK_ARN \
  --query 'tasks[0].{stoppedReason:stoppedReason,stopCode:stopCode,containers:containers[*].{name:name,reason:reason,exitCode:exitCode}}'
```

### 2단계: 서비스 네트워크 구성 확인

```bash
# 서비스 네트워크 구성 확인
aws ecs describe-services \
  --cluster cluster-nestjs-second \
  --services app \
  --query 'services[0].networkConfiguration'
```

### 3단계: 서비스 복구

```bash
# 서비스 강제 새 배포
aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --force-new-deployment
```

### 4단계: 새 태스크 확인

1. **ECS → Tasks**
2. **새 태스크 생성 확인**
3. **태스크 상태 확인**: `RUNNING`

## 예방 방법

### 1. 태스크 정의는 네트워크 구성 제외

✅ **올바른 태스크 정의**:
```json
{
  "networkMode": "awsvpc"
  // 네트워크 구성은 여기에 없음!
}
```

❌ **잘못된 태스크 정의**:
```json
{
  "networkMode": "awsvpc",
  "networkConfiguration": {  // ❌ 태스크 정의에 포함 불가!
    "assignPublicIp": "DISABLED"
  }
}
```

### 2. 서비스 레벨에서 네트워크 구성 관리

- AWS 콘솔에서 서비스 설정
- GitHub Actions 워크플로우에서 서비스 업데이트
- 태스크 정의는 변경하지 않음

### 3. 배포 전 확인

- 태스크 정의 파일 검증
- 서비스 네트워크 구성 확인
- VPC 엔드포인트 연결 확인

## 요약

### ✅ 올바른 구성

1. **태스크 정의**: 네트워크 구성 제외, `networkMode`만 포함
2. **서비스**: 네트워크 구성 관리 (서브넷, 보안 그룹, 퍼블릭 IP)
3. **배포**: 서비스 레벨에서 네트워크 구성 업데이트

### ❌ 피해야 할 실수

1. 태스크 정의에 네트워크 구성 포함 시도
2. 서비스 네트워크 구성을 변경하지 않고 태스크 정의만 수정
3. 네트워크 구성 변경 후 서비스 재배포 없이 대기

### 🔧 복구 방법

1. 태스크 중지 이유 확인
2. 서비스 네트워크 구성 확인 및 수정
3. 서비스 강제 새 배포
4. 새 태스크 상태 확인

