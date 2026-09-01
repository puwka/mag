-- =============================================================================
-- 202608310009_seed_minimal.sql
-- Minimal seed: homepage section keys, default city, placeholder settings
-- =============================================================================

INSERT INTO public.cities (name, slug, subdomain_url, is_default, phone, address, sort_order, is_active)
VALUES
  ('Орск', 'orsk', 'https://xbtex.ru', true, '+7 (922) 872-00-08', 'Орск, пр. Металлистов, 3', 0, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value, label, group_name, is_public) VALUES
  ('brand.name', '"ХБтекс"'::jsonb, 'Бренд', 'brand', true),
  ('company.name', '"ИП Тарабанов Александр Иванович"'::jsonb, 'Название компании', 'legal', true),
  ('company.inn', '"563501659899"'::jsonb, 'ИНН', 'legal', true),
  ('company.address', '"Орск, пр. Металлистов, 3"'::jsonb, 'Адрес', 'contacts', true),
  ('contacts.phones', '["+7 (922) 872-00-08"]'::jsonb, 'Телефоны', 'contacts', true),
  ('contacts.email', '"tarabanov.aleksandr@yandex.ru"'::jsonb, 'Email', 'contacts', true),
  ('contacts.hours', '{"label":"ПН-ПТ, 09:00–17:00 (МСК)"}'::jsonb, 'Часы работы', 'contacts', true),
  ('contacts.whatsapp', '"79228720008"'::jsonb, 'WhatsApp', 'contacts', true),
  ('seo.site_url', '"https://xbtex.ru"'::jsonb, 'URL сайта', 'seo', true),
  ('social.vk', '""'::jsonb, 'VK', 'social', true),
  ('social.youtube', '""'::jsonb, 'YouTube', 'social', true)
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
