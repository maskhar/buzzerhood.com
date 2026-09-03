# Dokumentasi Buzzerhood

Selamat datang di dokumentasi Buzzerhood - Media, Influence & Distribution Network.

---

## Struktur Dokumentasi

### 📁 setup/
Panduan setup dan konfigurasi environment

- **ENV_SETUP_GUIDE.md** - Panduan lengkap setup file .env untuk development

### 📁 architecture/
Arsitektur sistem dan desain teknis

- **AUTH_ARCHITECTURE.md** - Arsitektur authentication dan authorization
- **BACKEND_ARCHITECTURE.md** - Arsitektur Backend API (NestJS)
- **BACKEND_MIGRATION_PLAN.md** - Rencana migrasi dari Supabase ke dedicated Backend

### 📁 deployment/
Panduan deployment dan CI/CD

- **CI_CD_DEPLOYMENT_GUIDE.md** - Panduan deployment dengan GitHub Actions
- **DEPLOYMENT_GUIDE.md** - Panduan deployment manual dengan Docker

### 📁 guides/
Panduan penggunaan dan best practices

- **ENVIRONMENT_FILES_GUIDE.md** - Panduan detail tentang file environment variables

### 📁 reports/
Laporan implementasi dan status deployment

- **B4A_IMPLEMENTATION_SUMMARY.md** - Summary implementasi Backend fase B4
- **BUZZERHOOD_PRODUCTION_LAUNCH_FINAL_REPORT.md** - Laporan final production launch
- **DEPLOYMENT_STATUS.md** - Status deployment terkini
- **PRODUCTION_LAUNCH_READY.md** - Checklist kesiapan production

---

## Quick Start

### Development Lokal

\\\ash
# 1. Clone repository
git clone https://github.com/yourusername/buzzerhood.git
cd buzzerhood

# 2. Install dependencies
npm install
cd backend && npm install

# 3. Setup environment files (lihat docs/setup/ENV_SETUP_GUIDE.md)
cp .env.example .env.local
cp backend/.env.example backend/.env

# 4. Start dengan Docker
cd docker/buzzerhood
docker-compose up -d

# Akses:
# Frontend: http://localhost:8080
# Backend API: http://localhost:3100
# Swagger: http://localhost:3100/api/docs
\\\

### Development Tanpa Docker

\\\ash
# 1. Start PostgreSQL
cd docker/buzzerhood
docker-compose up -d postgres

# 2. Start Backend
cd ../../backend
npm run start:dev

# 3. Start Frontend
cd ..
npm run dev

# Akses:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3100
\\\

---

## Teknologi Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: React Router

### Backend
- **Framework**: NestJS + TypeScript
- **Runtime**: Node.js 20+
- **HTTP Server**: Fastify
- **Authentication**: Custom JWT (EdDSA)
- **Validation**: Zod

### Database
- **DBMS**: PostgreSQL 17
- **Schema**: buzzerhood
- **Query Builder**: Kysely
- **Driver**: pg

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **CI/CD**: GitHub Actions

---

## Struktur Project

\\\
buzzerhood/
├── src/                      # Frontend source
│   ├── features/            # Feature modules
│   ├── pages/              # Page components
│   ├── lib/                # Libraries & utilities
│   └── components/         # Reusable components
├── backend/                 # Backend API
│   ├── src/                # Backend source
│   ├── secrets/            # JWT keys (gitignored)
│   └── .env               # Backend config (gitignored)
├── database/               # Database migrations
│   └── migrations/        # SQL migration files
├── docker/                 # Docker configurations
│   └── buzzerhood/        # Docker Compose stack
├── docs/                   # Documentation (THIS)
│   ├── setup/            
│   ├── architecture/     
│   ├── deployment/       
│   ├── guides/          
│   └── reports/         
└── .github/               # GitHub Actions workflows
    └── workflows/
\\\

---

## Kontribusi

### Branch Strategy

- \main\ - Production branch (protected)
- \develop\ - Development branch
- \eature/*\ - Feature branches
- \hotfix/*\ - Hotfix branches

### Commit Message Format

\\\
feat: tambah fitur partner registration form
fix: perbaiki CORS error di API
docs: update dokumentasi deployment
style: format kode sesuai ESLint
refactor: refactor authentication logic
test: tambah unit tests untuk campaign module
chore: update dependencies
\\\

---

## Bantuan & Support

### Dokumentasi Lengkap
Lihat folder-folder di atas untuk dokumentasi spesifik.

### Troubleshooting
- Setup environment: docs/setup/ENV_SETUP_GUIDE.md
- Deployment issues: docs/deployment/CI_CD_DEPLOYMENT_GUIDE.md
- Architecture questions: docs/architecture/

---

**Last Updated**: 2026-09-03  
**Maintainer**: Buzzerhood Development Team
