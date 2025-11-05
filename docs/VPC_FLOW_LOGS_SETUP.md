# VPC Flow Logs 설정 가이드

## IAM 역할 생성 및 설정

### 1단계: IAM 역할 생성

1. **IAM 콘솔로 이동**: https://console.aws.amazon.com/iam/
2. **Roles → Create role** 클릭
3. **Trusted entity type 선택**:
   - ✅ **AWS service** 선택
4. **Use case 선택**:
   - ✅ **VPC** 선택
   - ✅ **VPC Flow Logs** 선택
5. **Next** 클릭

### 2단계: 권한 정책 확인

AWS가 자동으로 다음 정책을 추가합니다:
- **AWS managed policy**: `VPCFlowLogsDeliveryRole`

이 정책에는 다음 권한이 포함됩니다:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3단계: 역할 이름 지정

1. **Role name** 입력 (예: `VPCFlowLogsRole`)
2. **Description** 입력 (선택사항, 예: "VPC Flow Logs delivery role")
3. **Create role** 클릭

### 4단계: VPC Flow Logs 생성

1. **VPC 콘솔로 이동**: https://console.aws.amazon.com/vpc/
2. **Your VPCs** 선택
3. **VPC 선택** (ECS 태스크가 실행되는 VPC)
4. **Flow logs** 탭 클릭
5. **Create flow log** 버튼 클릭

### 5단계: Flow Log 설정

1. **Filter**:
   - ✅ **All** 선택 (모든 트래픽 기록)

2. **Destination**:
   - ✅ **Send to CloudWatch Logs** 선택

3. **Destination details**:
   - **Destination log group**:
     - 새로 생성: `vpc-flow-logs` (또는 원하는 이름)
     - 기존 사용: 기존 로그 그룹 선택
   - **IAM role**: 
     - ✅ **방금 생성한 역할 선택** (예: `VPCFlowLogsRole`)

4. **Format**:
   - ✅ **Default** 선택 (또는 필요 시 커스텀)

5. **Tags** (선택사항):
   - 원하는 태그 추가

6. **Create flow log** 클릭

## 기존 역할 사용 (선택사항)

만약 이미 VPC Flow Logs용 역할이 있다면:
- **IAM → Roles**에서 해당 역할 선택
- **Trust relationships** 탭에서 다음 트러스트 정책이 있는지 확인:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "vpc-flow-logs.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }
  ```

## CloudWatch Logs 그룹 확인

1. **CloudWatch 콘솔로 이동**: https://console.aws.amazon.com/cloudwatch/
2. **Log groups** 선택
3. **생성한 로그 그룹 확인** (예: `vpc-flow-logs`)
4. **로그가 생성될 때까지 대기** (약 5-10분 소요)

## 로그 확인 방법

### 실패한 태스크의 시간대 로그 확인

1. **CloudWatch → Log groups → `vpc-flow-logs` 선택**
2. **Log streams** 탭에서 실패한 태스크의 시간대 찾기
3. **로그 스트림 클릭**하여 상세 로그 확인

### S3 트래픽 확인

로그에서 다음 필드 확인:
- **srcaddr**: 소스 IP (ECS 태스크 IP)
- **dstaddr**: 대상 IP (`52.219.204.42` 등 S3 IP)
- **action**: `ACCEPT` (허용) 또는 `REJECT` (차단)
- **dstport**: 대상 포트 (443)
- **protocol**: `6` (TCP)

**예상 결과**:
- ✅ **`action: ACCEPT`, `dstaddr: 52.219.204.42`**: 트래픽이 허용되었지만 타임아웃 발생 (라우팅 문제)
- ❌ **`action: REJECT`**: 트래픽이 차단됨 (보안 그룹/ACL 문제)

## 트러블슈팅

### 문제: 역할을 찾을 수 없음

**해결**:
- IAM 역할이 올바르게 생성되었는지 확인
- 역할 이름이 정확한지 확인
- VPC와 같은 리전에 있는지 확인

### 문제: 로그가 생성되지 않음

**해결**:
1. **IAM 역할 권한 확인**:
   - `VPCFlowLogsDeliveryRole` 정책이 연결되어 있는지 확인
2. **CloudWatch Logs 그룹 확인**:
   - 로그 그룹이 생성되었는지 확인
   - 로그 그룹 이름이 정확한지 확인
3. **대기 시간**:
   - Flow Log 생성 후 5-10분 대기
   - VPC에 트래픽이 있어야 로그 생성

### 문제: 로그가 너무 많음

**해결**:
- **Filter**를 `All` 대신 `Rejected` 또는 `Accepted`로 변경
- 특정 IP 범위만 필터링 (고급)

## 비용 고려사항

- **VPC Flow Logs**: 무료 (AWS 서비스)
- **CloudWatch Logs**:
  - 수집: $0.50/GB
  - 저장: $0.03/GB/월
  - 검색: $0.005/GB

**절약 방법**:
- 문제 해결 후 Flow Log 비활성화
- 또는 로그 보존 기간 단축 (예: 7일)

## 다음 단계

Flow Logs가 활성화되면:
1. **배포 실행**하여 실패한 태스크 생성
2. **CloudWatch Logs에서 실패한 시간대 로그 확인**
3. **S3 IP(`52.219.204.42`)로의 트래픽 경로 확인**
4. **`action` 필드 확인**:
   - `ACCEPT`: 트래픽 허용 (라우팅 문제 가능성)
   - `REJECT`: 트래픽 차단 (보안 그룹/ACL 문제)

