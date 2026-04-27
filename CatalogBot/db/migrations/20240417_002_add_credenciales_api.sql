-- Agrega columna credenciales_api a public.clientes
-- Almacena credenciales del ecommerce para ejecución autónoma de programados en WF-E
-- Formato WooCommerce: {"consumer_key": "ck_...", "consumer_secret": "cs_..."}
-- Formato Shopify:     {"access_token": "shpat_..."}
-- En producción: cifrar con pgcrypto antes de insertar

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS credenciales_api JSONB;
