# RDS MariaDB 한글 입력 문제 해결 가이드

## 문제 원인

RDS MariaDB에서 한글 입력 시 `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD` 에러가 발생하는 이유는 **문자셋(Character Set)이 UTF-8이 아닌 다른 문자셋(예: latin1)으로 설정**되어 있기 때문입니다.

로컬 MariaDB는 UTF-8로 설정되어 있지만, RDS MariaDB는 기본값이 다를 수 있습니다.

## 해결 방법

### 1. 코드 레벨 수정 (완료됨)

✅ **TypeORM 연결 설정 수정** (`src/app.module.ts`)
- 연결 시 UTF-8 문자셋 명시 (`charset: 'utf8mb4'`)
- 애플리케이션 레벨에서 UTF-8 사용 보장

⚠️ **엔티티 파일**: 컬럼별 문자셋 설정은 제거 (데이터베이스 기본값 사용)

### 2. RDS 데이터베이스 레벨 수정 (필수!)

#### 방법 A: SQL 스크립트 실행 (권장)

1. **AWS RDS Query Editor** 또는 MySQL 클라이언트 접속

2. **`scripts/fix-database-charset.sql` 파일의 SQL 실행**

```sql
-- 데이터베이스 문자셋 변경
ALTER DATABASE minimal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 기존 테이블 문자셋 변경
ALTER TABLE test CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 컬럼별 문자셋 변경 (더 안전)
ALTER TABLE test 
  MODIFY COLUMN name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
```

3. **변경 확인**

```sql
-- 데이터베이스 문자셋 확인
SHOW CREATE DATABASE minimal;

-- 테이블 문자셋 확인
SHOW CREATE TABLE test;

-- 컬럼별 문자셋 확인
SELECT 
  COLUMN_NAME, 
  CHARACTER_SET_NAME, 
  COLLATION_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'minimal' 
  AND TABLE_NAME = 'test' 
  AND COLUMN_NAME IN ('name', 'description');
```

#### 방법 B: RDS 파라미터 그룹 수정 (권장 - 데이터베이스 초기 설정)

**이 방법을 사용하면 새로 생성되는 데이터베이스/테이블이 자동으로 UTF-8로 설정됩니다.**

1. **RDS → Parameter groups → 파라미터 그룹 선택 또는 생성**
   - 기존 파라미터 그룹 사용 또는 새로 생성

2. **다음 파라미터 설정**:
   ```
   character_set_server: utf8mb4
   character_set_database: utf8mb4
   collation_server: utf8mb4_unicode_ci
   collation_database: utf8mb4_unicode_ci
   character_set_client: utf8mb4
   character_set_connection: utf8mb4
   character_set_results: utf8mb4
   ```

3. **RDS 인스턴스에 파라미터 그룹 적용**:
   - RDS → Databases → 인스턴스 선택 → Modify
   - Database options → DB parameter group: 위에서 설정한 파라미터 그룹 선택
   - Apply immediately 선택 (즉시 적용) 또는 Maintenance window에서 적용
   - **인스턴스 재부팅 필요** (일부 파라미터는 재부팅 후 적용)

4. **기존 데이터베이스/테이블도 변경**:
   - 파라미터 그룹만으로는 기존 객체가 변경되지 않으므로 **방법 A의 SQL도 실행** 필요

💡 **권장 절차**:
1. 먼저 파라미터 그룹 설정 (미래 테이블용)
2. 기존 데이터베이스/테이블에 SQL 실행 (현재 테이블용)
3. 애플리케이션 재시작

### 3. 기존 데이터 마이그레이션 (데이터가 있는 경우)

기존에 latin1로 저장된 데이터가 있다면 변환 필요:

```sql
-- 1. 백업 (중요!)
-- mysqldump 또는 RDS Snapshot 생성

-- 2. 데이터 변환
ALTER TABLE test 
  MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- 또는 데이터 재인코딩이 필요한 경우
-- UPDATE test SET description = CONVERT(CONVERT(description USING latin1) USING utf8mb4);
```

## 검증

1. **애플리케이션 재시작** 후 테스트

2. **한글 입력 테스트**:
```json
POST /
{
  "name": "테스트",
  "description": "한글 설명입니다"
}
```

3. **에러 없이 성공하면 해결 완료!**

## 추가 권장 사항

### 1. 마이그레이션 파일 생성 (향후 안정성)

TypeORM 마이그레이션을 사용하여 문자셋 변경을 코드로 관리:

```bash
npm install typeorm --save
```

### 2. RDS 파라미터 그룹 설정 확인

데이터베이스 레벨에서 UTF-8이 기본값이므로, 엔티티에 별도 설정 불필요.
새 엔티티는 자동으로 UTF-8로 생성됩니다.

### 3. 연결 문자열 확인

애플리케이션 시작 시 연결 문자열에 문자셋 포함 확인:

```
jdbc:mariadb://host:port/db?characterEncoding=utf8mb4&connectionCollation=utf8mb4_unicode_ci
```

TypeORM은 설정에서 `charset: 'utf8mb4'`로 처리됨.

## 문제가 계속되면?

1. **RDS 인스턴스 재부팅** 시도
2. **TypeORM `synchronize: true` 일시 활성화** (개발 환경에서만)하여 테이블 재생성
3. **새 테이블 생성 후 기존 데이터 마이그레이션**

