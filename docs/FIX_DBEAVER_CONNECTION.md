# DBeaver로 Docker MariaDB 연결 문제 해결

## 문제 원인

docker-compose.yml에서 `db` 서비스에 **포트 매핑이 없어서** 호스트(로컬 PC)에서 컨테이너의 MariaDB에 접속할 수 없었습니다.

## 해결 방법

### 1. docker-compose.yml 수정 (완료됨)

`db` 서비스에 포트 매핑 추가:
```yaml
ports:
  - "${DB_PORT:-3306}:3306"
```

이제 호스트의 `localhost:3306` (또는 .env의 DB_PORT)로 접속 가능합니다.

### 2. Docker 컨테이너 실행 확인

```bash
# 컨테이너가 실행 중인지 확인
docker-compose ps

# MariaDB 컨테이너가 정상 실행 중이어야 함
# 상태가 "Up"이고 포트가 매핑되어 있어야 함
```

### 3. 포트 사용 확인

다른 애플리케이션이 3306 포트를 사용 중일 수 있습니다:

**Windows**:
```powershell
netstat -ano | findstr :3306
```

**Mac/Linux**:
```bash
lsof -i :3306
# 또는
sudo netstat -tulpn | grep :3306
```

포트가 사용 중이면:
- 다른 애플리케이션 종료
- 또는 docker-compose.yml에서 다른 포트 사용 (예: `3307:3306`)

### 4. DBeaver 연결 설정

#### 4-1. 새 연결 생성

1. **DBeaver → Database → New Database Connection**
2. **MariaDB** 선택
3. **Next**

#### 4-2. 연결 정보 입력

**Main 탭**:
```
Host: localhost (또는 127.0.0.1)
Port: 3306 (또는 .env의 DB_PORT 값)
Database: minimal (또는 .env의 DB_NAME)
Username: admin (또는 .env의 DB_USER)
Password: Admin12! (또는 .env의 DB_PASS)
```

**Driver properties 탭 (선택사항)**:
```
allowPublicKeyRetrieval=true
useSSL=false
```

#### 4-3. 테스트 연결

1. **Test Connection** 클릭
2. 드라이버가 없다면 자동 다운로드됨
3. ✅ **Success** 메시지 확인

### 5. 일반적인 연결 거부 원인 및 해결

#### 원인 1: 포트 매핑 없음 ✅ (해결됨)
- docker-compose.yml에 `ports` 추가 완료

#### 원인 2: 컨테이너가 실행되지 않음
```bash
# 컨테이너 상태 확인
docker ps -a | grep mariadb

# 실행되지 않았다면
docker-compose up -d db
```

#### 원인 3: MariaDB가 아직 초기화 중
```bash
# 컨테이너 로그 확인
docker-compose logs db

# "ready for connections" 메시지가 나올 때까지 대기
# 또는 healthcheck가 완료될 때까지 대기 (최대 90초)
```

#### 원인 4: 잘못된 포트 번호
- .env 파일의 `DB_PORT` 값 확인
- DBeaver 연결 설정의 포트 번호와 일치하는지 확인

#### 원인 5: 방화벽 차단
- Windows 방화벽에서 3306 포트 허용
- 또는 Docker Desktop의 방화벽 설정 확인

#### 원인 6: 잘못된 인증 정보
- .env 파일의 다음 값 확인:
  - `DB_USER`
  - `DB_PASS`
  - `DB_NAME`
  - `DB_ROOT_PASSWORD` (root 계정으로 테스트 시)

### 6. 연결 테스트 방법

#### 방법 1: DBeaver에서 직접 연결
위의 4단계 참고

#### 방법 2: 명령줄에서 테스트
```bash
# Docker 컨테이너 내부에서 테스트
docker-compose exec db mariadb -u${DB_USER} -p${DB_PASS} ${DB_NAME}

# 또는 호스트에서 테스트 (mysql 클라이언트 설치 필요)
mysql -h localhost -P 3306 -u admin -pAdmin12! minimal
```

#### 방법 3: Docker 네트워크 확인
```bash
# 컨테이너 IP 확인
docker inspect mariadb | grep IPAddress

# 직접 IP로 접속 시도 (일반적으로 불필요)
```

### 7. .env 파일 확인

`.env` 파일에 다음 값이 올바르게 설정되어 있는지 확인:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=admin
DB_PASS=Admin12!
DB_NAME=minimal
DB_ROOT_PASSWORD=your_root_password
```

### 8. 문제 해결 체크리스트

✅ docker-compose.yml에 `ports` 매핑 추가됨
✅ Docker 컨테이너가 실행 중 (`docker-compose ps`)
✅ MariaDB 초기화 완료 (`docker-compose logs db` 확인)
✅ 포트 3306이 사용 가능 (다른 앱이 점유하지 않음)
✅ DBeaver 연결 설정이 올바름 (호스트, 포트, 사용자명, 비밀번호)
✅ .env 파일의 값이 올바름
✅ 방화벽에서 포트 허용됨

### 9. 여전히 연결되지 않는다면?

1. **컨테이너 재시작**:
   ```bash
   docker-compose down
   docker-compose up -d db
   ```

2. **포트를 다른 값으로 변경** (포트 충돌 의심 시):
   ```yaml
   ports:
     - "3307:3306"  # 호스트 3307, 컨테이너 3306
   ```
   - DBeaver에서도 포트를 3307로 변경

3. **MariaDB 컨테이너 로그 확인**:
   ```bash
   docker-compose logs db | tail -50
   ```
   - 에러 메시지가 있는지 확인

4. **Docker Desktop 네트워크 설정 확인**:
   - Docker Desktop → Settings → Network
   - 충돌하는 네트워크 설정 확인

