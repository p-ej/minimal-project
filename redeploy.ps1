Param(
  [string]$AppName,
  [int]$AppPort,
  [string]$ImageTag,
  [int]$HostPort
)

# 기본값 설정 (환경변수 → 인자 → 기본값 순서)
if (-not $AppName) { $AppName = if ($env:APP_NAME) { $env:APP_NAME } else { "minimal-project" } }
if (-not $AppPort) { $AppPort = if ($env:APP_PORT) { [int]$env:APP_PORT } else { 3000 } }
if (-not $ImageTag) { $ImageTag = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" } }
if (-not $HostPort) { $HostPort = if ($env:HOST_PORT) { [int]$env:HOST_PORT } else { $AppPort } }

$ImageName = "$AppName`:$ImageTag"
Write-Host "▶️  Redeploying $ImageName (host $HostPort -> container $AppPort)"

# 1️⃣ 기존 컨테이너 중지 및 삭제
$exists = docker ps -a --format '{{.Names}}' | Where-Object { $_ -eq $AppName }
if ($exists) {
  Write-Host "⏹  Stopping container $AppName..."
  docker stop $AppName | Out-Null
  Write-Host "🗑  Removing container $AppName..."
  docker rm -f $AppName | Out-Null
}


# 2️⃣ 기존 이미지 삭제 (선택)
$imgId = docker images -q $ImageName
if ($imgId) {
  Write-Host "🧹 Removing old image $ImageName..."
  docker rmi -f $ImageName | Out-Null
}

# 3️⃣ 새 이미지 빌드
Write-Host "🏗  Building image $ImageName..."
docker build -t $ImageName .

# 4️⃣ 새 컨테이너 실행
Write-Host "🚀 Running container $AppName..."
docker run -d --name $AppName -p "$HostPort`:$AppPort" $ImageName | Out-Null

Write-Host "✅ Done. Open: http://localhost:$HostPort"
