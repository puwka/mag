-- =============================================================================
-- 202608310009_seed_minimal.sql
-- Minimal seed: homepage section keys, default city, placeholder settings
-- (no product catalog — content import is a separate step)
-- =============================================================================

INSERT INTO public.cities (name, slug, subdomain_url, is_default, phone, address, sort_order, is_active)
VALUES
  ('Иваново', 'ivanovo', 'https://vitex37.ru', true, '+7 (903) 888-16-61', 'Иваново, Ярмарочная улица, 18/22', 0, true),
  ('Санкт-Петербург', 'spb', 'https://spb.vitex37.ru', false, NULL, NULL, 1, true),
  ('Москва', 'moscow', 'https://moscow.vitex37.ru', false, NULL, NULL, 2, true),
  ('Екатеринбург', 'ekb', 'https://ekb.vitex37.ru', false, NULL, NULL, 3, true),
  ('Нижний Новгород', 'nn', 'https://nn.vitex37.ru', false, NULL, NULL, 4, true),
  ('Краснодар', 'krasnodar', 'https://krasnodar.vitex37.ru', false, NULL, NULL, 5, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value, label, group_name, is_public) VALUES
  ('company.name', '"ООО «ФАБРИКА ВИТЕКС»"'::jsonb, 'Название компании', 'legal', true),
  ('company.inn', '"3700000996"'::jsonb, 'ИНН', 'legal', true),
  ('company.address', '"Иваново, Ярмарочная улица, 18/22"'::jsonb, 'Адрес', 'contacts', true),
  ('contacts.phones', '["+7 (903) 888-16-61", "+7 (903) 888-09-39", "+7 (4932) 39-00-29"]'::jsonb, 'Телефоны', 'contacts', true),
  ('contacts.email', '"vitex37@mail.ru"'::jsonb, 'Email', 'contacts', true),
  ('contacts.hours', '{"label":"ПН-ПТ, 09:00–17:00 (МСК)"}'::jsonb, 'Часы работы', 'contacts', true),
  ('contacts.whatsapp', '"79290893763"'::jsonb, 'WhatsApp', 'contacts', true),
  ('analytics.yandex_metrika_id', '"53320042"'::jsonb, 'Яндекс.Метрика', 'analytics', false),
  ('maps.yandex_org_id', '"205409981904"'::jsonb, 'Яндекс.Организация', 'analytics', true),
  ('social.vk', '"https://vk.com/vitex37"'::jsonb, 'VK', 'social', true),
  ('social.youtube', '"https://www.youtube.com/channel/UC125MyNSEB_xJ9YXQeAeVGw"'::jsonb, 'YouTube', 'social', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.homepage_sections (section_key, title, config, is_visible, sort_order) VALUES
  ('hero', 'Hero', '{"cta_label":"Запросить прайс-лист","cta_url":"/prajs-list/"}'::jsonb, true, 10),
  ('info_boxes', 'Преимущества (иконки)', '{}'::jsonb, true, 20),
  ('promo_row_1', 'Промо ряд 1', '{}'::jsonb, true, 30),
  ('promo_row_2', 'Промо ряд 2', '{}'::jsonb, true, 40),
  ('products_hb', 'Перчатки ХБ', '{"category_path":"rabochie-perchatki/perchatki-hb","limit":12}'::jsonb, true, 50),
  ('products_pvc', 'Перчатки с ПВХ', '{"category_path":"rabochie-perchatki/perchatki-hb/perchatki-s-pvh","limit":12}'::jsonb, true, 60),
  ('advantages', 'Преимущества (карточки)', '{}'::jsonb, true, 70),
  ('seo', 'SEO-текст', '{}'::jsonb, true, 80),
  ('steps', 'Как сделать заказ?', '{}'::jsonb, true, 90),
  ('reviews', 'Отзывы партнеров', '{}'::jsonb, true, 100)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.homepage_steps (step_number, title, description, link_url, link_label, sort_order, is_visible) VALUES
  (1, 'Оставьте заявку', 'Заполните форму, заявку через корзину на сайте или позвоните нам', NULL, NULL, 1, true),
  (2, 'Менеджер поможет', 'Помогаем с выбором перчаток и обсуждаем детали заказа', NULL, NULL, 2, true),
  (3, 'Производите оплату', 'Вы производите оплату по безналичному расчёту', NULL, NULL, 3, true),
  (4, 'Доставляем товар', 'Осуществляем доставку по указанному вами адресу', '/dostavka/', 'подробности доставки', 4, true)
ON CONFLICT (step_number) DO NOTHING;
