-- =====================================================================
-- Savia Wear — Sales Agent
-- Schema PostgreSQL: savia
-- DB target: leadai (instancia compartida en VPS Hostinger)
-- Versión: 001 (Sprint 1 — cimientos)
-- Fecha:   2026-05-12
-- =====================================================================
-- Ejecutar como usuario con privilegio CREATE en la DB leadai.
-- Idempotente: usa IF NOT EXISTS y ON CONFLICT cuando aplica.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS savia;

SET search_path TO savia, public;

-- ---------------------------------------------------------------------
-- 1. clientes — identidad estable del lead (PK = teléfono normalizado)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.clientes (
  telefono          VARCHAR(20)  PRIMARY KEY,        -- E.164 sin '+': '573001234567'
  nombre            VARCHAR(120),
  email             VARCHAR(160),
  idioma            CHAR(2)      NOT NULL DEFAULT 'es',
  primer_contacto   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ultimo_contacto   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  habeas_data_at    TIMESTAMPTZ,                     -- timestamp de aceptación Ley 1581
  opt_out_marketing BOOLEAN      NOT NULL DEFAULT FALSE,
  metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_ultimo_contacto
  ON savia.clientes(ultimo_contacto DESC);

-- ---------------------------------------------------------------------
-- 2. mensajes_logs — log append-only (escritura caliente, lectura ocasional)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.mensajes_logs (
  id          BIGSERIAL    PRIMARY KEY,
  ts          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  telefono    VARCHAR(20)  NOT NULL,
  direccion   CHAR(3)      NOT NULL CHECK (direccion IN ('in', 'out')),
  canal       VARCHAR(20)  NOT NULL DEFAULT 'whatsapp_cloud',
  texto       TEXT,
  media_url   TEXT,
  intent      VARCHAR(40),                            -- saludo|consulta_producto|consulta_talla|objecion_estilo|intencion_compra|pago_pregunta|queja|otro
  pedido_id   BIGINT,                                 -- FK opcional cuando aplica
  metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mensajes_logs_tel_ts
  ON savia.mensajes_logs(telefono, ts DESC);

CREATE INDEX IF NOT EXISTS idx_mensajes_logs_fecha
  ON savia.mensajes_logs(ts);

CREATE INDEX IF NOT EXISTS idx_mensajes_logs_intent
  ON savia.mensajes_logs(intent)
  WHERE intent IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. contactos_dia — índice de contactos únicos por día (base del contador)
-- ---------------------------------------------------------------------
-- PK compuesta permite INSERT ... ON CONFLICT DO NOTHING idempotente
-- y COUNT(*) WHERE fecha = today con index-only scan.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.contactos_dia (
  fecha       DATE         NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  primer_ts   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (fecha, telefono)
);

-- ---------------------------------------------------------------------
-- 4. metricas_dia — agregados de operación (upsert por mensaje)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.metricas_dia (
  fecha                       DATE         PRIMARY KEY,
  contactos_unicos            INT          NOT NULL DEFAULT 0,
  mensajes_total              INT          NOT NULL DEFAULT 0,
  pedidos_link_generado       INT          NOT NULL DEFAULT 0,
  pedidos_pago_confirmado     INT          NOT NULL DEFAULT 0,
  pedidos_pago_rechazado      INT          NOT NULL DEFAULT 0,
  tarifa_premium_activada_ts  TIMESTAMPTZ,                -- NULL hasta que se cruce el umbral
  notas                       TEXT,
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. pedidos — vida del pedido desde generación de link hasta confirmación
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.pedidos (
  id                    BIGSERIAL    PRIMARY KEY,
  telefono              VARCHAR(20)  NOT NULL REFERENCES savia.clientes(telefono),
  woo_product_id        BIGINT       NOT NULL,
  woo_variation_id      BIGINT,                              -- si es variante (talla/color)
  producto_nombre       VARCHAR(200) NOT NULL,
  talla                 VARCHAR(20),
  color                 VARCHAR(40),
  precio_cop            NUMERIC(10,0) NOT NULL,              -- COP no usa decimales
  cantidad              INT          NOT NULL DEFAULT 1,
  estado                VARCHAR(20)  NOT NULL DEFAULT 'link_generado'
                          CHECK (estado IN ('link_generado','pago_confirmado','pago_rechazado','expirado','cancelado')),
  woo_order_id          BIGINT,                              -- ID del pedido en WooCommerce
  pago_url              TEXT,                                -- URL de checkout WooCommerce/Mercado Pago
  mp_transaction_id     VARCHAR(80),                         -- ID de transacción Mercado Pago
  pago_reference        VARCHAR(80),                         -- nuestra referencia interna (SAVIA-tel-ts)
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  pago_at               TIMESTAMPTZ,
  expira_at             TIMESTAMPTZ  NOT NULL DEFAULT (now() + interval '48 hours'),
  metadata              JSONB        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pedidos_telefono
  ON savia.pedidos(telefono);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado
  ON savia.pedidos(estado);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pedidos_woo_order_id
  ON savia.pedidos(woo_order_id)
  WHERE woo_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_pago_ref
  ON savia.pedidos(pago_reference)
  WHERE pago_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_expira
  ON savia.pedidos(expira_at)
  WHERE estado = 'link_generado';

-- FK desde mensajes_logs hacia pedidos (declarada después por orden de creación)
ALTER TABLE savia.mensajes_logs
  DROP CONSTRAINT IF EXISTS fk_mensajes_pedido;
ALTER TABLE savia.mensajes_logs
  ADD CONSTRAINT fk_mensajes_pedido
  FOREIGN KEY (pedido_id) REFERENCES savia.pedidos(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 6. fichas_producto — cache curado de atributos Woo (anti-alucinación)
-- ---------------------------------------------------------------------
-- Se sincroniza desde WooCommerce REST API por un workflow cron (Sprint 1.5).
-- El AI Agent consulta SOLO esta tabla para responder talla/material.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.fichas_producto (
  woo_product_id    BIGINT       PRIMARY KEY,
  nombre            VARCHAR(200) NOT NULL,
  slug              VARCHAR(200) NOT NULL,
  linea             VARCHAR(40),                       -- Terra | Natura | Esencia | Equilibrio
  categoria         VARCHAR(40),                       -- Tops | Leggings | Sets
  descripcion_corta TEXT,
  materiales        TEXT,                              -- texto libre — composición tela
  tallas_disponibles JSONB,                            -- ['XS','S','M','L','XL']
  guia_tallas_json  JSONB,                             -- mapa medida→cm por talla
  precio_cop        NUMERIC(10,0) NOT NULL,
  stock_total       INT          NOT NULL DEFAULT 0,
  url_imagen        TEXT,
  url_producto      TEXT,
  variaciones       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  -- [{ variation_id, talla, color, stock, sku }]
  sincronizado_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fichas_categoria
  ON savia.fichas_producto(categoria);

CREATE INDEX IF NOT EXISTS idx_fichas_linea
  ON savia.fichas_producto(linea);

CREATE INDEX IF NOT EXISTS idx_fichas_stock
  ON savia.fichas_producto(stock_total)
  WHERE stock_total > 0;

-- ---------------------------------------------------------------------
-- 7. kb_documentos — knowledge base de marca (políticas, FAQ)
-- ---------------------------------------------------------------------
-- Consultado por el AI Agent vía tool kb_consultar(pregunta).
-- En Sprint 2 se puede activar pgvector para búsqueda semántica.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.kb_documentos (
  id           SERIAL       PRIMARY KEY,
  topico       VARCHAR(60)  NOT NULL,                  -- envios | cambios | devoluciones | tallaje | materiales | garantia | contacto
  titulo       VARCHAR(160) NOT NULL,
  contenido    TEXT         NOT NULL,
  keywords     TEXT[],                                  -- para búsqueda simple por palabra clave
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_topico
  ON savia.kb_documentos(topico)
  WHERE activo = TRUE;

CREATE INDEX IF NOT EXISTS idx_kb_keywords
  ON savia.kb_documentos USING GIN (keywords)
  WHERE activo = TRUE;

-- ---------------------------------------------------------------------
-- 8. eventos_pago — log de webhooks WooCommerce Order updated (idempotencia + auditoría)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savia.eventos_pago (
  id                BIGSERIAL    PRIMARY KEY,
  evento_id         VARCHAR(80)  UNIQUE,                -- X-WC-Webhook-Delivery-ID (idempotencia)
  woo_order_id      BIGINT,                             -- ID del pedido en WooCommerce
  woo_status        VARCHAR(20),                        -- processing|cancelled|refunded|on-hold
  mp_transaction_id VARCHAR(80),                        -- transaction_id de Mercado Pago (si aplica)
  monto_cop         NUMERIC(10,0),
  payload           JSONB        NOT NULL,
  signature_ok      BOOLEAN      NOT NULL,
  recibido_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_pago_order
  ON savia.eventos_pago(woo_order_id)
  WHERE woo_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eventos_pago_mp_tx
  ON savia.eventos_pago(mp_transaction_id)
  WHERE mp_transaction_id IS NOT NULL;

-- =====================================================================
-- Helpers SQL — fragmentos reutilizables por n8n
-- =====================================================================
--
-- (A) Registrar contacto del día + incrementar contador atómicamente:
--
--   WITH nuevo AS (
--     INSERT INTO savia.contactos_dia (fecha, telefono)
--     VALUES (CURRENT_DATE, $1)
--     ON CONFLICT DO NOTHING
--     RETURNING telefono
--   )
--   INSERT INTO savia.metricas_dia (fecha, contactos_unicos, mensajes_total)
--   VALUES (
--     CURRENT_DATE,
--     CASE WHEN EXISTS (SELECT 1 FROM nuevo) THEN 1 ELSE 0 END,
--     1
--   )
--   ON CONFLICT (fecha) DO UPDATE
--     SET contactos_unicos = savia.metricas_dia.contactos_unicos
--                            + CASE WHEN EXISTS (SELECT 1 FROM nuevo) THEN 1 ELSE 0 END,
--         mensajes_total   = savia.metricas_dia.mensajes_total + 1,
--         updated_at       = now()
--   RETURNING contactos_unicos, tarifa_premium_activada_ts;
--
-- (B) Marcar tarifa premium (idempotente):
--
--   UPDATE savia.metricas_dia
--   SET tarifa_premium_activada_ts = now()
--   WHERE fecha = CURRENT_DATE
--     AND tarifa_premium_activada_ts IS NULL
--     AND contactos_unicos > $1   -- umbral configurable
--   RETURNING contactos_unicos, mensajes_total,
--             pedidos_link_generado, pedidos_pago_confirmado;
--
-- (C) Expirar pedidos viejos (cron diario):
--
--   UPDATE savia.pedidos
--   SET estado = 'expirado'
--   WHERE estado = 'link_generado'
--     AND expira_at < now();
--
-- =====================================================================
