param(
  [ValidateSet('env','jwt','start','restart','stop','status','logs','migrate','import-sql')]
  [string]$Action = 'start',
  [string]$ApiUrl = 'http://localhost:3100',
  [string]$WebUrl = 'http://localhost:8080',
  [string]$SqlFile = ''
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$DeployDir = Join-Path $Root 'docker\buzzerhood'
$SecretsDir = Join-Path $DeployDir 'secrets'
$DataDir = Join-Path $Root '.docker-data\postgres'
$FrontendEnv = Join-Path $Root '.env.production'
$ApiEnv = Join-Path $DeployDir '.env.api'
$DbPasswordFile = Join-Path $SecretsDir 'postgres_password.txt'
$JwtPrivate = Join-Path $SecretsDir 'jwt-private.pem'
$JwtPublic = Join-Path $SecretsDir 'jwt-public.pem'

function New-RandomHex([int]$Length) {
  -join ((48..57) + (97..102) | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

function Find-OpenSsl {
  @(
    'openssl',
    'C:\Program Files\OpenSSL-Win64\bin\openssl.exe',
    'C:\Program Files\Git\usr\bin\openssl.exe',
    'C:\OpenSSL-Win64\bin\openssl.exe'
  ) | Where-Object {
    try { & $_ version *> $null; $LASTEXITCODE -eq 0 } catch { $false }
  } | Select-Object -First 1
}

function Ensure-Dirs {
  New-Item -ItemType Directory -Force $SecretsDir, $DataDir | Out-Null
}

function New-JwtKeys {
  Ensure-Dirs
  $openssl = Find-OpenSsl
  if ($openssl) {
    & $openssl genpkey -algorithm ED25519 -out $JwtPrivate
    & $openssl pkey -in $JwtPrivate -pubout -out $JwtPublic
  } elseif (Get-Command node -ErrorAction SilentlyContinue) {
    $generator = "const {generateKeyPairSync}=require('node:crypto');const {writeFileSync}=require('node:fs');const k=generateKeyPairSync('ed25519');writeFileSync(process.argv[1],k.privateKey.export({type:'pkcs8',format:'pem'}));writeFileSync(process.argv[2],k.publicKey.export({type:'spki',format:'pem'}));"
    node -e $generator $JwtPrivate $JwtPublic
  } else {
    throw 'OpenSSL atau Node.js diperlukan untuk membuat Ed25519 JWT keys.'
  }
  Write-Host "[OK] JWT keys dibuat di docker/buzzerhood/secrets"
}

function New-EnvFiles {
  Ensure-Dirs
  if (-not (Test-Path $DbPasswordFile)) {
    New-RandomHex 48 | Set-Content -Path $DbPasswordFile -Encoding ascii -NoNewline
  }
  if (-not (Test-Path $JwtPrivate) -or -not (Test-Path $JwtPublic)) {
    New-JwtKeys
  }
  $dbPassword = (Get-Content $DbPasswordFile -Raw).Trim()
  $apiBase = $ApiUrl.TrimEnd('/')
  $webBase = $WebUrl.TrimEnd('/')
  $jwtKeyId = 'buzzerhood-' + (Get-Date -Format 'yyyyMMddHHmmss')

  @"
VITE_API_BASE_URL=$apiBase/api/v1
"@ | Set-Content -Path $FrontendEnv -Encoding utf8 -NoNewline

  @"
NODE_ENV=production
HOST=0.0.0.0
PORT=3100
DATABASE_URL=postgresql://buzzerhood_app:$dbPassword@postgres:5432/buzzerhood
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_QUERY_TIMEOUT_MS=10000
JWT_ISSUER=$apiBase
JWT_AUDIENCE=buzzerhood-web
JWT_ACCESS_TTL_SECONDS=600
JWT_PRIVATE_KEY_PATH=/run/secrets/buzzerhood-jwt-private.pem
JWT_PUBLIC_KEY_PATH=/run/secrets/buzzerhood-jwt-public.pem
JWT_KEY_ID=$jwtKeyId
REFRESH_TOKEN_TTL_SECONDS=2592000
REFRESH_COOKIE_NAME=buzzerhood_refresh
CSRF_COOKIE_NAME=buzzerhood_csrf
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
CORS_ORIGINS=$webBase
AUTH_REGISTRATION_MODE=closed
AUTH_RATE_LIMIT_TTL_MS=60000
AUTH_RATE_LIMIT_MAX=10
SWAGGER_ENABLED=false
LOG_LEVEL=info
"@ | Set-Content -Path $ApiEnv -Encoding utf8 -NoNewline

  Write-Host "[OK] Frontend env: .env.production"
  Write-Host "[OK] Backend env: docker/buzzerhood/.env.api"
  Write-Host "[OK] Database secret: docker/buzzerhood/secrets/postgres_password.txt"
  Write-Host "[INFO] Data Postgres bind mount: .docker-data/postgres"
}

function Compose([string[]]$Args) {
  Push-Location $DeployDir
  try { docker compose @Args } finally { Pop-Location }
}

function Apply-Migrations {
  Compose @('up','-d','postgres')
  Start-Sleep -Seconds 8
  $dbPassword = (Get-Content $DbPasswordFile -Raw).Trim()
  docker exec buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'buzzerhood_app') THEN CREATE ROLE buzzerhood_app WITH LOGIN PASSWORD '$dbPassword' NOCREATEDB NOCREATEROLE NOREPLICATION; END IF; END `$`$;"
  Get-ChildItem (Join-Path $Root 'database\migrations\*.sql') | Sort-Object Name | ForEach-Object {
    Write-Host "[MIGRATE] $($_.Name)"
    Get-Content $_.FullName -Raw | docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1
  }
  Get-Content (Join-Path $Root 'database\operations\create_buzzerhood_app_role.sql') -Raw | docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1 -v "app_password=$dbPassword"
}

switch ($Action) {
  'env' { New-EnvFiles }
  'jwt' { New-JwtKeys }
  'start' { New-EnvFiles; Compose @('up','-d','--build'); Compose @('ps') }
  'restart' { Compose @('restart'); Compose @('ps') }
  'stop' { Compose @('down') }
  'status' { Compose @('ps') }
  'logs' { Compose @('logs','-f') }
  'migrate' { Apply-Migrations }
  'import-sql' {
    if (-not $SqlFile) { throw 'Isi -SqlFile path file .sql/.dump' }
    $resolved = Resolve-Path $SqlFile
    if ($resolved.Path.EndsWith('.dump')) {
      docker cp $resolved.Path buzzerhood-postgres:/tmp/import.dump
      docker exec buzzerhood-postgres pg_restore -U postgres -d buzzerhood --clean --if-exists --no-owner --no-privileges /tmp/import.dump
    } else {
      Get-Content $resolved.Path -Raw | docker exec -i buzzerhood-postgres psql -U postgres -d buzzerhood -v ON_ERROR_STOP=1
    }
  }
}
