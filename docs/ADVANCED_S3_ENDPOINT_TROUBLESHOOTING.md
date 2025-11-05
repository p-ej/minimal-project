# S3 엔드포인트 고급 트러블슈팅

## 상황: 모든 체크리스트 확인했는데도 문제 지속

### 확인된 사항
- ✅ S3 엔드포인트 존재
- ✅ 라우트 테이블에 S3 엔드포인트 경로 있음
- ✅ 보안 그룹 설정 올바름
- ✅ Private DNS 활성화
- ✅ 네트워크 ACL 허용
- ❌ 여전히 S3 IP (`52.219.204.42`)로 타임아웃 발생

## 추가 진단 방법

### 1단계: S3 Prefix List CIDR 범위 확인 (✅ 확인 완료)

**확인 결과**:
- Prefix List에 `52.219.204.0/22` 포함됨
- 에러 IP `52.219.204.42`는 이 범위에 포함됨
- **Prefix List는 올바르게 설정되어 있음**

**결론**: Prefix List 문제는 아님 → 다른 원인 확인 필요

### 2단계: 라우트 테이블 경로 순서 확인

**문제**: 더 구체적인 경로가 있어도 라우팅 순서가 잘못될 수 있음

**확인 방법**:
1. **VPC → Route Tables → 라우트 테이블 → Routes 탭**
2. **모든 경로를 위에서 아래로 확인**:
   ```
   Destination          Target
   pl-xxxxx (S3)        vpce-xxxxx (S3 엔드포인트)  ← 이게 있어야 함
   0.0.0.0/0            nat-gateway-xxxxx
   ```

**중요**: AWS는 **가장 구체적인 경로를 자동 선택**하므로:
- Prefix List (`pl-xxxxx`)는 `0.0.0.0/0`보다 구체적
- 자동으로 S3 엔드포인트가 우선 선택되어야 함
- 하지만 실제로는 그렇지 않을 수 있음

### 3단계: VPC Flow Logs로 실제 트래픽 확인

**가장 확실한 진단 방법**

#### Flow Logs 생성 (없다면)

1. **VPC → Flow Logs → Create Flow Log**
2. **설정**:
   - **Resource type**: VPC
   - **VPC**: 태스크가 실행되는 VPC 선택
   - **Filter**: All
   - **Destination**: Send to CloudWatch Logs
   - **Destination log group**: 새로 생성 또는 기존 사용
   - **IAM role**: Flow Logs용 역할 생성 (필요 시)
   - **Create Flow Log**

#### Flow Logs 분석

1. **CloudWatch → Log groups → VPC Flow Logs 선택**
2. **실패한 태스크의 시간대 로그 검색**:
   - 필터: `52.219.204.42` (S3 IP)
   - 또는 `action REJECT` (거부된 트래픽)

3. **로그 형식 분석**:
   ```
   version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status
   ```
   - `dstaddr`: 목적지 IP (S3 IP)
   - `action`: `ACCEPT` 또는 `REJECT`
   - 경로 정보는 직접 나오지 않지만, `action`으로 차단 여부 확인 가능

4. **확인할 항목**:
   - S3 IP로의 트래픽이 `REJECT`되는지
   - 트래픽이 전혀 없는지 (라우팅 문제)

### 4단계: CloudWatch 네트워크 메트릭 확인

**ECS → Services → 서비스 선택 → Metrics 탭**

**확인할 메트릭**:
- **NetworkRxBytes**: 네트워크 수신
- **NetworkTxBytes**: 네트워크 전송

**태스크 시작 시점의 네트워크 트래픽 확인**:
- ✅ 트래픽 있음: 네트워크는 작동하지만 S3 접근 실패
- ❌ 트래픽 없음: 네트워크 자체 문제

### 5단계: S3 엔드포인트 재생성

**모든 설정이 올바른데도 문제가 지속되면**:

1. **기존 S3 엔드포인트 삭제**:
   - VPC → Endpoints → S3 엔드포인트 선택
   - Actions → Delete Endpoint
   - 확인

2. **새로 생성**:
   - VPC → Endpoints → Create Endpoint
   - Service: `com.amazonaws.ap-northeast-2.s3`
   - Route tables: 프라이빗 서브넷의 라우트 테이블 선택
   - Create endpoint

3. **확인**:
   - 라우트 테이블에 새 Prefix List 경로 추가되었는지 확인
   - 배포 재시도

### 6단계: NAT Gateway와의 충돌 확인

**문제**: NAT Gateway의 `0.0.0.0/0` 경로가 S3 트래픽을 가로챌 수 있음

**확인 방법**:
1. **라우트 테이블 → Routes 탭**
2. **NAT Gateway 경로 확인**: `0.0.0.0/0` → `nat-gateway-xxxxx`
3. **S3 Prefix List 경로 확인**: `pl-xxxxx` → `vpce-xxxxx`

**이론상**:
- Prefix List가 더 구체적이므로 자동으로 우선 선택되어야 함
- 하지만 실제로는 다를 수 있음

**해결 방법** (임시):
- NAT Gateway 경로를 일시적으로 비활성화하여 테스트 (프로덕션에서는 위험)
- 또는 AWS Support 문의

### 7단계: ECS 태스크 네트워크 설정 확인

**ecs-task-def.json 확인**:
```json
{
  "networkMode": "awsvpc",
  ...
}
```

**확인 사항**:
- `networkMode`가 `awsvpc`인지 확인
- 다른 모드(`bridge`, `host`)는 VPC 엔드포인트 사용 불가

## 최종 확인 체크리스트

✅ S3 엔드포인트 존재  
✅ 라우트 테이블에 S3 Prefix List 경로 있음  
✅ Prefix List CIDR 범위가 S3 IP 포함  
✅ 라우트 테이블 경로 순서 확인  
✅ VPC Flow Logs로 실제 트래픽 확인  
✅ CloudWatch 네트워크 메트릭 확인  
✅ S3 엔드포인트 재생성 시도  
✅ NAT Gateway 충돌 확인  

## 여전히 해결되지 않으면

1. **AWS Support 문의**:
   - VPC Flow Logs
   - CloudWatch Metrics
   - 에러 메시지
   - 네트워크 구성 상세 정보

2. **임시 해결책**:
   - NAT Gateway를 통한 S3 접근 (비용 증가)
   - 또는 퍼블릭 서브넷에서 태스크 실행 (보안상 권장하지 않음)

