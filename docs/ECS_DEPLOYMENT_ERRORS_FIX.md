# ECS 배포 오류 해결 가이드

## 발생한 오류들

### 1. 이미지 버전 안정성 오류

**에러 메시지**:
```
Amazon ECS는 이미지 버전 안정성을 강제합니다. 원본 이미지를 더 이상 사용할 수 없는 경우 이 오류가 발생합니다.
```

**원인**:
- 이미지가 ECR에 제대로 푸시되지 않음
- 이미지 태그가 변경되거나 삭제됨
- `:latest` 태그 사용 시 이미지가 덮어씌워짐

**해결 방법**:
- ✅ 이미지 푸시 후 ECR에서 이미지 존재 확인
- ✅ 특정 버전 태그 사용 (`${{ github.sha }}`)
- ✅ 배포 전 이미지 검증 단계 추가

### 2. ENI (Elastic Network Interface) 오류

**에러 메시지**:
```
ENI 세부 정보를 가져오는 중 오류 발생
The networkInterface ID 'eni-xxxxx' does not exist
```

**원인**:
- 기존 태스크의 ENI가 삭제되었는데 서비스가 여전히 참조
- 태스크가 중지된 후 ENI가 정리되지 않음
- 서비스 롤링 업데이트 중 ENI 충돌

**해결 방법**:
- ✅ 기존 태스크 정리
- ✅ 강제 새 배포 (`force-new-deployment`)
- ✅ 서비스 재시작

## 워크플로우 수정 사항

### 1. 이미지 검증 단계 추가

**빌드 후 검증**:
```yaml
- name: Verify image exists in ECR
  run: |
    aws ecr describe-images \
      --repository-name ${{ env.ECR_REPOSITORY }} \
      --image-ids imageTag=${{ env.IMAGE_TAG }} \
      --region ${{ env.AWS_REGION }}
```

**배포 전 검증**:
```yaml
- name: Verify image exists in ECR before deployment
  run: |
    # 배포 전에 이미지가 존재하는지 확인
```

### 2. 태스크 정의 검증

```yaml
- name: Verify task definition
  run: |
    echo "${{ steps.taskdef.outputs.task-definition }}" | jq '.containerDefinitions[0].image'
```

### 3. ENI 오류 방지

```yaml
- name: Check and cleanup stale tasks
  run: |
    # 기존 태스크 확인 및 정리
    aws ecs update-service \
      --force-new-deployment
```

```yaml
- name: Deploy to ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    force-new-deployment: true  # 강제 새 배포
```

## 이미지 태그 전략

### 현재 사용 중

**커밋 SHA 사용**:
```yaml
IMAGE_TAG: ${{ github.sha }}
```

**장점**:
- ✅ 각 커밋마다 고유한 태그
- ✅ 이미지 버전 추적 가능
- ✅ 롤백 용이

**단점**:
- ⚠️ 태그가 길어짐
- ⚠️ 의미있는 버전 정보 부족

### 권장 태그 전략

**옵션 1: 커밋 SHA + latest (권장)**:
```yaml
tags: |
  ${{ env.IMAGE_URI }}
  ${{ env.IMAGE_URI }}:latest
```

**옵션 2: 시맨틱 버전**:
```yaml
IMAGE_TAG: v1.0.0-${{ github.sha }}
```

## ENI 오류 해결 방법

### 방법 1: 서비스 강제 재배포

**AWS 콘솔**:
1. ECS → Services → 서비스 선택
2. Update 클릭
3. Force new deployment 체크
4. Update 클릭

**AWS CLI**:
```bash
aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --force-new-deployment
```

### 방법 2: 서비스 재시작

```bash
aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --force-new-deployment \
  --desired-count 0

# 잠시 대기 후

aws ecs update-service \
  --cluster cluster-nestjs-second \
  --service app \
  --desired-count 2
```

### 방법 3: 문제가 있는 태스크 직접 삭제

```bash
# 중지된 태스크 목록 확인
aws ecs list-tasks \
  --cluster cluster-nestjs-second \
  --desired-status STOPPED

# 특정 태스크 삭제 (필요한 경우)
aws ecs stop-task \
  --cluster cluster-nestjs-second \
  --task TASK_ARN \
  --reason "Cleanup stale task"
```

## 예방 조치

### 1. 이미지 검증

**워크플로우에 추가된 검증**:
- 빌드 후 이미지 존재 확인
- 배포 전 이미지 존재 확인
- 태스크 정의 렌더링 확인

### 2. 강제 새 배포

**배포 시 자동 실행**:
- `force-new-deployment: true` 옵션 사용
- 기존 태스크 정리
- 새로운 ENI 생성

### 3. 이미지 태그 관리

**권장 사항**:
- ✅ `:latest` 태그만 사용하지 않기
- ✅ 특정 버전 태그 사용
- ✅ 커밋 SHA 기반 태그 사용

## 문제 해결 체크리스트

### 이미지 버전 안정성 오류

- [ ] 이미지가 ECR에 실제로 존재하는지 확인
- [ ] 이미지 태그가 올바른지 확인
- [ ] ECR 리포지토리 권한 확인
- [ ] 이미지 푸시 로그 확인

### ENI 오류

- [ ] 기존 태스크 상태 확인
- [ ] 서비스 강제 재배포 실행
- [ ] ENI가 정상적으로 삭제되었는지 확인
- [ ] 서브넷 및 보안 그룹 설정 확인

## 추가 확인 사항

### ECR 이미지 확인

```bash
# 이미지 목록 확인
aws ecr list-images \
  --repository-name minimal-project \
  --region ap-northeast-2

# 특정 태그 확인
aws ecr describe-images \
  --repository-name minimal-project \
  --image-ids imageTag=COMMIT_SHA \
  --region ap-northeast-2
```

### ECS 태스크 확인

```bash
# 실행 중인 태스크 확인
aws ecs list-tasks \
  --cluster cluster-nestjs-second \
  --service-name app \
  --desired-status RUNNING

# 태스크 상세 정보 확인
aws ecs describe-tasks \
  --cluster cluster-nestjs-second \
  --tasks TASK_ARN
```

## 요약

### ✅ 적용된 해결책

1. **이미지 검증**: 빌드 후 및 배포 전 이미지 존재 확인
2. **태스크 정의 검증**: 렌더링된 태스크 정의 확인
3. **ENI 오류 방지**: 강제 새 배포 및 기존 태스크 정리
4. **강제 새 배포**: `force-new-deployment: true` 옵션 사용

### 🔧 추가 권장 사항

1. **이미지 태그 전략**: 커밋 SHA 기반 태그 유지
2. **모니터링**: 배포 로그 정기 확인
3. **롤백 계획**: 문제 발생 시 이전 이미지로 롤백

