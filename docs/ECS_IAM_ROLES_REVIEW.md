# ECS IAM 역할 및 정책 검토

## 현재 정책 구성

### 태스크 실행 역할 (Execution Role): `role-nestjs`
**현재 정책**:
- ✅ `AmazonECSTaskExecutionRolePolicy`
- ✅ `AmazonSSMReadOnlyAccess`
- ✅ `AmazonECS_FullAccess`

### 태스크 역할 (Task Role): `role-nestjs`
**현재 정책**:
- ✅ `AmazonECS_FullAccess`
- ✅ `AmazonECSTaskExecutionRolePolicy`
- ✅ `AmazonSSMReadOnlyAccess`

## 현재 프로젝트 요구사항 분석

### 애플리케이션이 사용하는 AWS 서비스

1. **AWS Parameter Store** (태스크 시작 시)
   - 환경 변수 읽기
   - 암호화된 파라미터 읽기 (`withDecryption: true`)

2. **ECR** (태스크 시작 시)
   - 컨테이너 이미지 pull

3. **RDS (MariaDB)** (런타임)
   - 데이터베이스 연결 (IAM 인증 아님, 일반 DB 자격 증명 사용)

4. **CloudWatch Logs** (런타임)
   - 애플리케이션 로그 전송

## 권한 분석

### 태스크 실행 역할 (Execution Role) ✅

**필수 권한**:
1. ✅ **ECR 접근**: `AmazonECSTaskExecutionRolePolicy` 포함
   - `ecr:GetAuthorizationToken`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:GetDownloadUrlForLayer`
   - `ecr:BatchGetImage`

2. ✅ **Parameter Store 읽기**: `AmazonSSMReadOnlyAccess` 포함
   - `ssm:GetParameter`
   - `ssm:GetParameters`
   - `ssm:GetParametersByPath`

3. ⚠️ **KMS 복호화**: 암호화된 Parameter Store 파라미터 읽기
   - `kms:Decrypt` 권한 필요 (암호화된 파라미터 사용 시)

4. ✅ **CloudWatch Logs**: `AmazonECSTaskExecutionRolePolicy` 포함
   - `logs:CreateLogGroup`
   - `logs:CreateLogStream`
   - `logs:PutLogEvents`

**불필요한 권한**:
- ❌ `AmazonECS_FullAccess`: 태스크 실행 역할에 불필요 (태스크 관리 권한)

### 태스크 역할 (Task Role) ⚠️

**현재 문제**:
- ⚠️ `AmazonECS_FullAccess`: **과도한 권한** (보안 위험)
- ⚠️ `AmazonECSTaskExecutionRolePolicy`: 태스크 역할에 불필요
- ⚠️ `AmazonSSMReadOnlyAccess`: 애플리케이션 런타임에 불필요

**실제 필요 권한**:
- ✅ **없음**: 현재 애플리케이션은 런타임에 AWS 서비스를 직접 호출하지 않음
- ✅ RDS 접근은 IAM 인증이 아닌 일반 DB 자격 증명 사용

## 권장 구성

### 태스크 실행 역할 (Execution Role)

**권장 정책**:
1. ✅ `AmazonECSTaskExecutionRolePolicy` (필수)
2. ✅ `AmazonSSMReadOnlyAccess` (필수)
3. ⚠️ **KMS 정책 추가** (암호화된 파라미터 사용 시)

**제거 권장**:
- ❌ `AmazonECS_FullAccess` (불필요)

### 태스크 역할 (Task Role)

**권장 정책**:
- ✅ **최소 권한**: 현재는 권한 불필요 (필요 시 추가)

**제거 권장**:
- ❌ `AmazonECS_FullAccess` (과도한 권한, 보안 위험)
- ❌ `AmazonECSTaskExecutionRolePolicy` (태스크 실행 역할에만 필요)
- ❌ `AmazonSSMReadOnlyAccess` (태스크 실행 역할에만 필요)

## KMS 권한 추가 (필요한 경우)

### 암호화된 Parameter Store 파라미터 사용 시

**정책 추가**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": [
        "arn:aws:kms:ap-northeast-2:*:key/*"
      ],
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "ssm.ap-northeast-2.amazonaws.com"
        }
      }
    }
  ]
}
```

**또는 더 구체적으로**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:ap-northeast-2:ACCOUNT_ID:key/KMS_KEY_ID"
    }
  ]
}
```

## 정책 수정 방법

### 1. 태스크 실행 역할 정책 수정

1. **IAM → Roles → `role-nestjs` 선택**
2. **Permissions 탭**
3. **Remove** 클릭:
   - ❌ `AmazonECS_FullAccess` 제거
4. **Add permissions → Create inline policy** (KMS 권한 필요한 경우):
   - KMS 복호화 정책 추가

### 2. 태스크 역할 정책 수정

1. **IAM → Roles → `role-nestjs` 선택** (태스크 역할)
2. **Permissions 탭**
3. **Remove** 클릭:
   - ❌ `AmazonECS_FullAccess` 제거
   - ❌ `AmazonECSTaskExecutionRolePolicy` 제거
   - ❌ `AmazonSSMReadOnlyAccess` 제거

**또는**:
- 태스크 역할을 별도로 분리 (권장)
- 태스크 실행 역할: `role-nestjs-execution`
- 태스크 역할: `role-nestjs-task` (최소 권한)

## 최소 권한 원칙 (Principle of Least Privilege)

### 현재 문제점

1. **태스크 실행 역할**:
   - `AmazonECS_FullAccess`: ECS 클러스터/서비스 관리 권한 (불필요)

2. **태스크 역할**:
   - `AmazonECS_FullAccess`: ECS 전체 관리 권한 (보안 위험)
   - 태스크가 손상되면 ECS 리소스 전체에 접근 가능

### 권장 개선

1. **태스크 실행 역할**: 필요한 권한만
2. **태스크 역할**: 최소 권한 또는 권한 없음
3. **역할 분리**: 실행 역할과 태스크 역할 분리

## 역할 분리 (선택사항, 권장)

### 현재 구성
- 실행 역할: `role-nestjs`
- 태스크 역할: `role-nestjs` (같은 역할)

### 권장 구성
- 실행 역할: `role-nestjs-execution`
- 태스크 역할: `role-nestjs-task`

**장점**:
- 역할 분리로 보안 강화
- 권한 관리 용이
- 감사 및 추적 용이

## 확인 사항

### Parameter Store 암호화 여부 확인

1. **Systems Manager → Parameter Store**
2. 파라미터 선택
3. **Type** 확인:
   - `String`: 암호화 없음 → KMS 권한 불필요
   - `SecureString`: 암호화됨 → KMS 권한 필요

### CloudWatch Logs 그룹 확인

1. **CloudWatch → Log groups**
2. ECS 태스크 로그 확인
3. 로그가 정상적으로 전송되는지 확인

## 요약

### 즉시 수정 권장

**태스크 실행 역할**:
- ✅ `AmazonECSTaskExecutionRolePolicy` 유지
- ✅ `AmazonSSMReadOnlyAccess` 유지
- ❌ `AmazonECS_FullAccess` 제거

**태스크 역할**:
- ❌ `AmazonECS_FullAccess` 제거 (보안 위험)
- ❌ `AmazonECSTaskExecutionRolePolicy` 제거
- ❌ `AmazonSSMReadOnlyAccess` 제거
- ✅ 최소 권한 또는 권한 없음

### 추가 확인 필요

- ⚠️ Parameter Store 암호화 여부 확인
- ⚠️ KMS 권한 필요 여부 확인
- ⚠️ CloudWatch Logs 정상 작동 확인

