# SITE_ANALYSIS.md — Полный аудит vitex37.ru

> **Дата аудита:** 31.08.2026  
> **URL:** https://vitex37.ru/  
> **Компания:** ООО «ФАБРИКА ВИТЕКС», ИНН 3700000996  
> **Платформа (текущая):** WordPress 7.0.4 + WooCommerce 11.0.0 + тема Woodmart 7.4.3 (child) + WPBakery Page Builder + Contact Form 7  
> **Назначение сайта:** B2B-интернет-магазин производителя рабочих перчаток, рукавиц и технических тканей (опт, Иваново)

---

## Содержание

1. [Карта страниц и URL](#1-карта-страниц-и-url)
2. [Главное меню и подменю](#2-главное-меню-и-подменю)
3. [Блоки главной страницы](#3-блоки-главной-страницы)
4. [Каталог, категории, карточки товаров](#4-каталог-категории-карточки-товаров)
5. [Поиск и фильтрация](#5-поиск-и-фильтрация)
6. [Корзина и оформление заявки](#6-корзина-и-оформление-заявки)
7. [Все формы](#7-все-формы)
8. [Отзывы](#8-отзывы)
9. [Информационные страницы](#9-информационные-страницы)
10. [Футер](#10-футер)
11. [Всплывающие окна](#11-всплывающие-окна)
12. [Мобильная версия](#12-мобильная-версия)
13. [Визуальный стиль](#13-визуальный-стиль)
14. [Сущности для БД](#14-сущности-для-бд)
15. [Компонентная карта для разработки](#15-компонентная-карта-для-разработки)

---

## 1. Карта страниц и URL

### 1.1. Статистика (sitemap Yoast SEO)

| Тип | Кол-во URL |
|-----|------------|
| Товары + `/shop/` | 89 |
| Страницы (page-sitemap) | 11 |
| Категории товаров | 20 |
| **Итого публичных URL (без поддоменов)** | **~118** |

### 1.2. Основные страницы

| URL | Назначение | Примечание |
|-----|------------|------------|
| `/` | Главная | Landing + витрины товаров |
| `/shop/` | Каталог | Редирект/дубль → `/rabochie-perchatki/` |
| `/rabochie-perchatki/` | Категория «Рабочие перчатки» | Основная витрина, 46 товаров |
| `/rabochie-perchatki/page/2/` | Пагинация каталога | + AJAX «Загрузить ещё» |
| `/cart/` | Корзина | page-id=9 |
| `/checkout/` | Оформление заказа | page-id=10; иконка корзины в шапке ведёт сюда |
| `/my-account/` | Личный кабинет | Стандартный WC, в robots Disallow |
| `/contact/` | Контакты | Форма + карта |
| `/o-kompanii-viteks/` | О компании | Видео, промо, форма |
| `/prajs-list/` | Прайс-лист | Форма запроса |
| `/dostavka/` | Доставка | Информационная |
| `/oplata/` | Оплата / реквизиты | Информационная |
| `/nanesenie-logotipa/` | Нанесение логотипа | Услуга + форма с файлом |
| `/optovym-pokupatelyam/` | Сотрудничество | Форма заявки |
| `/optovym-pokupatelyam/otdel-zakupki/` | Отдел закупки | Информационная |
| `/privacy-policy/` | Политика ПДн | Юридическая |
| `/spasibo-za-obrashhenie/` | Спасибо за обращение | После CF7 (robots Disallow) |

### 1.3. Дерево категорий товаров

```
/rabochie-perchatki/                          — Рабочие перчатки (46)
├── /perchatki-hb/                            — Перчатки ХБ (трикотажные)
│   └── /perchatki-s-pvh/                     — Перчатки с ПВХ
└── /perchatki-polusherstyanye-i-sherstyanye/ — Полушерстяные и шерстяные

/rukavicy/                                    — Рукавицы, фартуки, нарукавники
├── /brezentovye/
├── /hb/
├── /kombinirovannye/
├── /uteplennye/
├── /sukonnye-rukavicy/
├── /rukavicy-s-naladonnikom/
│   ├── /rukavicy-s-pvh-naladonnikom/
│   └── /rukavicy-s-brezentovym-naladonnikom/
└── /fartuki/

/tehnicheskie-tkani/                          — Технические ткани
├── /vafelnoe-polotno/
│   ├── /vafelnoe-polotno-otbelennoe/
│   └── /vafelnoe-polotno-gladkokrashenoe/
├── /holstoproshivnoe-polotno/
└── /tryapki-dlya-pola/
```

### 1.4. Региональные поддомены (мультисайт)

| Город | URL |
|-------|-----|
| Иваново (основной) | https://vitex37.ru |
| Санкт-Петербург | https://spb.vitex37.ru |
| Москва | https://moscow.vitex37.ru |
| Екатеринбург | https://ekb.vitex37.ru |
| Нижний Новгород | https://nn.vitex37.ru |
| Краснодар | https://krasnodar.vitex37.ru |

### 1.5. Служебные / закрытые URL (не для публичного каталога)

- `/wishlist/`, `/izbrannye-tovary/`, `/sravnenie-perchatok/` — отключены (robots Disallow)
- `/portfolio/`, `/404-2/`, `/onlajn-katalog-perchatok/` — legacy, Disallow
- `/search/?s=` — поиск (Disallow в robots)
- Фильтры с query-параметрами `filter_*`, `?swoof=`, `?per_page=` — Disallow

---

## 2. Главное меню и подменю

### 2.1. Desktop — Header Bottom

**Структура:** Mega-menu «Меню» + 2 быстрые ссылки + корзина + поиск.

#### Mega-menu (кнопка «Меню», dropdown 1100×550px, dark scheme)

**Рабочие перчатки** → `/rabochie-perchatki/`

| Колонка | Пункты |
|---------|--------|
| По типу | Все ХБ → `/perchatki-hb/`; С ПВХ → `/perchatki-s-pvh/`; Без ПВХ → `?filter_vid-naneseniya-pvh=bez-pvh` |
| По плотности | класс 7,5 / 10; 4–8 нитей (filter); С двойным оверлоком → полушерстяные |
| По цвету | Белые, Графит, Чёрный, Берёзка (filter OR) |
| По материалу | Шерстяные → `/perchatki-polusherstyanye-i-sherstyanye/` |

**Рукавицы, фартуки, нарукавники** → `/rukavicy/`

- Брезентовые, ХБ, Суконные, Комбинированные, Утеплённые
- С наладонником (+ ПВХ / брезентовый подтипы)
- Фартуки, нарукавники → `/fartuki/`

**Технические ткани** → `/tehnicheskie-tkani/`

- Вафельное полотно, Тряпки из ХПП, Холстопрошивное полotno

**Страницы верхнего уровня:**

| Пункт | URL |
|-------|-----|
| Нанесение логотипа | `/nanesenie-logotipa/` |
| Прайс-лист | `/prajs-list/` |
| Контакты | `/contact/` |
| Доставка | `/dostavka/` |
| Оплата | `/oplata/` |
| О компании Витекс | `/o-kompanii-viteks/` |

**Быстрые ссылки (вне mega-menu):**

- ХБ перчатки → `/rabochie-perchatki/perchatki-hb/`
- Перчатки с ПВХ → `/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/`

### 2.2. Mobile menu (`menu-mobilnoe`, off-canvas слева)

- Рабочие перчатки (+ 3 подкатегории)
- Рукавицы (+ 5 подкатегорий)
- Ткани для дома (+ 3 подкатегории)
- Нанесение логотипа
- Прайс-лист
- **Информация** (аккордеон):
  - Контакты, Оплата, О нас, Доставка
  - Сотрудничество → `/optovym-pokupatelyam/`
  - Отдел закупки → `/optovym-pokupatelyam/otdel-zakupki/`

### 2.3. Header — контактная зона (не меню навигации)

| Элемент | Значение |
|---------|----------|
| Логотип | `/` — `logo-vitex-posledn2.png` (260px desktop / 170px sticky) |
| Выбор города | Popup «Иваново ▼» → 6 городов |
| Часы | ПН–ПТ, 09:00–17:00 (МСК) |
| Телефоны | +7 (903) 888-16-61, +7 (903) 888-09-39 |
| Email | vitex37@mail.ru |
| «Не дозвонились?» | Popup → WhatsApp |
| Корзина | Счётчик items + сумма → `/checkout/` |
| Поиск | Fullscreen overlay |

---

## 3. Блоки главной страницы

Порядок сверху вниз. Класс обёртки: `.main-page-wrapper` (margin-top: -80px — hero под sticky header).

---

### 3.1. Hero Banner (`banner_home`)

| Параметр | Значение |
|----------|----------|
| **Назначение** | Главный оффер, CTA на прайс |
| **Структура** | 2 колонки (6+6): текст слева, изображение справа |
| **Фон** | `portrait-131.jpg` (cover, center-top) |
| **H1** | «Перчатки оптом в Иваново» |
| **Подзаголовок** | «фабрика ВИТЕКС» |
| **Изображение** | `hh-perchatk2i-460x276.png`, alt: «Все виды перчаток и рукавиц» |
| **Кнопка** | «Запросить прайс-лист» → `/prajs-list/` |
| **Стили кнопки** | `btn-scheme-dark`, semi-round, extra-large; bg `#f88c00`, hover `#e2b500` |
| **Hover баннера** | — |
| **Адаптив** | ≤1199px: padding-bottom 140px; ≤767px: padding-bottom 8px |

---

### 3.2. Info Boxes (4 преимущества)

| # | Заголовок | Иконка 50×50 |
|---|-----------|--------------|
| 1 | Оперативная доставка по России | `Dostavka-50x50.png` |
| 2 | Купить перчатки в Иваново на складе производства | `Dostavka-telezhka-50x50.png` |
| 3 | ХБ перчатки сертифицированы | `Sertifitsirovannaya-produktsiya-50x50.png` |
| 4 | Компания 5 лет на рынке | `5_-let-na-rynke-50x50.png` |

| Параметр | Значение |
|----------|----------|
| **Структура** | 4 колонки `col-sm-3`, на mobile `col-xs-6` (2×2) |
| **Иконки** | Border `#0d5a7e` |
| **Поведение** | Статичные, без ссылок |
| **Адаптив** | 4→2 колонки на xs |

---

### 3.3. Promo Banners — ряд 1 (3 категории)

| Кнопка | URL | Изображение |
|--------|-----|-------------|
| Перчатки c ПВХ | `/rabochie-perchatki/perchatki-s-pvh-tochka/` | `Nanesenie-PVH2.png` |
| Перчатки ХБ | `/rabochie-perchatki/perchatki-hb/` | `perhatka.png` |
| Рукавицы рабочие | `/rukavicy/` | `rucav-pvh-cat.png` |

| Параметр | Значение |
|----------|----------|
| **Структура** | 3× `col-sm-4`, equal height |
| **Кнопки** | `btn-color-primary`, rectangle, default size |
| **Hover** | `banner-hover-zoom` — zoom изображения |
| **Адаптив** | `col-xs-6` — 2 в ряд на mobile |

---

### 3.4. Promo Banners — ряд 2 (3 категории)

| Кнопка | URL | Изображение |
|--------|-----|-------------|
| Вафельное полотно | `/tehnicheskie-tkani/vafelnoe-polotno/` | `polotno-vaf.jpg` |
| ХПП | `/tehnicheskie-tkani/holstoproshivnoe-polotno/` | `hpp-cat.png` |
| Перчатки п/ш и шерстяные | `/perchatki-polusherstyanye-i-sherstyanye/` | `p-sh-1024x1024.png` |

---

### 3.5. Product Loop «Перчатки ХБ»

| Параметр | Значение |
|----------|----------|
| **Назначение** | Витрина топ-товаров категории ХБ |
| **Заголовок секции** | «Перчатки ХБ» |
| **Сетка** | 4 col lg / 3 md / 2 sm; gap 30px lg / 10px sm |
| **Кол-во** | 12 товаров (taxonomy 121, exclude list) |
| **Карточка** | Изображение, название, цена упак.+пара, статус, кнопка «Купить» |
| **Кнопка** | «Купить» → страница товара (не AJAX add-to-cart) |
| **Статусы** | «В наличии» / «На заказ» / «Sold out» |
| **Hover** | `wd-hover-fw-button wd-hover-with-fade` — full-width кнопка |
| **Адаптив** | 4→3→2 колонки |

---

### 3.6. Product Loop «Перчатки с ПВХ»

Аналогично блоку 3.5: 12 товаров, taxonomy 386, заголовок «Перчатки с ПВХ».

---

### 3.7. Card Block 1 — преимущества (4 карточки)

| Заголовок | Описание |
|-----------|----------|
| Новинки перчаток | Каталог регулярно расширяется |
| Брендирование | Нанесём логотип в короткий срок |
| Гарантия возврата | Поменяем или вернём деньги |
| Быстрая доставка | ТК по всей России |

---

### 3.8. SEO-текст

| Параметр | Значение |
|----------|----------|
| **H2** | Рабочие перчатки от производителя оптом |
| **Контент** | О фабрике «Витекс», ✔-списки преимуществ |
| **H3** | Преимущества сотрудничества; Закажите рабочие перчатки оптом... |
| **Поведение** | Статичный текст, без интерактива |

---

### 3.9. Card Block 2 — «Как сделать заказ?» (4 шага)

| Шаг | Заголовок | Текст |
|-----|-----------|-------|
| 1 | Оставьте заявку | Форма, корзина или звонок |
| 2 | Менеджер поможет | Выбор перчаток, детали заказа |
| 3 | Производите оплату | Безналичный расчёт |
| 4 | Доставляем товар | Ссылка на `/dostavka/` |

---

### 3.10. Reviews Slider «Отзывы партнёров»

| Параметр | Значение |
|----------|----------|
| **Назначение** | Социальное доказательство (Яндекс.Карты) |
| **Структура** | Swiper carousel, 4 слайда × 2 отзыва = 8 отзывов |
| **Логотип** | `rewiefs-ya.png` |
| **Кнопка** | «Читать оригинал отзыва» → yandex.ru/maps/org/205409981904/reviews |
| **Навигация** | Стрелки + pagination dots |
| **Адаптив** | 1 слайд на всех breakpoints |

**Авторы (фрагменты):** Василий Гриднев, Алексей Сионихин, Инкогнито 0933, Андрей Панайтиди, Ксения, Patrol 37, илья тимин, Инкогнито 3147 (даты: 2–5 апреля 2025).

---

## 4. Каталог, категории, карточки товаров

### 4.1. Страница категории (пример: `/rabochie-perchatki/`)

| Параметр | Значение |
|----------|----------|
| **H1** | Рабочие перчатки в Иваново |
| **Layout** | Content 9 col + Sidebar 3 col (off-canvas на tablet/mobile) |
| **Подкатегории** | Chips/links: Перчатки ХБ, Полушерстяные и шерстяные |
| **Breadcrumbs** | Главная » Рабочие перчатки |
| **SEO-текст** | Внизу страницы |
| **Счётчик** | «Отображение 1–30 из 46» |

### 4.2. Toolbar каталога

| Элемент | Опции |
|---------|-------|
| Кнопка «Фильтры» | Открывает sidebar (mobile/tablet) |
| Per page | Всё / 12 / 24 / 36 (default ~30) |
| Сортировка | Исходная, популярность, новизна, цена ↑/↓ |
| Вид сетки | 3 или 5 колонок (`shop_view=grid&per_row=`) |
| Load more | «Загрузить ещё товары» + состояние «Загрузка...» |

### 4.3. Sidebar фильтры

| Группа атрибута | Значения (пример) |
|-----------------|-------------------|
| Покрытие (ПВХ) | Без ПВХ (17), Волна (4), Кирпich (3), Точка (19) |
| Кол-во нитей | 3–8 нитка |
| Класс вязки | 10 класс (33), 13 класс (1), 7,5 класс (10) |
| Цвет | Белый, Берёзка, Графит, Зелёный, Красный, Серый, Чёрный, Молочный-графit |
| Покрытие (латекс) | Латекс (1) |
| Вид ПВХ нанесения | Дублирует группу ПВХ |
| Виджет «Прайс-лист» | Кнопка «Отправить запрос» → `/prajs-list/` |

**Поведение фильтров:** GET-параметры `filter_*`, AJAX-навигация (Woodmart pjax), scroll offset 100px.

### 4.4. Карточка товара в каталоге

```
┌─────────────────────┐
│  [Изображение 600²] │
│  [Sold out / статус]│
├─────────────────────┤
│  Название товара    │
│  Упак. 5250.00₽/500п│
│  Пара 10.5₽         │
│  [Купить]           │
└─────────────────────┘
```

| Поле | Формат |
|------|--------|
| Цена упаковки | `Упак. {sum}₽/{N}пар` |
| Цена за пару | `Пара {sum}₽` или «За пару: X₽» |
| Альтернатива | «По запросу» |
| Stock label | «В наличии» (green) / «На заказ» / «Sold out» |
| Кнопка | «Купить» → URL товара |
| Shadow | `wd-products-with-shadow` на категории |

### 4.5. Страница товара (Single Product)

**Пример:** `/rabochie-perchatki/perchatki-hb/perchatki-rabochie-4-nitka-h-b/`

#### Layout

```
[Breadcrumbs]
┌──────────────┬─────────────────────────────┐
│   Gallery    │  H1: Перчатки х/б 4/10      │
│  (thumbs)    │  MOQ: от упаковки 500 пар   │
│              │  Упак. 5250₽/500пар         │
│              │  За пару: 10.5₽             │
│              │  [Оставить заявку]          │
│              │  Qty [−][1][+] [Добавить    │
│              │       упаковку в корзину]   │
│              │  Поделиться: OK/WA/VK/TG/Vb │
└──────────────┴─────────────────────────────┘
[Tabs: Описание | Детали | Документы | Доставка]
[Carousel «Похожие» — 4 товара]
```

#### Галерея

- WooCommerce gallery + Flexslider + PhotoSwipe lightbox
- Thumbnails снизу, popup on click
- Mobile: 1 колонка

#### Ценообразование

| Тип | Пример |
|-----|--------|
| Базовая упаковка | Упак. 5250.00₽/500пар |
| За пару | 10.5₽ |
| MOQ | «Покупка доступна от упаковки: 500 пар» |
| Оптовые ступени (в табе) | 10 000–30 000 пар → 8.7₽; от 30 000 → 8.5₽ |
| Dynamic pricing | Плагин ACO Woo Dynamic Pricing |

#### Атрибуты (таб «Детали»)

| Атрибут (slug) | Пример значения |
|----------------|-----------------|
| weight | — |
| pa_klass-vyazki | 10 класс |
| pa_cvet | Белый |
| pa_kol-vo-nitej | 4 нитка |
| pa_kolichestvo-par-v-upakovke | 500 |
| pa_manzheta | — |
| pa_sostav | Х/Б |
| pa_ves | ~40 гр. |
| pa_proizvoditel | Витекс |

#### Табы

| Таб | Содержимое |
|-----|------------|
| Описание | SEO + блок «🏭 Оптовые условия» (сетка тарифов) |
| Детали | Таблица атрибутов |
| Документы | Декларация соответствия (изображение) |
| Доставка | Текст про ТК и самовывоз |

#### Кнопки и действия

| Кнопка | Поведение |
|--------|-----------|
| «Оставить заявку» | Popup CF7 (#zapros-ceny) |
| «Добавить упаковку в корзину» | POST form, qty min=1 |
| «Задать вопрос: +7 (903) 888-16-61» | tel: link |
| Share | OK, WhatsApp, VK, Telegram, Viber |

#### Отзывы на карточке

WooCommerce reviews **не выводятся** (класс есть, контент пуст).

#### Mobile

- Тabs → аккордеон (`wd-accordion-item`)
- Summary full width под галереей

---

## 5. Поиск и фильтрация

### 5.1. Поиск

| Параметр | Значение |
|----------|----------|
| **Тип** | AJAX live search (Woodmart) |
| **Placeholder** | «Поиск перчаток» |
| **Action** | `GET /?s={query}&post_type=product` |
| **Min символов** | 3 |
| **Max результатов** | 20 |
| **Показывает** | Thumbnail + цена |
| **UI** | 2 экземпляра: mobile nav + fullscreen overlay |
| **Подсказка (fullscreen)** | «Начните вводить текст, чтобы увидеть товары...» |
| **Кнопка** | «Поиск» |
| **Delay** | 300ms AJAX |
| **Показать всё** | «Показать всё» при большом числе результатов |

### 5.2. Фильтрация каталога

| Механизм | Описание |
|----------|----------|
| Layered nav | WooCommerce + Woodmart swatches |
| URL params | `filter_{attribute_slug}={term_slug}` |
| OR-логика цвета | `query_type_cvet=or` |
| Price filter | `min_price`, `max_price` (robots clean-param) |
| Clear filters | Ссылка сброса в active filters area |
| Sidebar | Off-canvas справа, кнопка «Закрыть» |

---

## 6. Корзина и оформление заявки

### 6.1. Side Cart (popup справа)

| Состояние | UI |
|-----------|-----|
| Пустая | «Корзина пуста.» + «В каталог» |
| С товарами | Список, qty, subtotal, вес перчаток (custom) |
| Заголовок | «Корзина покупок» |
| Закрытие | «Закрыть» |

**Примечание:** `cart_url` в настройках темы на главной = `/checkout/`, на странице cart = `/cart/`.

### 6.2. Страница `/cart/`

| Пустая корзина | С товарами (ожидаемое) |
|----------------|------------------------|
| «Ваша корзина пока пуста.» | Таблица товаров |
| «Прежде чем приступить...» | Quantity ±, удаление |
| «Вернуться в магазин» → `/shop/` | «Обновить корзину» |
| | Subtotal, переход к checkout |

### 6.3. Страница `/checkout/`

| Параметр | Значение |
|----------|----------|
| **Guest checkout** | Да |
| **Пустая корзина** | Форма не рендерится |
| **AJAX** | `/?wc-ajax=checkout` |

#### Billing fields (RU)

| Поле | Обязательность |
|------|----------------|
| Имя | * |
| Фамилия | * |
| Название компании | опц. |
| Страна/регион | * |
| Адрес | * |
| Квартира, этаж и т.д. | опц. |
| Город | * |
| Область/район | * |
| Почтовый индекс | * |
| Телефон | * |
| Email | стандарт WC |

#### Дополнительно

- Shipping (если включено)
- Способы доставки / оплаты
- Купон (apply/remove nonce)
- Комментарий к заказу
- Order review (итого)
- Кнопка «Оформить заказ»
- Яндекс.Метрика goal `checkout` на CF7 id 2250

### 6.4. Add to Cart flow

| Шаг | Поведение |
|-----|-----------|
| Каталог «Купить» | Redirect на product page |
| Product «Добавить упаковку» | Full page POST |
| После добавления | Popup: «Товар был успешно добавлен в вашу корзину» |
| Popup кнопки | «Продолжить выбор» / «Перейти к заказу» |
| AJAX add-to-cart | **Отключён** (`woocommerce_ajax_add_to_cart: no`) |

---

## 7. Все формы

Общее для всех CF7: Google reCAPTCHA v3, spinner на submit, redirect → `/spasibo-za-obrashhenie/`.

### 7.1. Поиск (×2)

| Поле | Тип |
|------|-----|
| s | text, required |
| post_type | hidden = product |

### 7.2. Контакты (CF7 #369, popup `#contact-form-popup`)

| Поле | name | Обяз. | Placeholder |
|------|------|-------|-------------|
| Имя | your-name | * | Как к вам обращаться? |
| Email | your-email | — | Не обязательно |
| Телефон | tel-335 | * | Свяжемся по этому номеру |
| Юр. лицо | text-902 | — | ООО или ИП |
| Вопрос | your-message | — | textarea |
| Согласие ПДн | acceptance-964 | опц. | checkbox + link |
| Submit | — | — | «Отправить» |

### 7.3. Прайс-лист (CF7 #9722)

| Поле | name | Обяз. | Placeholder |
|------|------|-------|-------------|
| Имя | your-name | * | Ваше имя |
| Телефон | tel-101 | * | Телефон для связи |
| Email | email-662 | * | Электронная почта |
| Согласие | acceptance-964 | опц. | checkbox |
| Submit | — | — | «Отправить» |

### 7.4. Заявка на товар (CF7 #8931, popup `#zapros-ceny`)

| Поле | name | Обяз. |
|------|------|-------|
| Имя | your-name | * |
| Email | your-email | * |
| Телефон | tel-273 | * |
| URL товара | post-url | hidden (auto) |
| Согласие | acceptance-964 | опц. |
| Submit | — | «Отправить» |

### 7.5. О компании — подбор товара (CF7 #8852)

| Поле | name | Обяз. |
|------|------|-------|
| Телефон | tel-239 | * |
| Submit | — | «Отправить» |

### 7.6. Сотрудничество (CF7 #8624)

| Поле | name | Обяз. |
|------|------|-------|
| Имя | your-name | * |
| Телефон | tel-101 | * |
| Email | email-756 | * |
| Тип | menu-602 | * (Юр.лицо / Физ.лицо) |
| Согласие | acceptance-964 | опц. |
| Submit | — | «Отправить» |

### 7.7. Нанесение логотипа (CF7 #9497, multipart)

| Поле | name | Обяз. | Примечание |
|------|------|-------|------------|
| Название/компания | text-18 | * | — |
| Телефон | tel-434 | * | — |
| Файл макета | file-713 | — | .jpg,.jpeg,.png,.psd |
| Submit | — | — | «Отправить заявку» |

### 7.8. Checkout (WooCommerce)

См. раздел 6.3 — стандартная форма заказа WC.

---

## 8. Отзывы

### 8.1. На сайте

| Место | Тип | Кол-во |
|-------|-----|--------|
| Главная — slider | Яндекс.Карты (ручной импорт) | 8 |
| Footer | Rating badge iframe | Яндекс.Справочник |
| Contact | Map widget | oid=205409981904 |
| Product page | WooCommerce reviews | **Не используется** |

### 8.2. Структура отзыва в slider

| Поле | Пример |
|------|--------|
| Автор | ВАСИЛИЙ ВАСИЛЬЕВИЧ ГРИДНЕВ |
| Дата | 5 апреля 2025 |
| Текст | Фрагмент отзыва |
| Рейтинг | Не отображается числом (только текст) |
| CTA | «Читать оригинал отзыва» → Yandex Maps |
| Логотип источника | `rewiefs-ya.png` |

### 8.3. Поведение slider

- Swiper, autoplay не указан явно
- 2 отзыва на слайд (desktop), 1 col
- Стрелки навигации

---

## 9. Информационные страницы

### 9.1. `/o-kompanii-viteks/` — О компании

| Блок | Контент |
|------|---------|
| H1 | О компании Витекс |
| Текст | Поставщик ХБ перчаток, логотипы, экспорт, контроль качества, Иваново |
| Promo 1 | «40 копеек с пары» → CTA «СКИДКИ В ПРАЙСЕ» |
| Promo 2 | «1 000 000 пар в месяц» |
| Promo 3 | «Более 30 видов» → «Рабочие перчатки» |
| Видео | `Oborudovanie-ispolzuemoe-kompaniej-VITEKS.mp4` |
| Форма | «ПОМОЖЕМ ПОДОБРАТЬ ТОВАР» — телефон |
| Infographic | Pie chart: Витекс 50% / Другие 40% |

### 9.2. `/dostavka/` — Доставка

Информация о доставке ТК по РФ, условия самовывоза (Иваново).

### 9.3. `/oplata/` — Оплата

Реквизиты, безналичный расчёт для юр. лиц.

### 9.4. `/nanesenie-logotipa/`

| Блок | Контент |
|------|---------|
| H1 | Нанесение логотипа на ХБ перчатки в Иваново |
| H2 | Разместить заявку + форма с файлом |
| H2 | С чего начать заказ услуги |
| H2 | Шелкография / термотransfer |
| Изображение | `form-vitex.jpg` |

### 9.5. `/optovym-pokupatelyam/`

H1: «Предлагаем выгодное сотрудничество оптовым покупателям» + форма (имя, тел, email, юр/физ).

### 9.6. `/optovym-pokupatelyam/otdel-zakupki/`

Закупка сырья — информационная.

### 9.7. `/prajs-list/`

H1: «Отправить запрос на прайс-лист» + форма + возможность скачать файл прайса.

### 9.8. `/privacy-policy/`

Политика обработки персональных данных (cookie, Metrika, reCAPTCHA).

---

## 10. Футер

### 10.1. Структура (4 колонки + copyright bar)

#### Колонка «Мы находимся»

- Фабрика производитель рабочих перчаток
- Иваново, Ярмарочная ул., 18/22
- +7 (4932) 39-00-29
- Отдел продаж: +7 (902) 243-00-29, +7 (903) 888-16-61
- Яндекс rating badge iframe

#### Колонка «Информация»

| Ссылка | URL |
|--------|-----|
| Прайс-лист | `/prajs-list/` |
| Заявка на сотрудничество | `/optovym-pokupatelyam/` |
| Закупка сырья | `/optovym-pokupatelyam/otdel-zakupki/` |
| Контакты | `/contact/` |
| Реквизиты оплаты | `/oplata/` |
| Доставка по РФ | `/dostavka/` |
| Нанесение логотипа | `/nanesenie-logotipa/` |

#### Колонка «Каталог»

- Перчатки рабочие, Рукавицы, Технические ткани

#### Колонка «Перчатки»

- ХБ, ХБ с ПВХ, Шерстяные/П/Ш

### 10.2. Copyright bar

| Элемент | Текст |
|---------|-------|
| Copyright | ©2018-2026 Витекс. Все права защищены |
| Legal | Политика ПДн |
| Requisites | ООО «ФАБРИКА ВИТЕКС» ИНН 3700000996 |
| Соцсети | Email share, YouTube, VK |
| Disclaimer | ст. 437 ГК РФ — не является офертой |
| Credits | Ptahini (logo + link) |
| Metrika | Informer id 53320042 |

---

## 11. Всплывающие окна

| ID / класс | Триггер | Содержимое | Кнопки |
|------------|---------|------------|--------|
| `.wd-cookies-popup` | Auto on load | Cookie + Metrika + reCAPTCHA notice | «Подробнее» → privacy; «Согласен» |
| `.wd-search-full-screen` | Click «Поиск» | AJAX search form | «Поиск», Close (×) |
| `.cart-widget-side` | Click cart icon | Mini cart | «Закрыть», «В каталог» |
| `.mobile-nav` | Click «Menu» | Nav + search + city | «Закрыть» |
| City popup | Click «Иваново ▼» | 6 городов | — |
| `#no_call` | «Не дозвонились?» | WhatsApp text | «Отправить сообщение» |
| `#zapros-ceny` | «Оставить заявку» (product) | CF7 form | «Отправить» |
| `#contact-form-popup` | «Форма связи» (contact) | CF7 + info panel | «Отправить» |
| Add to cart popup | After add (JS) | Success message | «Продолжить выбор» / «Перейти к заказу» |
| PhotoSwipe | Click gallery | Lightbox | Zoom, share, close |
| Magnific Popup | Various `.wd-open-popup` | Generic popups | — |

**Promo popup:** отключён (`enable_popup: no`).

---

## 12. Мобильная версия

### 12.1. Общие параметры

| Параметр | Значение |
|----------|----------|
| Viewport | `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` |
| Wrapper | `wrapper-full-width` |
| Breakpoints (Woodmart) | lg: ≥1025px, md: ≥768.98px, sm: <768.98px |

### 12.2. Header mobile

| Элемент | Поведение |
|---------|-----------|
| Logo | Compact 100px width |
| Top bar | Телефоны + «Не дозвонились?» |
| Sticky header | Clone on scroll (`whb-sticky-shadow`) |
| Cart | Icon + subtotal |
| Menu | Hamburger → off-canvas left |
| Search | Inside mobile nav |
| City selector | Widget in mobile menu footer |

### 12.3. Каталог mobile

| Элемент | Поведение |
|---------|-----------|
| Sidebar | Off-canvas (`offcanvas-sidebar-mobile/tablet`) |
| Filters btn | Sticky FAB (`wd-sidebar-opener`) |
| Grid | 2 columns (`--wd-col-sm:2`) |
| Toolbar | Compact icons for sort/view |
| Load more | Full width button |

### 12.4. Product mobile

- Gallery: single column
- Tabs → accordion
- Related products carousel: disabled on mobile
- Share buttons: visible

### 12.5. Footer mobile

- Columns stack vertically
- Map iframe: height 500px, width 100%

### 12.6. Touch / UX

- `base_hover_mobile_click: yes` — hover effects → click on mobile
- Drilldown mobile menu with back labels
- Scroll to top button

---

## 13. Визуальный стиль

### 13.1. Цветовая палитра

| Роль | HEX | Использование |
|------|-----|---------------|
| Primary / CTA orange | `#f88c00` | Hero CTA, primary buttons |
| Primary hover | `#e2b500` | Hover CTA |
| Accent teal | `#0d5a7e` | Info box icon borders |
| Link accent red | `#e53f40` / `rgb(229,63,64)` | «Не дозвонились?» |
| Text dark | `#333333` | Body text |
| Text muted | `#6c757d` | Secondary text |
| Cart weight highlight | `#2c5aa0` | Custom mini-cart weight |
| White | `#ffffff` | Backgrounds |
| Black | `#000000` | Phone buttons in header |

**Woodmart primary (`btn-color-primary`):** задаётся темой (обычно orange/brand — совпадает с `#f88c00`).

### 13.2. Шрифты (Google Fonts)

| Шрифт | Начертания | Назначение |
|-------|------------|------------|
| Roboto Condensed | 400, 600 | Заголовки / UI |
| Nunito Sans | 400, 600, 800 | Body |
| Russo One | 400 | Акцентные заголовки |
| Roboto | 400, 700 | Fallback body |
| woodmart-font (icon) | 400 | Иконки темы |

### 13.3. Сетка и контейнер

| Параметр | Значение |
|----------|----------|
| Framework | Bootstrap (Woodmart light) |
| Site width | **1222px** (`woodmart_settings.site_width`) |
| Container | `.container` centered |
| Product grid lg | 4 col, gap 30px |
| Product grid md | 3 col |
| Product grid sm | 2 col, gap 10px |
| Category layout | 9+3 (content + sidebar) |
| Full width header | `wrapper-full-width` |

### 13.4. Отступы

| Область | Значение |
|---------|----------|
| Hero | margin-top: -80px (under header) |
| Info block row | margin-bottom 40px (tablet) |
| Section padding | 30px typical (VC custom) |
| Popup padding | 20px |
| Footer widget | standard Woodmart spacing |

### 13.5. Карточки товаров

| Свойство | Значение |
|----------|----------|
| Shadow | `wd-products-with-shadow` on archive |
| Image ratio | ~1:1 (600×600) |
| Hover | Fade + full-width button slide up |
| Labels | Rounded, colored (stock/sale/sold out) |
| Title | Link hover underline (`hover-a`) |
| Border radius | Theme default (~0 on cards) |

### 13.6. Кнопки

| Вариант | Классы | Применение |
|---------|--------|------------|
| Primary filled | `btn-color-primary btn-style-default btn-style-rectangle` | Promo banners, forms |
| Dark semi-round | `btn-scheme-dark btn-style-semi-round btn-size-extra-large` | Hero CTA |
| Bordered small | `btn-color-default btn-style-bordered btn-size-small` | About promos |
| Link red | `btn-color-default btn-style-link btn-size-extra-small` | «Не дозвонились?» |
| Black phone | `btn-color-black btn-style-semi-round btn-size-extra-small` | Top bar phones |
| WC add to cart | `single_add_to_cart_button button alt` | Product |
| Cookie accept | `btn-color-primary btn-size-small` | Cookies popup |

### 13.7. Границы и скругления

| Элемент | Radius |
|---------|--------|
| City popup items | 6px |
| City popup container | 12px |
| Buttons semi-round | ~4–8px |
| Buttons rectangle | 0 |
| Filter swatches | round (`wd-shape-round`) |
| Main page wrapper | 0 (shadow none) |

### 13.8. Тени

| Элемент | Shadow |
|---------|--------|
| City popup | `0 10px 30px rgba(0,0,0,0.3)` |
| Product cards (archive) | Woodmart product shadow |
| Sticky header | `whb-sticky-shadow` |
| Main page content | none (explicit override) |

### 13.9. Hover-эффекты

| Элемент | Эффект |
|---------|--------|
| Promo banners | Zoom image (`banner-hover-zoom`) |
| Product card | Fade overlay + FW button |
| Nav menu | Dropdown on hover (`wd-event-hover`) |
| City selector | border-color + bg change |
| Links | underline / color transition |

### 13.10. Адаптивная типографика

| Класс | Использование |
|-------|---------------|
| `wd-fontsize-xxl` | Contact H1 |
| `wd-fontsize-l` | Opt page H1 |
| Section titles | Woodmart `section-title` component |

---

## 14. Сущности для БД

Ниже — полный список сущностей для реimplementation без WordPress.

### 14.1. Каталог

| Сущность | Поля / связи |
|----------|--------------|
| **Product** | id, slug, name, sku, description, short_description, status (publish/draft), stock_status (instock/onbackorder/outofstock), stock_label_text, is_featured, menu_order, created_at, updated_at |
| **ProductCategory** | id, slug, name, parent_id, description, seo_title, seo_description, image_id, sort_order |
| **ProductCategoryProduct** | product_id, category_id (M:N) |
| **ProductImage** | id, product_id, url, alt, sort_order, is_primary |
| **ProductAttribute** | id, slug, name, type (select/color/text), is_filterable, sort_order |
| **ProductAttributeValue** | id, attribute_id, slug, name, color_hex (optional), sort_order |
| **ProductAttributeAssignment** | product_id, attribute_value_id |
| **ProductPrice** | product_id, pack_price, pairs_per_pack, price_per_pair, currency (RUB), price_display_mode |
| **ProductPriceTier** | product_id, min_pairs, max_pairs, price_per_pair (оптовые ступени) |
| **ProductDocument** | product_id, type (declaration/certificate), title, file_url/image_url |
| **ProductTab** | product_id, tab_key, title, content_html, sort_order |
| **ProductRelation** | product_id, related_product_id, type (similar/upsell/crosssell) |

### 14.2. Фильтрация и поиск

| Сущность | Поля |
|----------|------|
| **FilterGroup** | id, attribute_id, display_name, widget_type (list/swatches) |
| **FilterCache** | category_id, attribute_slug, term_slug, product_count |
| **SearchLog** | query, results_count, user_session, created_at (опционально) |

### 14.3. Корзина и заказы

| Сущность | Поля |
|----------|------|
| **Cart** | id, session_id, user_id (nullable), city_subdomain, created_at, updated_at |
| **CartItem** | cart_id, product_id, quantity_packs, unit_price, line_total |
| **Order** | id, order_number, user_id, status, billing_*, shipping_*, payment_method, shipping_method, customer_note, subtotal, total, weight_total, source_utm, created_at |
| **OrderItem** | order_id, product_id, product_name_snapshot, quantity_packs, pairs_per_pack, unit_price, line_total |
| **OrderStatusHistory** | order_id, status, comment, created_at |
| **Coupon** | code, type, amount, min_amount, usage_limit, used_count, expires_at |

### 14.4. Пользователи

| Сущность | Поля |
|----------|------|
| **User** | id, email, phone, password_hash, first_name, last_name, company_name, role (customer/manager/admin) |
| **UserAddress** | user_id, type (billing/shipping), fields... |
| **UserSession** | session_id, user_id, cart_id, ip, user_agent |

### 14.5. Контент (CMS)

| Сущность | Поля |
|----------|------|
| **Page** | id, slug, title, content_html, template, seo_*, published_at |
| **PageBlock** | page_id, block_type, sort_order, config_json (hero/info-box/banner/product-loop/slider/text/steps) |
| **Menu** | id, slug (header-main, header-mobile, footer-*) |
| **MenuItem** | menu_id, parent_id, title, url, type (page/category/custom), sort_order, mega_menu_config_json |
| **Media** | id, url, mime, alt, width, height |

### 14.6. Формы и заявки

| Сущность | Поля |
|----------|------|
| **FormDefinition** | id, slug, name, fields_schema_json, recaptcha_enabled |
| **FormSubmission** | id, form_id, data_json, product_url, file_urls, ip, user_agent, status (new/processed), created_at |
| **FormField** | form_id, name, type, label, required, placeholder, validation_rules |

**Маппинг форм:**

| form_id | slug | Страница |
|---------|------|----------|
| 369 | contact | /contact/ |
| 9722 | price-list | /prajs-list/ |
| 8931 | product-request | product popup |
| 8852 | product-selection | /o-kompanii-viteks/ |
| 8624 | partnership | /optovym-pokupatelyam/ |
| 9497 | logo-application | /nanesenie-logotipa/ |
| 2250 | checkout-metrika | checkout (YM goal) |

### 14.7. Отзывы

| Сущность | Поля |
|----------|------|
| **Review** | id, source (yandex/manual), author_name, text, review_date, external_url, rating, is_published, sort_order |
| **ReviewSlide** | slider_id, review_id, slide_index, position_in_slide |

### 14.8. Региональность

| Сущность | Поля |
|----------|------|
| **City** | id, name, slug, subdomain_url, is_default, phone, address_override |
| **CityProductOverride** | city_id, product_id, price_override (optional) |

### 14.9. Настройки сайта

| Сущность | Поля |
|----------|------|
| **SiteSetting** | key, value_json |
| **ContactInfo** | type (phone/email/address), value, label, sort_order |
| **BusinessHours** | day_range, open_time, close_time, timezone |
| **SocialLink** | platform, url |
| **LegalInfo** | company_name, inn, ogrn, copyright_text |

### 14.10. SEO и аналитика

| Сущность | Поля |
|----------|------|
| **SeoMeta** | entity_type, entity_id, title, description, canonical, og_image |
| **Redirect** | from_path, to_path, code |
| **AnalyticsConfig** | yandex_metrika_id, goals_json |

### 14.11. Shipping & Payment

| Сущность | Поля |
|----------|------|
| **ShippingMethod** | id, name, description, price_formula, is_active |
| **PaymentMethod** | id, name, description, instructions, is_active |

---

## 15. Компонентная карта для разработки

### 15.1. Layout

```
AppLayout
├── HeaderTopBar          — phones, no-call popup trigger
├── HeaderMain            — logo, city, hours, contacts, cart
├── HeaderBottom          — mega menu, quick links, search
├── HeaderSticky          — clone on scroll
├── MobileNav             — off-canvas menu
├── Footer                — 4 columns + copyright
├── ScrollToTop
└── CookieBanner
```

### 15.2. UI Components

```
Button                  — variants: primary, dark, bordered, link, black
InfoBox                 — icon + title
PromoBanner             — image + CTA + hover zoom
ProductCard             — image, title, prices, stock, buy btn
ProductGrid             — responsive grid + load more
ProductGallery          — main + thumbs + lightbox
ProductSummary          — price, MOQ, qty, add to cart, request form
ProductTabs             — description/attributes/docs/shipping
ProductAttributesTable
Breadcrumbs
SectionTitle
StepsBlock              — 4 steps «Как заказать»
AdvantagesBlock         — 4 cards
ReviewSlider            — Yandex reviews
SearchForm              — ajax + fullscreen variant
FilterSidebar           — layered nav swatches
CatalogToolbar          — count, sort, per-page, grid view
MiniCart                — side panel
Popup                   — generic magnific wrapper
CitySelector
ShareButtons
MapEmbed                — Yandex map iframe
VideoPlayer
PriceRequestForm
ContactForm
PartnershipForm
LogoApplicationForm     — with file upload
```

### 15.3. Pages (routes)

```
/                       — HomePage
/shop                   — redirect → /rabochie-perchatki
/rabochie-perchatki     — CategoryPage (template for all categories)
/:categoryPath          — CategoryPage (nested)
/:categoryPath/:product — ProductPage
/cart                   — CartPage
/checkout               — CheckoutPage
/contact                — ContactPage
/o-kompanii-viteks      — AboutPage
/prajs-list             — PriceListPage
/dostavka               — DeliveryPage
/oplata                 — PaymentPage
/nanesenie-logotipa     — LogoServicePage
/optovym-pokupatelyam   — PartnershipPage
/optovym-pokupatelyam/otdel-zakupki — ProcurementPage
/privacy-policy         — PrivacyPage
/spasibo-za-obrashhenie — ThankYouPage
/search                 — SearchResultsPage
/my-account/*           — AccountPages (optional phase 2)
```

### 14.12. Технические интеграции (не БД, но важно)

| Сервис | ID / URL | Назначение |
|--------|----------|------------|
| Яндекс.Метрика | 53320042 | Аналитика, goals |
| Google reCAPTCHA v3 | 6LeXfAwd... | Защита форм |
| Яндекс.Карты | org 205409981904 | Карта, отзывы, рейтинг |
| WhatsApp | 79290893763 | «Не дозвонились?» |
| YouTube | UC125MyNSEB... | Соцсеть |
| VK | vk.com/vitex37 | Соцсеть |

---

## Приложение A — Полный список URL категорий (sitemap)

1. `/rabochie-perchatki/`
2. `/rabochie-perchatki/perchatki-hb/`
3. `/rabochie-perchatki/perchatki-hb/perchatki-s-pvh/`
4. `/rabochie-perchatki/perchatki-polusherstyanye-i-sherstyanye/`
5. `/rukavicy/`
6. `/rukavicy/brezentovye/`
7. `/rukavicy/hb/`
8. `/rukavicy/kombinirovannye/`
9. `/rukavicy/uteplennye/`
10. `/rukavicy/sukonnye-rukavicy/`
11. `/rukavicy/rukavicy-s-naladonnikom/`
12. `/rukavicy/rukavicy-s-naladonnikom/rukavicy-s-pvh-naladonnikom/`
13. `/rukavicy/rukavicy-s-naladonnikom/rukavicy-s-brezentovym-naladonnikom/`
14. `/rukavicy/fartuki/`
15. `/tehnicheskie-tkani/`
16. `/tehnicheskie-tkani/vafelnoe-polotno/`
17. `/tehnicheskie-tkani/vafelnoe-polotno/vafelnoe-polotno-otbelennoe/`
18. `/tehnicheskie-tkani/vafelnoe-polotno/vafelnoe-polotno-gladkokrashenoe/`
19. `/tehnicheskie-tkani/holstoproshivnoe-polotno/`
20. `/tehnicheskie-tkani/tryapki-dlya-pola/`

## Приложение B — Атрибуты фильтрации (из robots clean-param)

- `filter_klass-vyazki`
- `filter_sezon`
- `filter_kolichestvo-par-v-upakovke`
- `filter_tablica-razmerov`
- `filter_pol`
- `filter_vid-naneseniya-pvh`
- `filter_kol-vo-nitej`
- `filter_cvet`
- `min_price`, `max_price`
- `orderby`, `per_page`, `shop_view`

## Приложение C — Ключевые файлы текущей реализации

| Компонент | Путь / технология |
|-----------|-------------------|
| Тема | `woodmart` + `woodmart-child` |
| Page builder | WPBakery (vc_row, wpb_) |
| E-commerce | WooCommerce 11 |
| Forms | Contact Form 7 |
| Dynamic pricing | ACO Woo Dynamic Pricing |
| SEO | Yoast SEO 28.2 |
| Filters | Woodmart Layered Nav + swatches |

---

*Документ подготовлен для этапа проектирования. Код не реализован.*
