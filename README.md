# Vitex — Next.js + Supabase

Публичная витрина + CMS `/admin`. Контент из БД.

Документация корня репозитория:

- [PROJECT_SETUP.md](../PROJECT_SETUP.md) — установка, env, миграции, деплой
- [ADMIN_GUIDE.md](../ADMIN_GUIDE.md) — работа в админке
- [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — схема и RLS
- [SITE_ANALYSIS.md](../SITE_ANALYSIS.md) — аудит оригинала

## Быстрый старт

```bash
cp ../.env.local.example .env.local   # заполните ключи
npm install
# примените SQL миграции 001–012 в Supabase
npm run seed
npm run create-admin
npm run dev
```

- Сайт: http://localhost:3000  
- Админка: http://localhost:3000/admin/login/  
- SEO: `/sitemap.xml`, `/robots.txt`

## Важно

- `SUPABASE_SERVICE_ROLE_KEY` только на сервере
- Смените пароль админа перед production
- `NEXT_PUBLIC_SITE_URL` обязателен для корректного SEO/OG
