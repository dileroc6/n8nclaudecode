'use strict';

/**
 * Adapter WooCommerce REST API v3
 * Implementa la interfaz común de CatalogBot
 *
 * Autenticación: Basic Auth con consumer_key y consumer_secret
 * (generados en WooCommerce > Ajustes > Avanzado > REST API)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const ERROR_MAP = {
  400: 'La solicitud tiene datos inválidos.',
  401: 'Credenciales de WooCommerce incorrectas. Verificar consumer_key y consumer_secret.',
  403: 'Sin permisos suficientes en WooCommerce. Verificar permisos de la API key.',
  404: 'Producto o recurso no encontrado en WooCommerce.',
  409: 'Conflicto con el estado actual del recurso en WooCommerce.',
  422: 'Los datos enviados no son válidos para WooCommerce.',
  429: 'Demasiadas solicitudes a WooCommerce. Intentar más tarde.',
  500: 'Error interno de WooCommerce. Contactar al administrador de la tienda.'
};

function traducirError(status, wcMessage) {
  const base = ERROR_MAP[status] || `Error de WooCommerce (${status}).`;
  if (wcMessage && typeof wcMessage === 'string') {
    const clean = wcMessage.replace(/<[^>]+>/g, '').substring(0, 100);
    return `${base} Detalle: ${clean}`;
  }
  return base;
}

function buildBasicAuth(consumerKey, consumerSecret) {
  return 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
}

async function request(baseUrl, path, method, credenciales, body = null) {
  const url = new URL(`${baseUrl}/wp-json/wc/v3${path}`);
  const isHttps = url.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: {
      'Authorization': buildBasicAuth(credenciales.consumer_key, credenciales.consumer_secret),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const msg = parsed.message || parsed.data?.message || '';
            reject(new Error(traducirError(res.statusCode, msg)));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error('Respuesta inválida de WooCommerce'));
        }
      });
    });

    req.on('error', err => reject(new Error(`Error de conexión con WooCommerce: ${err.message}`)));

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getAllPages(baseUrl, path, credenciales) {
  const results = [];
  let page = 1;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const items = await request(baseUrl, `${path}${separator}per_page=100&page=${page}`, 'GET', credenciales);

    if (!Array.isArray(items) || items.length === 0) break;
    results.push(...items);
    if (items.length < 100) break;
    page++;
  }

  return results;
}

const woocommerce = {
  /**
   * Busca productos por nombre, SKU o descripción
   * @returns {Array} lista de productos con id, name, price, sku
   */
  async buscarProducto(query, credenciales) {
    const results = await request(
      credenciales.url,
      `/products?search=${encodeURIComponent(query)}&per_page=10&status=any`,
      'GET',
      credenciales
    );
    return results.map(p => ({
      id: String(p.id),
      nombre: p.name,
      precio: parseFloat(p.price) || 0,
      precio_regular: parseFloat(p.regular_price) || 0,
      precio_venta: parseFloat(p.sale_price) || null,
      sku: p.sku || null,
      estado: p.status,
      tiene_variantes: p.variations && p.variations.length > 0
    }));
  },

  /**
   * Obtiene detalle completo de un producto incluyendo variantes
   */
  async obtenerProducto(id, credenciales) {
    const p = await request(credenciales.url, `/products/${id}`, 'GET', credenciales);

    let variantes = [];
    if (p.variations && p.variations.length > 0) {
      variantes = await request(credenciales.url, `/products/${id}/variations?per_page=100`, 'GET', credenciales);
      variantes = variantes.map(v => ({
        id: String(v.id),
        atributos: v.attributes.map(a => `${a.name}: ${a.option}`).join(', '),
        precio: parseFloat(v.price) || 0,
        sku: v.sku || null,
        stock: v.stock_quantity
      }));
    }

    return {
      id: String(p.id),
      nombre: p.name,
      descripcion: p.description.replace(/<[^>]+>/g, ''),
      precio: parseFloat(p.price) || 0,
      precio_regular: parseFloat(p.regular_price) || 0,
      precio_venta: parseFloat(p.sale_price) || null,
      sku: p.sku || null,
      categorias: p.categories.map(c => ({ id: String(c.id), nombre: c.name })),
      imagenes: p.images.map(i => i.src),
      estado: p.status,
      variantes
    };
  },

  /**
   * Crea un nuevo producto
   */
  async crearProducto(datos, credenciales) {
    const body = {
      name: datos.nombre,
      description: datos.descripcion || '',
      regular_price: String(datos.precio),
      status: 'publish',
      categories: datos.categoria_id ? [{ id: parseInt(datos.categoria_id) }] : []
    };

    if (datos.sku) body.sku = datos.sku;
    if (datos.imagen_url) body.images = [{ src: datos.imagen_url }];

    const p = await request(credenciales.url, '/products', 'POST', credenciales, body);
    return { id: String(p.id), nombre: p.name, estado: p.status };
  },

  /**
   * Actualiza campos generales de un producto (no precio — usar actualizarPrecio)
   */
  async actualizarProducto(id, campos, credenciales) {
    const body = {};
    if (campos.nombre) body.name = campos.nombre;
    if (campos.descripcion !== undefined) body.description = campos.descripcion;
    if (campos.sku !== undefined) body.sku = campos.sku;
    if (campos.estado) body.status = campos.estado;
    if (campos.categoria_id) body.categories = [{ id: parseInt(campos.categoria_id) }];
    if (campos.imagen_url) body.images = [{ src: campos.imagen_url }];

    const p = await request(credenciales.url, `/products/${id}`, 'PUT', credenciales, body);
    return { id: String(p.id), nombre: p.name };
  },

  /**
   * Elimina un producto (mover a papelera en WooCommerce)
   */
  async eliminarProducto(id, credenciales) {
    await request(credenciales.url, `/products/${id}?force=false`, 'DELETE', credenciales);
    return { eliminado: true };
  },

  /**
   * Lista todas las categorías disponibles
   */
  async listarCategorias(credenciales) {
    const cats = await getAllPages(credenciales.url, '/products/categories', credenciales);
    return cats.map(c => ({ id: String(c.id), nombre: c.name, padre_id: c.parent ? String(c.parent) : null }));
  },

  /**
   * Actualiza el precio de un producto o variante específica
   */
  async actualizarPrecio(id, precio, credenciales, varianteId = null) {
    const body = { regular_price: String(precio) };
    const path = varianteId
      ? `/products/${id}/variations/${varianteId}`
      : `/products/${id}`;

    const p = await request(credenciales.url, path, 'PUT', credenciales, body);
    return { id: String(p.id), precio_nuevo: parseFloat(p.regular_price) };
  },

  /**
   * Crea un descuento en el producto
   * tipo: porcentaje | monto_fijo | precio_especial
   */
  async crearDescuento(id, tipo, valor, credenciales, fechas = {}) {
    const producto = await this.obtenerProducto(id, credenciales);
    let precioVenta;

    if (tipo === 'porcentaje') {
      precioVenta = (producto.precio_regular * (1 - valor / 100)).toFixed(2);
    } else if (tipo === 'monto_fijo') {
      precioVenta = (producto.precio_regular - valor).toFixed(2);
      if (parseFloat(precioVenta) <= 0) throw new Error('El descuento supera el precio del producto');
    } else if (tipo === 'precio_especial') {
      precioVenta = String(valor);
    } else {
      throw new Error(`Tipo de descuento desconocido: ${tipo}`);
    }

    const body = {
      sale_price: String(precioVenta),
      date_on_sale_from: fechas.fecha_inicio || null,
      date_on_sale_to: fechas.fecha_fin || null
    };

    const p = await request(credenciales.url, `/products/${id}`, 'PUT', credenciales, body);
    return {
      id: String(p.id),
      precio_venta: parseFloat(p.sale_price),
      fecha_desde: p.date_on_sale_from_gmt,
      fecha_hasta: p.date_on_sale_to_gmt
    };
  },

  /**
   * Elimina el precio de venta/descuento activo
   */
  async eliminarDescuento(id, credenciales, descuentoId = null) {
    const body = { sale_price: '', date_on_sale_from: null, date_on_sale_to: null };
    await request(credenciales.url, `/products/${id}`, 'PUT', credenciales, body);
    return { descuento_eliminado: true };
  },

  /**
   * Actualiza precio masivo de todos los productos de una categoría
   * Límite: 100 productos. tipo: porcentaje_aumento | porcentaje_descuento | precio_fijo
   */
  async precioMasivo(categoriaId, tipo, valor, credenciales) {
    const productos = await request(
      credenciales.url,
      `/products?category=${categoriaId}&per_page=100&status=publish`,
      'GET',
      credenciales
    );

    if (productos.length > 100) {
      throw new Error(`La categoría tiene ${productos.length} productos. El límite es 100. Dividir por subcategoría.`);
    }

    const resultados = [];
    for (const p of productos) {
      try {
        const precioActual = parseFloat(p.regular_price) || 0;
        let precioNuevo;

        if (tipo === 'porcentaje_aumento') {
          precioNuevo = (precioActual * (1 + valor / 100)).toFixed(2);
        } else if (tipo === 'porcentaje_descuento') {
          precioNuevo = (precioActual * (1 - valor / 100)).toFixed(2);
        } else if (tipo === 'precio_fijo') {
          precioNuevo = String(valor);
        } else {
          throw new Error(`Tipo de cambio desconocido: ${tipo}`);
        }

        await request(credenciales.url, `/products/${p.id}`, 'PUT', credenciales, { regular_price: String(precioNuevo) });
        resultados.push({ id: String(p.id), nombre: p.name, precio_anterior: precioActual, precio_nuevo: parseFloat(precioNuevo) });

        // Pausa breve para no saturar WooCommerce
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        resultados.push({ id: String(p.id), nombre: p.name, error: err.message });
      }
    }

    const exitosos = resultados.filter(r => !r.error).length;
    const errores = resultados.filter(r => r.error).length;
    return { total: productos.length, exitosos, errores, detalle: resultados };
  }
};

module.exports = woocommerce;
