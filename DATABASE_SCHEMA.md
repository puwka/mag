# DATABASE_SCHEMA.md — Архитектура и схема БД Vitex

> **Стек:** Next.js · React · TypeScript · Supabase · PostgreSQL · Storage · Auth  
> **Дата:** 31.08.2026  
> **Основание:** [SITE_ANALYSIS.md](./SITE_ANALYSIS.md)  
> **Статус:** схема реализована миграциями `supabase/migrations/202608310001`–`012`. Приложение: каталог `web/`. Установка: [PROJECT_SETUP.md](./PROJECT_SETUP.md). CMS: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).

---

## 1. Архитектура проекта (без UI)

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js (App Router)                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ Browser      │  │ Server       │  │ Route Handlers /   │ │
│  │ (anon key)   │  │ Components   │  │ Server Actions     │ │
│  │ public read  │  │ (anon/user)  │  │ (service_role ONLY │ │
│  │ + Auth JWT   │  │              │  │  on server)        │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘ │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Auth     │  │ Postgres │  │ Storage  │  │ Edge Fn     │ │
│  │ (JWT)    │  │ + RLS    │  │ buckets  │  │ (optional)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Правила безопасности ключей

| Ключ | Где можно | Где нельзя |
|------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend + Backend | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend + Backend | — |
| `SUPABASE_SERVICE_ROLE_KEY` | **Только** Server Actions, Route Handlers, Edge Functions, CI | **Никогда** в `NEXT_PUBLIC_*`, клиентских компонентах, бандле браузера |

Клиентский Supabase-клиент всегда работает через **anon key + RLS**.  
Админские операции, обходящие RLS (bulk import, webhooks), — только через серверный клиент с `service_role`.

### Слои приложения (планируемые директории)

```
/
├── DATABASE_SCHEMA.md
├── SITE_ANALYSIS.md
├── supabase/
│   └── migrations/          # SQL-миграции (этот репозиторий)
├── src/                     # Next.js app (позже)
│   ├── app/
│   │   ├── (public)/        # публичные страницы
│   │   ├── (admin)/         # /admin — только role=admin|manager
│   │   └── api/             # route handlers
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts    # createBrowserClient (anon)
│   │   │   ├── server.ts    # createServerClient (anon + cookies)
│   │   │   └── admin.ts     # createClient(service_role) — server only
│   │   └── types/database.ts
│   └── ...
└── .env.local.example
```

---

## 2. Auth и роли

### 2.1. Supabase Auth

- Провайдер: **Email + Password** (для админов/менеджеров).
- При регистрации в `auth.users` триггер `handle_new_user` создаёт строку в `profiles`.
- Роль по умолчанию: `customer`.
- Повышение до `admin` / `manager` — только через SQL / service_role / уже существующего admin.

### 2.2. Роли (`user_role`)

| Роль | Назначение |
|------|------------|
| `customer` | Покупатель (опциональный ЛК); публичные INSERT заявок/заказов |
| `manager` | Чтение/обработка заказов и заявок; CRUD контента (без управления ролями) |
| `admin` | Полный CRUD всего; смена ролей; настройки сайта |

### 2.3. Helper-функции (SECURITY DEFINER)

```sql
public.is_admin()    -- role IN ('admin')
public.is_staff()    -- role IN ('admin', 'manager')
public.current_role()
```

Используются в RLS-политиках. Не раскрывают чужие профили.

---

## 3. ER-диаграмма (логические связи)

```
auth.users 1──1 profiles
profiles ──< orders

categories (self parent_id)
categories M──M products  (product_categories)
products 1──< product_images
products 1──< product_price_tiers
products 1──< product_documents
products M──M attribute_values (product_attribute_values)
attributes 1──< attribute_values
products M──M products (product_relations)

pages
menu_items (self parent_id)
homepage_sections
homepage_benefits
homepage_steps
homepage_promo_banners

reviews
media
site_settings
cities
form_submissions
orders 1──< order_items
orders 1──< order_status_history
redirects
```

---

## 4. Таблицы

Общие поля почти у всех таблиц:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()` (триггер `set_updated_at`)

---

### 4.1. `profiles`

Расширение `auth.users`.

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | = `auth.users.id` |
| email | text | | Денормализация email |
| full_name | text | ✓ | |
| phone | text | ✓ | |
| company_name | text | ✓ | |
| role | user_role | | default `customer` |
| avatar_url | text | ✓ | |
| is_active | boolean | | default true |
| created_at | timestamptz | | |
| updated_at | timestamptz | | |

**FK:** `id → auth.users(id) ON DELETE CASCADE`  
**Индексы:** `role`, `email`

**Связи:** 1:1 с Auth; 1:N orders.

---

### 4.2. `site_settings`

Key-value настройки сайта (контакты, юр. данные, аналитика, WhatsApp и т.д.).

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | |
| key | text | UNIQUE | например `company.inn`, `contacts.phones` |
| value | jsonb | | Произвольная структура |
| label | text | ✓ | Человекочитаемое имя в админке |
| group_name | text | ✓ | `contacts`, `legal`, `analytics`, `seo` |
| is_public | boolean | | default true — можно ли читать анону |
| created_at / updated_at | timestamptz | | |

**Индексы:** `key` UNIQUE; `(group_name)`; partial `WHERE is_public`.

---

### 4.3. `pages`

Информационные страницы CMS.

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | |
| slug | text | UNIQUE | `contact`, `dostavka`, `oplata`… |
| title | text | | |
| content_html | text | ✓ | |
| content_json | jsonb | ✓ | Структурированные блоки (опционально) |
| template | text | | default `default` |
| status | content_status | | `draft` / `published` / `archived` |
| seo_title | text | ✓ | |
| seo_description | text | ✓ | |
| og_image_path | text | ✓ | путь в Storage `pages/` |
| published_at | timestamptz | ✓ | |
| sort_order | int | | default 0 |
| created_at / updated_at | | | |

**Индексы:** `slug` UNIQUE; `(status, published_at)`.

---

### 4.4. `categories`

Дерево категорий каталога.

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | |
| parent_id | uuid | ✓ | FK → categories.id |
| slug | text | | уникален в рамках parent |
| path | text | UNIQUE | полный путь: `rabochie-perchatki/perchatki-hb` |
| name | text | | |
| description | text | ✓ | |
| image_path | text | ✓ | Storage `categories/` |
| seo_title | text | ✓ | |
| seo_description | text | ✓ | |
| status | content_status | | |
| sort_order | int | | |
| created_at / updated_at | | | |

**FK:** `parent_id → categories(id) ON DELETE SET NULL`  
**Индексы:** UNIQUE `(parent_id, slug)`; UNIQUE `path`; `(status, sort_order)`.

---

### 4.5. `products`

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | |
| slug | text | UNIQUE | |
| sku | text | ✓ UNIQUE | |
| name | text | | |
| short_description | text | ✓ | |
| description | text | ✓ | |
| status | content_status | | |
| stock_status | stock_status | | `in_stock` / `on_order` / `out_of_stock` |
| stock_label | text | ✓ | «В наличии», «На заказ» |
| pack_price | numeric(12,2) | ✓ | цена упаковки |
| pairs_per_pack | int | ✓ | пар в упаковке |
| price_per_pair | numeric(12,2) | ✓ | |
| currency | text | | default `RUB` |
| price_on_request | boolean | | default false → «По запросу» |
| weight_grams | numeric(10,2) | ✓ | вес пары |
| is_featured | boolean | | |
| menu_order | int | | |
| seo_title | text | ✓ | |
| seo_description | text | ✓ | |
| published_at | timestamptz | ✓ | |
| created_at / updated_at | | | |

**Индексы:** `slug` UNIQUE; `sku`; `(status, menu_order)`; `(stock_status)`; GIN full-text (опционально позже).

---

### 4.6. `product_images`

| Поле | Тип | Nullable | Описание |
|------|-----|----------|----------|
| id | uuid | PK | |
| product_id | uuid | FK | → products ON DELETE CASCADE |
| storage_path | text | | путь в bucket `products` |
| alt | text | ✓ | |
| sort_order | int | | |
| is_primary | boolean | | |
| created_at / updated_at | | | |

**Индексы:** `(product_id, sort_order)`; partial unique primary per product (опционально).

---

### 4.7. `product_categories` (M:N)

| Поле | Тип |
|------|-----|
| product_id | uuid PK, FK → products CASCADE |
| category_id | uuid PK, FK → categories CASCADE |
| sort_order | int |
| created_at | timestamptz |

**Индексы:** `(category_id, product_id)`.

---

### 4.8. `attributes` / `attribute_values` / `product_attribute_values`

Фильтры: класс вязки, цвет, нити, ПВХ и т.д.

**attributes**

| Поле | Тип |
|------|-----|
| id | uuid PK |
| slug | text UNIQUE |
| name | text |
| type | attribute_type (`select`/`color`/`text`/`number`) |
| is_filterable | boolean |
| sort_order | int |
| created_at / updated_at | |

**attribute_values**

| Поле | Тип |
|------|-----|
| id | uuid PK |
| attribute_id | uuid FK |
| slug | text |
| name | text |
| color_hex | text ✓ |
| sort_order | int |
| UNIQUE (attribute_id, slug) |

**product_attribute_values**

| Поле | Тип |
|------|-----|
| product_id | uuid PK FK |
| attribute_value_id | uuid PK FK |
| created_at | |

---

### 4.9. `product_price_tiers`

Оптовые ступени цен.

| Поле | Тип |
|------|-----|
| id | uuid PK |
| product_id | uuid FK CASCADE |
| min_pairs | int |
| max_pairs | int ✓ (NULL = без верхней границы) |
| price_per_pair | numeric(12,2) |
| sort_order | int |
| created_at / updated_at | |

---

### 4.10. `product_documents`

| Поле | Тип |
|------|-----|
| id | uuid PK |
| product_id | uuid FK |
| doc_type | text (`declaration`, `certificate`, …) |
| title | text |
| storage_path | text |
| sort_order | int |
| created_at / updated_at | |

---

### 4.11. `product_relations`

| Поле | Тип |
|------|-----|
| product_id | uuid PK FK |
| related_product_id | uuid PK FK |
| relation_type | text (`similar`, `upsell`, `crosssell`) |
| sort_order | int |
| created_at | |

CHECK: `product_id <> related_product_id`

---

### 4.12. `reviews`

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| source | review_source | `yandex` / `manual` |
| author_name | text | |
| body | text | |
| rating | smallint ✓ | 1–5 |
| review_date | date ✓ | |
| external_url | text ✓ | ссылка на Яндекс |
| avatar_path | text ✓ | Storage `reviews/` |
| is_published | boolean | |
| sort_order | int | |
| created_at / updated_at | | |

**Индексы:** `(is_published, sort_order)`.

---

### 4.13. `menu_items`

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| menu_key | text | `header_mega`, `header_quick`, `mobile`, `footer_info`, `footer_catalog`, `footer_gloves` |
| parent_id | uuid ✓ | FK self |
| title | text | |
| url | text ✓ | |
| link_type | menu_link_type | `custom`, `page`, `category`, `product` |
| page_id | uuid ✓ FK pages | |
| category_id | uuid ✓ FK categories | |
| product_id | uuid ✓ FK products | |
| icon_path | text ✓ | |
| open_in_new_tab | boolean | |
| mega_config | jsonb ✓ | колонки mega-menu |
| sort_order | int | |
| is_visible | boolean | |
| created_at / updated_at | | |

**Индексы:** `(menu_key, sort_order)`; `(parent_id)`.

---

### 4.14. `homepage_sections`

Управление порядком и видимостью блоков главной.

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| section_key | text UNIQUE | `hero`, `info_boxes`, `promo_row_1`, `promo_row_2`, `products_hb`, `products_pvc`, `advantages`, `seo`, `steps`, `reviews` |
| title | text ✓ | |
| subtitle | text ✓ | |
| config | jsonb | фон, CTA, taxonomy filters и т.д. |
| is_visible | boolean | |
| sort_order | int | |
| created_at / updated_at | | |

---

### 4.15. `homepage_benefits`

Блок преимуществ (info boxes / card advantages).

| Поле | Тип |
|------|-----|
| id | uuid PK |
| block_group | text | `info_boxes` / `advantages` |
| title | text |
| description | text ✓ |
| icon_path | text ✓ | Storage `site/` |
| link_url | text ✓ |
| sort_order | int |
| is_visible | boolean |
| created_at / updated_at | |

---

### 4.16. `homepage_steps`

«Как сделать заказ?» — 4 шага.

| Поле | Тип |
|------|-----|
| id | uuid PK |
| step_number | int |
| title | text |
| description | text |
| link_url | text ✓ |
| link_label | text ✓ |
| sort_order | int |
| is_visible | boolean |
| created_at / updated_at | |

UNIQUE `(step_number)`

---

### 4.17. `homepage_promo_banners`

Промо-баннеры категорий на главной.

| Поле | Тип |
|------|-----|
| id | uuid PK |
| row_index | int | 1 или 2 |
| title | text |
| button_label | text |
| link_url | text |
| image_path | text | Storage `site/` |
| sort_order | int |
| is_visible | boolean |
| created_at / updated_at | |

---

### 4.18. `orders`

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| order_number | text UNIQUE | человекочитаемый номер |
| user_id | uuid ✓ | FK profiles (guest = NULL) |
| status | order_status | `new` → `processing` → `completed` / `cancelled` |
| customer_name | text | |
| customer_email | text ✓ | |
| customer_phone | text | |
| company_name | text ✓ | |
| billing_address | jsonb ✓ | |
| shipping_address | jsonb ✓ | |
| shipping_method | text ✓ | |
| payment_method | text ✓ | |
| customer_note | text ✓ | |
| subtotal | numeric(12,2) | |
| total | numeric(12,2) | |
| currency | text | default `RUB` |
| weight_total | numeric(12,2) ✓ | |
| city_slug | text ✓ | регион |
| source_utm | jsonb ✓ | |
| ip_hash | text ✓ | хеш IP (не сырой IP) |
| created_at / updated_at | | |

**Индексы:** `order_number` UNIQUE; `(status, created_at DESC)`; `(user_id)`; `(customer_phone)`.

---

### 4.19. `order_items`

| Поле | Тип |
|------|-----|
| id | uuid PK |
| order_id | uuid FK CASCADE |
| product_id | uuid ✓ FK SET NULL |
| product_name | text | snapshot |
| product_sku | text ✓ | snapshot |
| quantity_packs | int |
| pairs_per_pack | int ✓ |
| unit_price | numeric(12,2) | цена упаковки на момент заказа |
| line_total | numeric(12,2) |
| created_at | |
| updated_at | |

**Индексы:** `(order_id)`.

---

### 4.20. `order_status_history`

| Поле | Тип |
|------|-----|
| id | uuid PK |
| order_id | uuid FK CASCADE |
| status | order_status |
| comment | text ✓ |
| changed_by | uuid ✓ FK profiles |
| created_at | |

---

### 4.21. `media`

Центральный реестр файлов (метаданные Storage).

| Поле | Тип |
|------|-----|
| id | uuid PK |
| bucket | text |
| path | text |
| mime_type | text ✓ |
| size_bytes | bigint ✓ |
| width | int ✓ |
| height | int ✓ |
| alt | text ✓ |
| title | text ✓ |
| uploaded_by | uuid ✓ FK profiles |
| created_at / updated_at | |
| UNIQUE (bucket, path) |

---

### 4.22. `form_submissions`

Безопасные заявки с сайта (контакт, прайс, логотип и т.д.).

| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| form_type | form_type | enum: contact, price_list, product_request, product_selection, partnership, logo_application |
| payload | jsonb | поля формы |
| product_id | uuid ✓ | |
| product_url | text ✓ | |
| attachment_paths | text[] | пути в Storage `form-uploads` |
| status | submission_status | `new` / `in_progress` / `done` / `spam` |
| ip_hash | text ✓ | |
| user_agent | text ✓ | |
| created_at / updated_at | | |

**Индексы:** `(form_type, status, created_at DESC)`.

Публичный доступ: **только INSERT**. Чтение/update — staff.

---

### 4.23. `cities`

Региональные поддомены.

| Поле | Тип |
|------|-----|
| id | uuid PK |
| name | text |
| slug | text UNIQUE |
| subdomain_url | text ✓ |
| is_default | boolean |
| phone | text ✓ |
| address | text ✓ |
| sort_order | int |
| is_active | boolean |
| created_at / updated_at | |

---

### 4.24. `redirects`

| Поле | Тип |
|------|-----|
| id | uuid PK |
| from_path | text UNIQUE |
| to_path | text |
| status_code | int | default 301 |
| is_active | boolean |
| created_at / updated_at | |

---

## 5. Enums

| Enum | Значения |
|------|----------|
| `user_role` | `customer`, `manager`, `admin` |
| `content_status` | `draft`, `published`, `archived` |
| `stock_status` | `in_stock`, `on_order`, `out_of_stock` |
| `attribute_type` | `select`, `color`, `text`, `number` |
| `menu_link_type` | `custom`, `page`, `category`, `product` |
| `order_status` | `new`, `processing`, `awaiting_payment`, `paid`, `shipped`, `completed`, `cancelled` |
| `review_source` | `yandex`, `manual` |
| `form_type` | `contact`, `price_list`, `product_request`, `product_selection`, `partnership`, `logo_application` |
| `submission_status` | `new`, `in_progress`, `done`, `spam` |

---

## 6. RLS — политика доступа

### Принцип

| Действие | Anon / Customer | Manager | Admin |
|----------|-----------------|---------|-------|
| Чтение published контента | ✓ | ✓ | ✓ |
| Чтение draft | ✗ | ✓ | ✓ |
| CRUD контента | ✗ | ✓ | ✓ |
| Смена ролей / site_settings чувствительные | ✗ | ✗ | ✓ |
| INSERT form_submissions | ✓ | ✓ | ✓ |
| SELECT form_submissions | ✗ | ✓ | ✓ |
| INSERT orders (checkout) | ✓ | ✓ | ✓ |
| SELECT чужих orders | ✗ | ✓ (все) | ✓ |
| SELECT своих orders | ✓ (auth.uid) | ✓ | ✓ |

### Public read (anon)

Таблицы с `status = 'published'` или `is_published = true` / `is_visible = true` / `is_public = true`:

- pages, categories, products (+ images, attributes, tiers, documents, relations, product_categories)
- reviews (published)
- menu_items (visible)
- homepage_*
- cities (active)
- site_settings (`is_public = true`)
- media (только через связанные public объекты — или public read метаданных для staff; публичные URL файлов идут из Storage policies)
- redirects (active)

### Admin / Staff CRUD

`is_staff()` → ALL на контентных таблицах.  
`is_admin()` → дополнительно profiles.role update, все site_settings.

### Безопасные заявки и заказы

```
form_submissions:
  INSERT — anon + authenticated (WITH CHECK: status = 'new', payload object)
  SELECT/UPDATE — staff only
  DELETE — admin only

orders / order_items:
  INSERT — anon + authenticated (user_id IS NULL OR user_id = auth.uid())
  SELECT — own (user_id = auth.uid()) OR staff  [anon НЕ читает]
  UPDATE — staff only
  DELETE orders — admin only
```

**Важно про guest checkout:** у `anon` нет SELECT на `orders`, поэтому `INSERT … RETURNING` из браузера не сработает. Оформление заказа и подтверждение — через **Server Action / Route Handler**:

1. Валидация + reCAPTCHA на сервере;
2. INSERT с `anon` (через cookie-сессию) **или** с `service_role` только на сервере;
3. Клиенту возвращается DTO (номер заказа), без передачи `service_role` во frontend.

Защита от спама: reCAPTCHA v3, rate limit, проверка payload на сервере. Смена `profiles.role` обычным пользователем блокируется триггером `protect_profile_privileges`.

---

## 7. Supabase Storage

### Buckets

| Bucket | Public | Назначение | Max size (реком.) |
|--------|--------|------------|-------------------|
| `products` | yes | фото товаров | 10 MB |
| `categories` | yes | изображения категорий | 5 MB |
| `pages` | yes | OG / контент страниц | 5 MB |
| `reviews` | yes | аватарки отзывов | 2 MB |
| `site` | yes | логотип, иконки, hero, promo | 10 MB |
| `media` | yes | общий медиабанк | 20 MB |
| `form-uploads` | **no** | файлы заявок (логотипы PSD/JPG) | 20 MB |

### Storage RLS (кратко)

| Bucket | SELECT | INSERT/UPDATE/DELETE |
|--------|--------|----------------------|
| public buckets | anon + auth | staff only |
| `form-uploads` | staff only | anon INSERT (ограниченный path prefix) + staff |

Пути файлов хранятся в БД как `storage_path` / `image_path` без полного URL.  
Публичный URL: `{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}`.

---

## 8. Миграции

Расположение: `supabase/migrations/`

| Файл | Содержание |
|------|------------|
| `202608310001_extensions_enums.sql` | extensions, enums |
| `202608310002_helpers_triggers.sql` | set_updated_at (без зависимости от profiles) |
| `202608310003_core_tables.sql` | profiles + is_admin/is_staff/handle_new_user, site_settings, media, cities, pages, redirects |
| `202608310004_catalog_tables.sql` | categories, products, images, attrs, prices, docs, relations |
| `202608310005_cms_homepage_tables.sql` | menus, homepage_*, reviews |
| `202608310006_orders_forms.sql` | orders, items, history, form_submissions |
| `202608310007_rls_policies.sql` | RLS enable + policies |
| `202608310008_storage.sql` | buckets + storage policies |
| `202608310009_seed_minimal.sql` | города, settings, секции главной, шаги |
| `202608310010_security_hardening.sql` | защита role escalation, комментарии |

Применение:

```bash
supabase db push
# или
supabase migration up
```

---

## 9. Env (пример)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # публичный
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # ТОЛЬКО server / .env.local, не коммитить
```

`.gitignore` обязан включать `.env*.local`.  
`SUPABASE_SERVICE_ROLE_KEY` не добавлять в `NEXT_PUBLIC_*`.

---

## 10. Соответствие SITE_ANALYSIS

| Требование анализа | Таблица(ы) |
|--------------------|-----------|
| Товары, цены упак/пара, MOQ | products, product_price_tiers |
| Категории дерево | categories |
| Фильтры атрибутов | attributes, attribute_values, product_attribute_values |
| Галерея | product_images |
| Документы / декларации | product_documents |
| Похожие | product_relations |
| Главная: hero, баннеры, шаги, преимущества | homepage_sections, promo_banners, benefits, steps |
| Меню mega/mobile/footer | menu_items |
| Отзывы Яндекс | reviews |
| Формы CF7 | form_submissions |
| Корзина → заявка/заказ | orders, order_items |
| Города-поддомены | cities |
| Настройки/контакты/ИНН | site_settings |
| Политика / инфостраницы | pages |
| Медиа | media + Storage |

---

*Публичный интерфейс на этом этапе не создаётся — только схема и миграции.*
