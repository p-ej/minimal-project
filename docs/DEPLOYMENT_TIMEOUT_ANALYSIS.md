# ECS 배포 타임아웃 및 태스크 실패 원인 분석 및 해결

## 문제 상황 요약

- ✅ **최종 배포 성공**: 새로운 태스크가 정상 실행됨
- ❌ **배포 시간**: 15분 (정상보다 길음)
- ❌ **중간 실패**: 태스크가 2-3번 실패 후 성공
- ❌ **에러**: `CannotPullContainerError` - ECR 이미지 pull 타임아웃

## 핵심 원인 분석

**"일부 태스크는 실패하고 일부는 성공"**하는 것은 **네트워크 경로가 불안정**하다는 의미입니다.

가능한 원인:
1. **VPC 엔드포인트가 모든 가용 영역/서브넷에 연결되지 않음**
2. **ECS 태스크가 여러 가용 영역에서 실행되는데, 일부 가용 영역에는 엔드포인트가 없음**
3. **보안 그룹 규칙이 일부 통신만 허용**
4. **Private DNS가 일관되지 않게 작동**

## 단계별 진단 및 해결

### 1단계: ECS 태스크 실행 서브넷 확인

**목적**: 태스크가 어떤 서브넷에서 실행되는지 확인

**확인 방법**:
1. **ECS → Clusters → `cluster-nestjs-second` → Services → `role-nestjs-second-service-d85kzfam`**
2. **Networking 탭** 확인
3. **Subnets** 목록 기록 (예: `subnet-xxxxx-a`, `subnet-yyyyy-b`)
   - ⚠️ **중요**: ECS 서비스에 **실제로 설정된 서브넷만** 확인
   - 일반적으로 **프라이빗 서브넷만** 사용 (Fargate의 경우)

**또는 실행 중인 태스크로 확인**:
1. **ECS → Tasks → 실행 중인 태스크 선택**
2. **Details 탭 → Network** 섹션
3. **Subnet ID** 확인
4. **여러 태스크 확인하여 모든 서브넷 ID 수집**

**결정 원칙**:
- ✅ **ECS 서비스에 설정된 서브넷만** 엔드포인트에 연결
- ✅ 일반적으로 **프라이빗 서브넷만** 연결 (Fargate 태스크는 프라이빗에서 실행)
- ❌ 퍼블릭 서브넷은 연결 불필요 (태스크가 실행되지 않으므로)

또는

1. **ECS → Tasks → 실행 중인 태스크 선택**
2. **Details 탭 → Network** 섹션
3. **Subnet ID** 확인
4. **여러 태스크 확인하여 모든 서브넷 ID 수집**

### 2단계: VPC 엔드포인트 서브넷 확인

**목적**: 엔드포인트가 태스크와 같은 서브넷에 있는지 확인

**확인 방법**:
1. **VPC → Endpoints**
2. 다음 2개 엔드포인트 확인:
   - `com.amazonaws.ap-northeast-2.ecr.api`
   - `com.amazonaws.ap-northeast-2.ecr.dkr`
3. 각 엔드포인트 선택 → **Subnets 탭**
4. **연결된 서브넷 목록 확인**

**문제 확인**:
- ❌ 태스크 서브넷이 엔드포인트 서브넷 목록에 **없다** → 문제 발견!
- ✅ 모든 태스크 서브넷이 엔드포인트에 포함되어 있다 → 다음 단계

### 3단계: 엔드포인트 수정 (서브넷 추가)

**만약 태스크 서브넷이 엔드포인트에 없다면**:

1. **VPC → Endpoints → 엔드포인트 선택**
2. **Actions → Manage subnet associations**
3. **누락된 서브넷 체크** (1단계에서 확인한 태스크 서브넷)
4. **Save changes**
5. **다른 ECR 엔드포인트도 동일하게 수정**

**중요**: 
- ECR API와 ECR DKR 엔드포인트 **둘 다** 모든 태스크 서브넷에 연결되어야 함
- **가용 영역별로 서브넷이 다를 수 있으므로 모든 가용 영역의 서브넷 확인**

### 4단계: 보안 그룹 확인 및 수정

**목적**: 엔드포인트와 태스크 간 통신이 보안 그룹에서 막혀있는지 확인

#### 4-1. 태스크 보안 그룹 확인

1. **ECS → Services → 서비스 선택 → Networking 탭**
2. **Security groups** 확인 (예: `sg-xxxxx`)

#### 4-2. 엔드포인트 보안 그룹 확인

1. **VPC → Endpoints → 각 ECR 엔드포인트 → Security 탭**
2. **Security groups** 확인

#### 4-3. 보안 그룹 규칙 확인

**ECR 엔드포인트 보안 그룹 인바운드 규칙**:
```
Type: HTTPS
Protocol: TCP
Port: 443
Source: 태스크 보안 그룹 ID (sg-xxxxx) 또는 0.0.0.0/0
```

**태스크 보안 그룹 아웃바운드 규칙**:
```
Type: HTTPS
Protocol: TCP
Port: 443
Destination: 0.0.0.0/0 (또는 엔드포인트 보안 그룹)
```

**수정 방법** (문제가 있다면):

**옵션 1: 같은 보안 그룹 사용** (가장 간단)
1. **VPC → Endpoints → 엔드포인트 선택 → Actions → Modify security groups**
2. **태스크와 같은 보안 그룹 추가**
3. **Save changes**

**옵션 2: 보안 그룹 규칙 추가**
- 엔드포인트 보안 그룹 인바운드에 태스크 보안 그룹 추가

### 5단계: Private DNS 확인

**목적**: DNS가 올바르게 리졸브되는지 확인

**확인 방법**:
1. **VPC → Endpoints → 각 ECR 엔드포인트 → Details 탭**
2. **Private DNS enabled** = `Yes`인지 확인

**문제가 있다면**:
- **Actions → Modify private DNS settings**
- **Enable private DNS name** 체크
- **Save changes**

### 6단계: S3 엔드포인트 라우트 테이블 확인

**목적**: S3 엔드포인트가 모든 태스크 서브넷의 라우트 테이블에 추가되었는지 확인

**확인 방법**:
1. **VPC → Route Tables**
2. **각 태스크 서브넷의 라우트 테이블 선택** (1단계에서 확인한 서브넷)
3. **Routes 탭** 확인
4. **`pl-xxxxx` (S3 Prefix List) → `vpce-xxxxx` (S3 엔드포인트)** 경로가 있는지 확인

**없다면**:
- **VPC → Endpoints → S3 엔드포인트 선택**
- **Route tables 탭 → Edit route tables**
- **누락된 라우트 테이블 추가**
- **Save changes**

### 7단계: 실제 연결 테스트 (ECS Exec)

**목적**: 태스크 내부에서 ECR 연결을 직접 테스트

**방법**:
1. **ECS → Clusters → 클러스터 선택 → Tasks 탭**
2. **실행 중인 태스크 선택 → Connect**
3. **ECS Exec 활성화 필요** (처음 사용 시)
4. **태스크 내부에서 실행**:
   ```bash
   # DNS 확인
   nslookup 906063354482.dkr.ecr.ap-northeast-2.amazonaws.com
   
   # 연결 테스트
   curl -v https://906063354482.dkr.ecr.ap-northeast-2.amazonaws.com
   ```

**예상 결과**:
- ✅ DNS가 엔드포인트 IP로 리졸브됨
- ✅ 연결 성공 (200 또는 401 응답)
- ❌ 타임아웃 → 네트워크 문제

### 8단계: CloudWatch 로그 분석

**목적**: 실패 태스크의 정확한 에러 시점과 IP 확인

**확인 방법**:
1. **ECS → Services → 서비스 선택 → Logs 탭**
2. **실패한 태스크의 로그 확인**
3. **에러 메시지의 IP 주소 기록** (예: `52.219.148.62`, `3.5.188.35`)
4. **VPC → Endpoints → 엔드포인트 선택 → Network interfaces 탭**
5. **엔드포인트의 Private IP 확인**
6. **비교**: 에러의 IP가 엔드포인트 IP와 일치하는가?

**결과 분석**:
- **일치함**: 엔드포인트로 라우팅되지만 연결 실패 → 보안 그룹 문제 가능
- **일치하지 않음**: 인터넷으로 라우팅됨 → 엔드포인트가 제대로 연결되지 않음

## 종합 해결 체크리스트

배포를 다시 실행하기 전에 다음을 모두 확인:

### 필수 확인 사항

✅ **1. 태스크 실행 서브넷 파악**
   - ECS 서비스의 Networking 탭에서 모든 서브넷 확인

✅ **2. ECR API 엔드포인트**
   - 모든 태스크 서브넷에 연결됨
   - Private DNS 활성화
   - 보안 그룹 규칙 올바름

✅ **3. ECR DKR 엔드포인트**
   - 모든 태스크 서브넷에 연결됨
   - Private DNS 활성화
   - 보안 그룹 규칙 올바름

✅ **4. S3 엔드포인트**
   - 모든 태스크 서브넷의 라우트 테이블에 추가됨

✅ **5. 보안 그룹**
   - 엔드포인트와 태스크 간 HTTPS(443) 통신 허용

✅ **6. 태스크 실행 역할**
   - ECR 권한 (`AmazonECSTaskExecutionRolePolicy`) 있음

## 예상 결과

위 체크리스트를 모두 완료하면:
- ✅ 모든 태스크가 첫 시도에 성공
- ✅ 배포 시간 단축 (15분 → 2-3분)
- ✅ 실패 태스크 없음
- ✅ 안정적인 배포

## 추가 모니터링

해결 후에도 다음을 모니터링:
1. **CloudWatch Metrics**: ECS 태스크 성공률
2. **CloudWatch Logs**: 실패 태스크 에러 로그
3. **VPC Flow Logs**: 네트워크 트래픽 패턴 (선택사항)

## 빠른 수정 방법 (임시)

만약 급하게 배포해야 한다면:
1. **ECS 서비스 설정 → Deployment Configuration**
2. **Maximum percent**: 100% → 200% (더 많은 태스크 동시 생성)
3. **Minimum healthy percent**: 50% → 0% (임시)
4. 실패 태스크가 더 빨리 재시도되지만 근본 해결은 아님

**주의**: 근본 해결은 위의 체크리스트를 모두 완료하는 것입니다.

