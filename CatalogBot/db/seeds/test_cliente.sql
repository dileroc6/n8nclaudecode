-- =============================================================================
-- Seed: Cliente de prueba para desarrollo local
-- NUNCA ejecutar en producción
-- Ejecutar DESPUÉS de provision_cliente.js con cliente_id = cli_test
-- =============================================================================

-- Registrar cliente de prueba en tabla maestra
INSERT INTO public.clientes (
  cliente_id,
  nombre,
  activo,
  ecommerce_tipo,
  ecommerce_url,
  n8n_credential_name,
  cloudinary_folder,
  whatsapp_instance,
  webhook_secret
) VALUES (
  'cli_test',
  'Cliente de Prueba (DEV)',
  true,
  'woocommerce',
  'https://demo.tutienda.com',
  'cli_test_woocommerce',
  'cli_test',
  'instancia_test',
  'secreto_webhook_dev_no_usar_en_produccion'
) ON CONFLICT (cliente_id) DO NOTHING;

-- Usuarios de prueba con cada rol
INSERT INTO cli_test.usuarios (telefono, nombre, rol, activo) VALUES
  ('573001111111', 'Admin Test',  'admin',  true),
  ('573002222222', 'Editor Test', 'editor', true),
  ('573003333333', 'Viewer Test', 'viewer', true)
ON CONFLICT (telefono) DO NOTHING;

-- Sesión inicial en estado idle para el admin de prueba
INSERT INTO cli_test.sesiones (telefono, estado) VALUES
  ('573001111111', 'idle'),
  ('573002222222', 'idle'),
  ('573003333333', 'idle')
ON CONFLICT (telefono) DO NOTHING;

-- Registro de auditoría de ejemplo
INSERT INTO cli_test.auditoria (
  telefono, usuario_nombre, rol, accion,
  producto_id, producto_nombre, campo,
  valor_anterior, valor_nuevo
) VALUES (
  '573001111111', 'Admin Test', 'admin', 'actualizar_precio',
  'PROD-001', 'Producto Demo', 'precio',
  '50000', '45000'
);

-- Cambio programado de ejemplo
INSERT INTO cli_test.programados (
  timestamp_ejecucion, telefono, accion, datos_json, estado
) VALUES (
  NOW() + INTERVAL '1 hour',
  '573001111111',
  'actualizar_precio',
  '{"producto_id": "PROD-001", "precio": 40000, "cliente_id": "cli_test"}',
  'pendiente'
);
