-- =====================================================================
-- Bejauha — Migración CRM (cargar TODA la base de 2.033 contactos)
-- Hace `telefono` opcional (hay 1.235 contactos solo-Instagram) y agrega
-- columnas de CRM. `id` pasa a ser la PK; `telefono` queda UNIQUE nullable.
-- Versión: 006 · Fecha: 2026-05-27
-- =====================================================================
-- Ejecutar UNA vez como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 006_crm_migracion.sql
-- =====================================================================

SET search_path TO bejauha, public;

-- 1) Quitar los FKs que apuntan a leads(telefono) para poder cambiar la PK
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname, conrelid::regclass AS tbl
    FROM pg_constraint
    WHERE confrelid = 'bejauha.leads'::regclass AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

-- 2) id como nueva PK + telefono UNIQUE nullable
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS id BIGSERIAL;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='bejauha.leads'::regclass AND contype='p') THEN
    EXECUTE 'ALTER TABLE bejauha.leads DROP CONSTRAINT ' ||
            (SELECT conname FROM pg_constraint WHERE conrelid='bejauha.leads'::regclass AND contype='p');
  END IF;
END $$;
ALTER TABLE bejauha.leads ADD PRIMARY KEY (id);
ALTER TABLE bejauha.leads ALTER COLUMN telefono DROP NOT NULL;
ALTER TABLE bejauha.leads ADD CONSTRAINT leads_telefono_key UNIQUE (telefono);
-- estado_outbound solo aplica a contactos de prospección (outbound); el resto va NULL
ALTER TABLE bejauha.leads ALTER COLUMN estado_outbound DROP NOT NULL;

-- 3) Columnas de CRM (de la base de seguimiento)
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS instagram     TEXT;
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS canal         VARCHAR(20);   -- whatsapp | instagram | ambos | sin_canal
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS tipificacion  VARCHAR(40);   -- las 9 tipificaciones
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS estado_be     VARCHAR(60);
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS paquete       VARCHAR(60);
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS prx_contacto  DATE;
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS ultimo_pago   DATE;

-- Dedupe de contactos solo-Instagram (sin teléfono) por su URL de perfil
CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_instagram
  ON bejauha.leads(instagram) WHERE instagram IS NOT NULL AND telefono IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_canal ON bejauha.leads(canal);
CREATE INDEX IF NOT EXISTS idx_leads_tipificacion ON bejauha.leads(tipificacion);

-- 4) Re-crear los FKs hacia leads(telefono)
ALTER TABLE bejauha.saldos_clases ADD CONSTRAINT saldos_clases_telefono_fkey
  FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono);
ALTER TABLE bejauha.recargas ADD CONSTRAINT recargas_telefono_fkey
  FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono);
ALTER TABLE bejauha.asistencias ADD CONSTRAINT asistencias_telefono_fkey
  FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono);
ALTER TABLE bejauha.handoffs ADD CONSTRAINT handoffs_telefono_fkey
  FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono);

\d bejauha.leads
