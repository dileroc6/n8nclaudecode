#!/usr/bin/env node
'use strict';

/**
 * test_shopify.js — Tests de integración contra una instancia Shopify real
 *
 * Requiere variables en .env:
 *   TEST_SHOPIFY_URL=https://tu-tienda.myshopify.com
 *   TEST_SHOPIFY_ACCESS_TOKEN=shpat_...
 *
 * Uso: node tests/integration/test_shopify.js
 *
 * Los tests crean y limpian sus propios datos.
 */

require('dotenv').config();
const adapter = require('../../adapters/shopify');

const credenciales = {
  access_token: process.env.TEST_SHOPIFY_ACCESS_TOKEN,
  url: process.env.TEST_SHOPIFY_URL
};

let productoCreado = null;

const resultados = [];

function log(nombre, ok, detalle = '') {
  const icono = ok ? '✅' : '❌';
  console.log(`${icono} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  resultados.push({ nombre, ok });
}

async function limpiar() {
  if (productoCreado?.id) {
    try {
      await adapter.eliminarProducto(String(productoCreado.id), credenciales);
    } catch {
      // ignorar errores de limpieza
    }
  }
}

async function run() {
  console.log('\n🔍 Tests de integración — Shopify\n');

  if (!credenciales.access_token || !credenciales.url) {
    console.error('❌ Faltan variables TEST_SHOPIFY_URL o TEST_SHOPIFY_ACCESS_TOKEN en .env');
    process.exit(1);
  }

  // Test 1: Listar categorías (custom collections en Shopify)
  try {
    const categorias = await adapter.listarCategorias(credenciales);
    log('listarCategorias', Array.isArray(categorias), `${categorias.length} categorías`);
  } catch (err) {
    log('listarCategorias', false, err.message);
  }

  // Test 2: Crear producto
  try {
    const datos = {
      nombre: 'Producto Test CatalogBot Shopify',
      descripcion: '<p>Producto creado por test automatizado</p>',
      precio: 99900,
      sku: `test_catalogbot_${Date.now()}`
    };
    productoCreado = await adapter.crearProducto(datos, credenciales);
    log('crearProducto', !!productoCreado?.id, `id=${productoCreado?.id}`);
  } catch (err) {
    log('crearProducto', false, err.message);
    await limpiar();
    return summarize();
  }

  // Test 3: Obtener producto
  try {
    const p = await adapter.obtenerProducto(String(productoCreado.id), credenciales);
    log('obtenerProducto', p?.id === productoCreado.id, `variantes=${p?.variantes?.length}`);
  } catch (err) {
    log('obtenerProducto', false, err.message);
  }

  // Test 4: Buscar producto
  try {
    const resultados = await adapter.buscarProducto('Producto Test CatalogBot', credenciales);
    const encontrado = resultados.some(r => r.id === productoCreado.id);
    log('buscarProducto', encontrado, `${resultados.length} resultados`);
  } catch (err) {
    log('buscarProducto', false, err.message);
  }

  // Test 5: Actualizar precio (Shopify requiere variante_id)
  try {
    const productoDetalle = await adapter.obtenerProducto(String(productoCreado.id), credenciales);
    const varianteId = productoDetalle?.variantes?.[0]?.id || productoDetalle?.variante_id;
    if (!varianteId) throw new Error('No se encontró variante_id');

    const actualizado = await adapter.actualizarPrecio(
      String(productoCreado.id), 79900, credenciales, String(varianteId)
    );
    log('actualizarPrecio', !!actualizado?.id, `variante_id=${varianteId}`);
  } catch (err) {
    log('actualizarPrecio', false, err.message);
  }

  // Test 6: Actualizar producto
  try {
    const actualizado = await adapter.actualizarProducto(
      String(productoCreado.id),
      { nombre: 'Producto Test CatalogBot Shopify (mod)' },
      credenciales
    );
    log('actualizarProducto', !!actualizado?.id, 'título actualizado');
  } catch (err) {
    log('actualizarProducto', false, err.message);
  }

  // Test 7: Crear descuento (price rule)
  try {
    const conDescuento = await adapter.crearDescuento(
      String(productoCreado.id), 'porcentaje', 10, credenciales
    );
    log('crearDescuento', !!conDescuento?.id, `descuento_id=${conDescuento?.id}`);

    // Test 8: Eliminar descuento
    try {
      await adapter.eliminarDescuento(
        String(productoCreado.id), credenciales, String(conDescuento.id)
      );
      log('eliminarDescuento', true, `descuento_id=${conDescuento.id} eliminado`);
    } catch (err) {
      log('eliminarDescuento', false, err.message);
    }
  } catch (err) {
    log('crearDescuento', false, err.message);
    log('eliminarDescuento', false, 'omitido (crearDescuento falló)');
  }

  // Test 9: Precio masivo (requiere colección real — test condicional)
  const coleccionTestId = process.env.TEST_SHOPIFY_COLECCION_ID;
  if (coleccionTestId) {
    try {
      const resultado = await adapter.precioMasivo(
        coleccionTestId, 'porcentaje_descuento', 5, credenciales
      );
      log('precioMasivo', Array.isArray(resultado), `${resultado.length} productos`);
    } catch (err) {
      log('precioMasivo', false, err.message);
    }
  } else {
    console.log('⏭  precioMasivo — omitido (TEST_SHOPIFY_COLECCION_ID no definido)');
  }

  // Test 10: Eliminar producto (limpieza)
  try {
    await adapter.eliminarProducto(String(productoCreado.id), credenciales);
    log('eliminarProducto', true, `id=${productoCreado.id} eliminado`);
    productoCreado = null;
  } catch (err) {
    log('eliminarProducto', false, err.message);
  }

  await limpiar();
  summarize();
}

function summarize() {
  const total = resultados.length;
  const ok = resultados.filter(r => r.ok).length;
  const fail = total - ok;
  console.log(`\n${ fail === 0 ? '✅' : '❌'} ${ok}/${total} tests pasaron\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Error inesperado:', err);
  limpiar().then(() => process.exit(1));
});
