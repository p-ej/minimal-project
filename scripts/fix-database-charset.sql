-- RDS MariaDB 문자셋을 UTF-8(utf8mb4)로 변경하는 스크립트
-- 실행 방법: RDS Query Editor 또는 MySQL 클라이언트에서 실행

-- 1. 데이터베이스 문자셋 변경
ALTER DATABASE minimal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 기존 테이블의 문자셋 변경
ALTER TABLE test CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 특정 컬럼의 문자셋 변경 (더 안전한 방법)
ALTER TABLE test 
  MODIFY COLUMN name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- 4. 확인 쿼리 (변경 전 실행하여 현재 상태 확인)
-- SHOW CREATE DATABASE minimal;
-- SHOW CREATE TABLE test;
-- SELECT TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'minimal' AND TABLE_NAME = 'test';
-- SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
-- FROM information_schema.COLUMNS 
-- WHERE TABLE_SCHEMA = 'minimal' AND TABLE_NAME = 'test' AND COLUMN_NAME IN ('name', 'description');

