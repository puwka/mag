# Деплой: GitHub + Vercel

Next.js приложение — в **корне** репозитория (`package.json`, `src/`). Рядом: `supabase/migrations/`, документация.

---

## 1. Залить на GitHub через консоль

```powershell
cd d:\mag
git add .
git status
# убедитесь, что НЕТ .env / .env.local

git commit -m "Описание изменений"
git push
```

Первый раз (если репозитория ещё нет):

```powershell
gh auth login
cd d:\mag
git init
git branch -M main
git add .
git commit -m "Initial commit: Vitex shop (Next.js + Supabase)"
gh repo create mag --private --source=. --remote=origin --push
```

---

## 2. Подключить Vercel

1. [vercel.com](https://vercel.com) → Import репозитория `puwka/mag`.
2. **Root Directory** — оставьте **пустым** (приложение в корне). Framework: **Next.js**.
3. **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXX.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |
| `NEXT_PUBLIC_SITE_URL` | `https://mag-blush-ten.vercel.app` |

4. Deploy. В логе должны быть `npm install` и `next build` (не 100 ms пустой билд).

### Если был старый деплой с 404

1. Settings → General → **Root Directory** → очистить (не `web`) → Save.
2. Redeploy.

### CLI

```powershell
cd d:\mag
npx vercel login
npx vercel --prod
```

---

## 3. После деплоя

1. Supabase → Authentication → URL Configuration: Site URL + Redirect `https://ваш-домен/**`
2. Обновите `NEXT_PUBLIC_SITE_URL` и Redeploy.
3. Проверьте `/`, `/admin/login/`, checkout, `robots.txt`, `sitemap.xml`.

---

## 4. Чеклист

- [ ] В логе билда есть `next build`, не «Build Completed in 100ms»
- [ ] Env заданы на Vercel
- [ ] `.env` не в GitHub
- [ ] Пароль админа сменён
- [ ] Миграции 001–012 в Supabase
