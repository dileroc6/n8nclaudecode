-- =============================================================================
-- Migración 000: Setup del schema público
-- Crea extensiones, tabla maestra de clientes y tabla de control de migraciones
-- NUNCA modificar este archivo; crear una nueva migración para cambios
-- =============================================================================

-- Extensión requerida para cifrar webhook_secret
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de control de migraciones aplicadas
CREATE TABLE IF NOT EXISTS public.db_migrations (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL UNIQUE,
  aplicada_en     TIMESTAMPTZ DEFAULT NOW(),
  schema_objetivo VARCHAR(50) DEFAULT 'public'
);

-- Tabla maestra de clientes del sistema
-- Un registro por empresa que usa CatalogBot
CREATE TABLE IF NOT EXISTS public.clientes (
  cliente_id          VARCHAR(20) PRIMARY KEY,
  nombre              VARCHAR(255) NOT NULL,
  activo              BOOLEAN DEFAULT true,
  fecha_registro      TIMESTAMPTZ DEFAULT NOW(),
  ecommerce_tipo      VARCHAR(50) NOT NULL,
  ecommerce_url       TEXT NOT NULL,
  n8n_credential_name VARCHAR(100) NOT NULL,
  cloudinary_folder   VARCHAR(100) NOT NULL,
  whatsapp_instance   VARCHAR(100) NOT NULL UNIQUE,
  webhook_secret      TEXT NOT NULL
);

-- Índice para resolver cliente por instancia de WhatsApp en WF-A
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp_instance
  ON public.clientes (whatsapp_instance)
  WHERE activo = true;

-- Registrar esta migración como aplicada
INSERT INTO public.db_migrations (nombre, schema_objetivo)
VALUES ('20240417_000_public_setup', 'public')
ON CONFLICT (nombre) DO NOTHING;
