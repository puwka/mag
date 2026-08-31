# PROJECT_SETUP.md — установка и запуск Vitex

Production-ready копия **vitex37.ru** на Next.js 15 + Supabase (Postgres, Auth, Storage, RLS).

---

## 1. Требования

- Node.js 20+
- npm 10+
- Аккаунт [Supabase](https://supabase.com) (проект Postgres 15+)
- (Опционально) Supabase CLI для применения миграций

---

## 2. Клонирование и зависимости

```bash
npm install
```

Приложение в корне репозитория (`package.json`, `src/`). Рядом — `supabase/`.

---

## 3. Переменные окружения

Скопируйте пример:

```bash
cp .env.example .env.local
```

Заполните:

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon-ключ (браузер + SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Только сервер** (API orders/forms, seed, create-admin) |
| `NEXT_PUBLIC_SITE_URL` | Канонический URL сайта (SEO, OG, sitemap), напр. `https://vitex37.ru` |
| `ADMIN_EMAIL` | Email админа для `npm run create-admin` (по умолчанию `admin@vitex37.local`) |
| `ADMIN_PASSWORD` | Пароль админа (смените в production!) |

`SUPABASE_SERVICE_ROLE_KEY` никогда не должен попадать в `NEXT_PUBLIC_*` или клиентский бандл.

---

## 4. Supabase: миграции

SQL-миграции лежат в `supabase/migrations/` (порядок по имени файла):

1. `202608310001` — extensions + enums  
2. `202608310002` — helpers  
3. `202608310003` — core (profiles, settings, pages, media…)  
4. `202608310004` — catalog  
5. `202608310005` — CMS homepage + menus + reviews  
6. `202608310006` — orders / forms  
7. `202608310007` — RLS  
8. `202608310008` — Storage buckets + policies  
9. `202608310009` — minimal seed SQL  
10. `202608310010` — security hardening  
11. `202608310011` — admin bootstrap / settings staff write  
12. `202608310012` — homepage CMS fields  

### Через SQL Editor

В Dashboard → SQL → выполните файлы **по порядку**.

### Через CLI (если проект связан)

```bash
npx supabase db push
```

---

## 5. Auth

- Провайдер: **Email + Password**
- При регистрации триггер создаёт `profiles` с ролью `customer`
- Staff: `admin` | `manager` (`is_active = true`)
- Middleware защищает `/admin/*` (кроме `/admin/login/`)
- Layout панели повторно вызывает `requireStaff()`

Создание администратора:

```bash
npm run create-admin
```

Скрипт создаёт/сбрасывает пользователя, ставит `profiles.role = 'admin'` и проверяет вход.

**Перед публикацией смените пароль** и не оставляйте дефолт из README.

---

## 6. Storage

Публичные бакеты: `products`, `categories`, `pages`, `reviews`, `site`, `media`.  
Приватный: `form-uploads` (заявки с файлами).

Запись в публичные бакеты — только `is_staff()` (RLS Storage).  
Метаданные файлов — таблица `media`.

---

## 7. RLS (кратко)

| Область | Правило |
|---------|---------|
| Каталог / CMS / меню | Публичное чтение опубликованного; запись — `is_staff()` |
| `site_settings` | Публичное чтение `is_public`; запись — staff |
| Заказы | Анонимный INSERT; чтение/update — staff; delete — admin |
| Формы | Анонимный INSERT; обработка — staff |
| Profiles | Смена `role`/`is_active` — только admin (или service_role после 011) |

Подробности: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

---

## 8. Наполнение контентом

```bash
npm run seed          # категории, товары, меню, главная, страницы, settings
npm run create-admin  # учётка CMS
```

---

## 9. Локальный запуск

```bash
npm run dev
```

- Витрина: http://localhost:3000  
- Админка: http://localhost:3000/admin/login/  
- Sitemap: http://localhost:3000/sitemap.xml  
- Robots: http://localhost:3000/robots.txt  

---

## 10. Production build и Vercel

```bash
npm run build
npm run start
```

**Vercel:** Root Directory пустой (приложение в корне), Node 20+, env из §3.  
Пошагово: [DEPLOY.md](./DEPLOY.md).

Чеклист перед деплоем:

1. Миграции 001–012 применены  
2. Env на хостинге заданы (включая `NEXT_PUBLIC_SITE_URL`)  
3. `npm run seed` (или контент уже в БД)  
4. Админ создан, пароль сменён  
5. Storage buckets созданы политиками 008  
6. Проверен сценарий: товар → корзина → заявка → строка в `orders`  
7. Проверен вход в `/admin`  
8. В Supabase Auth добавлены Redirect URLs продакшен-домена

---

## 11. Структура приложения

```
src/app/
  (storefront)/     # витрина + SiteShell
  admin/            # CMS (login + panel)
  api/orders|forms  # гостевые заявки (service_role на сервере)
  robots.ts
  sitemap.ts
supabase/migrations/
```

Документация админки: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
