-- =============================================================================
-- 202608310001_extensions_enums.sql
-- Extensions + shared enums for Vitex
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles
CREATE TYPE public.user_role AS ENUM ('customer', 'manager', 'admin');

-- CMS / catalog visibility
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

-- Product stock
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'on_order', 'out_of_stock');

-- Attribute kinds for filters
CREATE TYPE public.attribute_type AS ENUM ('select', 'color', 'text', 'number');

-- Menu link targets
CREATE TYPE public.menu_link_type AS ENUM ('custom', 'page', 'category', 'product');

-- Orders
CREATE TYPE public.order_status AS ENUM (
  'new',
  'processing',
  'awaiting_payment',
  'paid',
  'shipped',
  'completed',
  'cancelled'
);

-- Reviews
CREATE TYPE public.review_source AS ENUM ('yandex', 'manual');

-- Lead / contact forms
CREATE TYPE public.form_type AS ENUM (
  'contact',
  'price_list',
  'product_request',
  'product_selection',
  'partnership',
  'logo_application'
);

CREATE TYPE public.submission_status AS ENUM (
  'new',
  'in_progress',
  'done',
  'spam'
);
