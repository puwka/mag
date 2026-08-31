# Деплой: GitHub + Vercel

Приложение Next.js лежит в каталоге **`web/`**. Миграции и документация — в корне репозитория.

---

## 1. Залить на GitHub через консоль

### Один раз: Git + GitHub CLI

1. Установите [Git](https://git-scm.com/download/win) и [GitHub CLI](https://cli.github.com/).
2. В PowerShell:

```powershell
gh auth login
```

Выберите GitHub.com → HTTPS → авторизуйтесь в браузере.

### Создать репозиторий и запушить (рекомендуется корень `d:\mag`)

Если внутри `web` уже есть старый `.git` от Create Next App — уберите его, чтобы в GitHub попали и `supabase/`, и docs:

```powershell
cd d:\mag

# убрать вложенный git только в web (если есть)
if (Test-Path web\.git) { Remove-Item -Recurse -Force web\.git }

git init
git branch -M main
git add .
git status
# убедитесь, что НЕТ файлов .env / .env.local

git commit -m "Initial commit: Vitex shop (Next.js + Supabase)"

# создать приватный репозиторий на GitHub и запушить
gh repo create vitex37 --private --source=. --remote=origin --push
```

Имя `vitex37` можно заменить. Для публичного репозитория: `--public` вместо `--private`.

### Без `gh` (только git + сайт)

```powershell
cd d:\mag
# ... git init / add / commit как выше ...

# создайте пустой репозиторий на https://github.com/new
git remote add origin https://github.com/ВАШ_ЛОГИН/vitex37.git
git push -u origin main
```

### Дальнейшие обновления

```powershell
cd d:\mag
git add .
git commit -m "Описание изменений"
git push
```

---

## 2. Подключить Vercel

1. Откройте [vercel.com](https://vercel.com) → **Add New Project** → Import репозитория с GitHub.
2. **Root Directory**: нажмите *Edit* → укажите **`web`**.
3. Framework Preset: **Next.js** (подхватится сам).
4. Build Command: `npm run build`  
   Install Command: `npm install`  
   Output: по умолчанию для Next.js.
5. **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXX.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key из Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (только сервер!) |
| `NEXT_PUBLIC_SITE_URL` | сначала `https://ваш-проект.vercel.app`, потом боевой домен |

6. Deploy.

### Через CLI (опционально)

```powershell
cd d:\mag\web
npm i -g vercel
vercel login
vercel link
# Root Directory при линковке — web уже текущая папка
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod
```

---

## 3. После первого деплоя

1. В **Supabase → Authentication → URL Configuration** добавьте:
   - Site URL: ваш Vercel/кастомный домен
   - Redirect URLs: `https://ваш-домен/**` и `http://localhost:3000/**`
2. Обновите `NEXT_PUBLIC_SITE_URL` на финальный URL и **Redeploy**.
3. Проверьте: `/`, `/admin/login/`, создание заявки с `/checkout/`, `robots.txt`, `sitemap.xml`.
4. Кастомный домен: Vercel → Project → Settings → Domains.

---

## 4. Чеклист безопасности

- [ ] `.env` / `.env.local` не в GitHub (`git status` чистый от секретов)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` только в Vercel Environment Variables
- [ ] Пароль админа сменён
- [ ] Миграции 001–012 применены в Supabase
