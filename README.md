# Saarthi AI

## MySQL via Docker Compose

Start only MySQL from the project root:

```bash
docker compose up -d mysql
```

Check container health/status:

```bash
docker compose ps
```

Stop MySQL:

```bash
docker compose down
```

The backend expects this default local database URL (already set in `backend/.env.example`):

```env
DATABASE_URL="mysql://saarthi_user:saarthi_pass@localhost:3306/saarthi_db"
```

Then from `backend/` run migrations and seed:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```
