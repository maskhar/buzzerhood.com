# Environment Buzzerhood

## Frontend

File: `.env.production`

```env
VITE_API_BASE_URL=https://api-buzzerhood.carubra.com/api/v1
```

Frontend tidak boleh menyimpan password database, JWT private key, atau service role.

## Backend

File: `docker/buzzerhood/.env.api`

Sumber template: `docker/buzzerhood/.env.api.example`.

Nilai penting:

- `DATABASE_URL` memakai host service `postgres`, database `buzzerhood`.
- `JWT_ISSUER` memakai `https://api-buzzerhood.carubra.com`.
- `CORS_ORIGINS` memakai `https://dev-buzzerhood.carubra.com`.
- `COOKIE_SECURE=true` hanya setelah HTTPS aktif.

## Database

Password PostgreSQL disimpan di `docker/buzzerhood/secrets/postgres_password.txt` dan dibaca lewat Docker secret. Jangan commit file tersebut.

## Generate otomatis

```powershell
pwsh -File docker/buzzerhood/scripts/buzzerhood.ps1 -Action env -ApiUrl https://api-buzzerhood.carubra.com -WebUrl https://dev-buzzerhood.carubra.com
```

Perintah itu membuat env dan JWT key jika belum ada. `jwt` membuat ulang key dan menginvalidasi token lama; gunakan saat rotasi terencana.
