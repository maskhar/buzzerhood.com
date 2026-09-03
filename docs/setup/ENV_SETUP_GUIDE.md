# Setup Environment Variables (.env) Guide

## Overview

Buzzerhood project menggunakan beberapa file .env untuk konfigurasi berbeda di setiap environment. Dokumen ini menjelaskan struktur, lokasi, dan cara penggunaan masing-masing file.

---

## Struktur File Environment

```
dev-buzzerhood.carubra.com/
├── .env                          # Frontend: Production (Supabase)
├── .env.local                    # Frontend: Local Development
├── .env.example                  # Frontend: Template
├── .env.production               # Frontend: Production template
├── backend/
│   ├── .env                      # Backend: Local Development
│   ├── .env.example              # Backend: Template
│   └── secrets/
│       ├── jwt-private.pem       # JWT signing key
│       └── jwt-public.pem        # JWT verification key
└── docker/
    └── buzzerhood/
        ├── .env.api              # Backend: Docker Container
        └── secrets/
            ├── postgres_password.txt
            ├── jwt-private.pem
            └── jwt-public.pem
```

---

## 1. Frontend Environment Variables

### Lokasi dan Prioritas

Vite memuat file .env dengan prioritas (tertinggi ke terendah):

1. .env.local → Local development (highest priority)
2. .env → Default
3. .env.production → Production build
4. .env.example → Template only

### File: .env.local (Local Development)

**Lokasi**: Root project

**Purpose**: Development lokal dengan Backend API lokal

**Isi**:
```env
# Backend API endpoint
VITE_API_URL=http://localhost:3100

# Supabase (transitional)
VITE_SUPABASE_URL=https://supabase.carubra.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Kapan digunakan**: Saat menjalankan 
pm run dev

---

## 2. Backend Environment Variables

### File: ackend/.env (Local Development)

**Lokasi**: ackend/ folder

**Isi**:
```env
NODE_ENV=development
HOST=127.0.0.1
PORT=3100

DATABASE_URL=postgresql://buzzerhood_app:password@localhost:5432/buzzerhood

JWT_PRIVATE_KEY_PATH=./secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt-public.pem

CORS_ORIGINS=http://localhost:5173,http://localhost:8080

SWAGGER_ENABLED=true
LOG_LEVEL=debug
```

---

## 3. Docker Environment

### File: docker/buzzerhood/.env.api

**Lokasi**: docker/buzzerhood/ folder

**Isi**: Similar to backend/.env but with Docker-specific settings

---

## Development Workflows

### Workflow 1: Full Docker Stack

```bash
cd docker/buzzerhood
docker-compose up -d
```

### Workflow 2: Local Development

```bash
# Terminal 1: PostgreSQL
docker-compose up -d postgres

# Terminal 2: Backend
cd backend
npm run start:dev

# Terminal 3: Frontend
npm run dev
```

---

**Created**: 2026-09-03
