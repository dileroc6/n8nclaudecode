#!/usr/bin/env node
'use strict';

/**
 * test_woocommerce.js — Tests de integración contra una instancia WooCommerce real
 *
 * Requiere variables en .env:
 *   TEST_WC_URL=https://tu-tienda.com
 *   TEST_WC_CONSUMER_KEY=ck_...
 *   TEST_WC_CONSUMER_SECRET=cs_...
 *
 * Uso: node tests/integration/test_woocommerce.js
 *
 * Los tests crean y limpian sus propios datos (SKU prefijado con "test_catalogbot_").
 */

require('dotenv').config();
const adapter = require('../../adapters/woocommerce');

const credenciales = {
  consumer_key: process.env.TEST_WC_CONSUMER_KEY,
  consumer_secret: process.env.TEST_WC_CONSUMER_SECRET,
  url: process.env.TEST_WC_URL
};

const SKU_TEST = `test_catalogbot_${Date.now()}`;
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
  console.log('\n🔍 Tests de integración — WooCommerce\n');

  if (!credenciales.consumer_key || !credenciales.consumer_secret || !credenciales.url) {
    console.error('❌ Faltan variables TEST_WC_URL, TEST_WC_CONSUMER_KEY o TEST_WC_CONSUMER_SECRET en .env');
    process.exit(1);
  }

  // Test 1: Listar categorías
  try {
    const categorias = await adapter.listarCategorias(credenciales);
    log('listarCategorias', Array.isArray(categorias), `${categorias.length} categorías`);
  } catch (err) {
    log('listarCategorias', false, err.message);
  }

  // Test 2: Crear producto
  try {
    const datos = {
      nombre: 'Producto Test CatalogBot',
      descripcion: 'Producto creado por test automatizado',
      precio: 99900,
      sku: SKU_TEST
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
    log('obtenerProducto', p?.id === productoCreado.id, `sku=${p?.sku}`);
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

  // Test 5: Actualizar precio
  try {
    const actualizado = await adapter.actualizarPrecio(
      String(productoCreado.id), 79900, credenciales
    );
    const precioOk = parseFloat(actualizado.regular_price || actualizado.precio) === 79900;
    log('actualizarPrecio', precioOk, `precio=${actualizado.regular_price || actualizado.precio}`);
  } catch (err) {
    log('actualizarPrecio', false, err.message);
  }

  // Test 6: Actualizar producto (nombre)
  try {
    const actualizado = await adapter.actualizarProducto(
      String(productoCreado.id),
      { nombre: 'Producto Test CatalogBot (modificado)' },
      credenciales
    );
    log('actualizarProducto', !!actualizado?.id, `nombre actualizado`);
  } catch (err) {
    log('actualizarProducto', false, err.message);
  }

  // Test 7: Crear descuento
  try {
    const conDescuento = await adapter.crearDescuento(
      String(productoCreado.id), 'porcentaje', 10, credenciales
    );
    log('crearDescuento', !!conDescuento?.id, `sale_price=${conDescuento?.sale_price}`);
  } catch (err) {
    log('crearDescuento', false, err.message);
  }

  // Test 8: Eliminar descuento
  try {
    const sinDescuento = await adapter.eliminarDescuento(
      String(productoCreado.id), credenciales
    );
    const saleVacia = !sinDescuento.sale_price || sinDescuento.sale_price === '';
    log('eliminarDescuento', saleVacia, `sale_price="${sinDescuento?.sale_price}"`);
  } catch (err) {
    log('eliminarDescuento', false, err.message);
  }

  // Test 9: Precio masivo (requiere categoría real — test condicional)
  const categoriaTestId = process.env.TEST_WC_CATEGORIA_ID;
  if (categoriaTestId) {
    try {
      const resultado = await adapter.precioMasivo(
        categoriaTestId, 'porcentaje_descuento', 5, credenciales
      );
      log('precioMasivo', Array.isArray(resultado), `${resultado.length} productos`);
    } catch (err) {
      log('precioMasivo', false, err.message);
    }
  } else {
    console.log('⏭  precioMasivo — omitido (TEST_WC_CATEGORIA_ID no definido)');
  }

  // Test 10: Eliminar producto (limpieza)
  try {
    await adapter.eliminarProducto(String(productoCreado.id), credenciales);
    log('eliminarProducto', true, `id=${productoCreado.id} eliminado`);
    productoCreado = null;
  } catch (err) {
    log('eliminarProducto', false, err.message);
  }

  // Limpieza de seguridad
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
