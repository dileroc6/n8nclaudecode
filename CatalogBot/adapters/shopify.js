'use strict';

/**
 * Adapter Shopify Admin API 2024-01
 * Implementa la interfaz común de CatalogBot
 *
 * Autenticación: Header X-Shopify-Access-Token
 * Los precios en Shopify van en variants, no en el producto raíz
 */

const https = require('https');
const { URL } = require('url');

const SHOPIFY_API_VERSION = '2024-01';

function traducirError(status, shopifyErrors) {
  const msgs = {
    401: 'Token de acceso de Shopify inválido o expirado.',
    403: 'Sin permisos para esta operación en Shopify.',
    404: 'Producto o recurso no encontrado en Shopify.',
    422: 'Datos inválidos para Shopify.',
    429: 'Límite de solicitudes de Shopify alcanzado. Reintentando...',
    500: 'Error interno de Shopify. Contactar soporte.'
  };

  const base = msgs[status] || `Error de Shopify (${status}).`;

  if (shopifyErrors) {
    const detail = typeof shopifyErrors === 'string'
      ? shopifyErrors
      : JSON.stringify(shopifyErrors).substring(0, 100);
    return `${base} Detalle: ${detail}`;
  }

  return base;
}

async function request(shop, accessToken, path, method, body = null, retryCount = 0) {
  const url = new URL(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}${path}`);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', async () => {
        // Rate limiting: esperar y reintentar hasta 3 veces
        if (res.statusCode === 429 && retryCount < 3) {
          const retryAfter = parseInt(res.headers['retry-after'] || '2') * 1000;
          await new Promise(r => setTimeout(r, retryAfter));
          try {
            resolve(await request(shop, accessToken, path, method, body, retryCount + 1));
          } catch (err) {
            reject(err);
          }
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const errors = parsed.errors || parsed.error || '';
            reject(new Error(traducirError(res.statusCode, errors)));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error('Respuesta inválida de Shopify'));
        }
      });
    });

    req.on('error', err => reject(new Error(`Error de conexión con Shopify: ${err.message}`)));

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getAllPages(shop, accessToken, path) {
  const results = [];
  let url = `${path}${path.includes('?') ? '&' : '?'}limit=250`;

  while (url) {
    const res = await request(shop, accessToken, url, 'GET');
    const key = Object.keys(res)[0];
    const items = res[key];
    if (!Array.isArray(items)) break;
    results.push(...items);

    // Shopify usa link headers para paginación; simplificamos con limit=250
    if (items.length < 250) break;
    break; // Sin cursor real en esta implementación; ajustar si se necesita paginación completa
  }

  return results;
}

function mapProducto(p) {
  const variant = p.variants && p.variants[0];
  return {
    id: String(p.id),
    nombre: p.title,
    descripcion: p.body_html ? p.body_html.replace(/<[^>]+>/g, '') : '',
    precio: variant ? parseFloat(variant.price) : 0,
    precio_comparacion: variant ? parseFloat(variant.compare_at_price || 0) : 0,
    sku: variant ? variant.sku : null,
    categorias: p.product_type ? [{ id: p.product_type, nombre: p.product_type }] : [],
    imagenes: (p.images || []).map(i => i.src),
    estado: p.status,
    tiene_variantes: (p.variants || []).length > 1,
    variantes: (p.variants || []).map(v => ({
      id: String(v.id),
      atributos: [v.option1, v.option2, v.option3].filter(Boolean).join(' / '),
      precio: parseFloat(v.price),
      sku: v.sku || null,
      stock: v.inventory_quantity
    }))
  };
}

const shopify = {
  /**
   * Busca productos por título
   */
  async buscarProducto(query, credenciales) {
    const res = await request(
      credenciales.shop,
      credenciales.access_token,
      `/products.json?title=${encodeURIComponent(query)}&limit=10`,
      'GET'
    );
    return (res.products || []).map(p => ({
      id: String(p.id),
      nombre: p.title,
      precio: p.variants && p.variants[0] ? parseFloat(p.variants[0].price) : 0,
      sku: p.variants && p.variants[0] ? p.variants[0].sku : null,
      estado: p.status,
      tiene_variantes: (p.variants || []).length > 1
    }));
  },

  /**
   * Obtiene detalle completo con variantes
   */
  async obtenerProducto(id, credenciales) {
    const res = await request(
      credenciales.shop,
      credenciales.access_token,
      `/products/${id}.json`,
      'GET'
    );
    return mapProducto(res.product);
  },

  /**
   * Crea un nuevo producto
   */
  async crearProducto(datos, credenciales) {
    const body = {
      product: {
        title: datos.nombre,
        body_html: datos.descripcion || '',
        product_type: datos.categoria_id || '',
        status: 'active',
        variants: [{ price: String(datos.precio), sku: datos.sku || '' }]
      }
    };

    if (datos.imagen_url) {
      body.product.images = [{ src: datos.imagen_url }];
    }

    const res = await request(credenciales.shop, credenciales.access_token, '/products.json', 'POST', body);
    return { id: String(res.product.id), nombre: res.product.title, estado: res.product.status };
  },

  /**
   * Actualiza campos generales (no precio — usar actualizarPrecio)
   */
  async actualizarProducto(id, campos, credenciales) {
    const product = {};
    if (campos.nombre) product.title = campos.nombre;
    if (campos.descripcion !== undefined) product.body_html = campos.descripcion;
    if (campos.estado) product.status = campos.estado;
    if (campos.categoria_id) product.product_type = campos.categoria_id;
    if (campos.imagen_url) product.images = [{ src: campos.imagen_url }];

    const res = await request(
      credenciales.shop, credenciales.access_token,
      `/products/${id}.json`, 'PUT', { product }
    );
    return { id: String(res.product.id), nombre: res.product.title };
  },

  /**
   * Elimina un producto de Shopify
   */
  async eliminarProducto(id, credenciales) {
    await request(credenciales.shop, credenciales.access_token, `/products/${id}.json`, 'DELETE');
    return { eliminado: true };
  },

  /**
   * Lista categorías (custom collections en Shopify)
   */
  async listarCategorias(credenciales) {
    const custom = await getAllPages(credenciales.shop, credenciales.access_token, '/custom_collections.json');
    const smart = await getAllPages(credenciales.shop, credenciales.access_token, '/smart_collections.json');
    return [
      ...custom.map(c => ({ id: String(c.id), nombre: c.title, tipo: 'custom' })),
      ...smart.map(c => ({ id: String(c.id), nombre: c.title, tipo: 'smart' }))
    ];
  },

  /**
   * Actualiza precio de una variante específica
   * En Shopify el precio SIEMPRE va en la variante, no en el producto
   */
  async actualizarPrecio(id, precio, credenciales, varianteId = null) {
    if (varianteId) {
      const res = await request(
        credenciales.shop, credenciales.access_token,
        `/variants/${varianteId}.json`, 'PUT',
        { variant: { id: parseInt(varianteId), price: String(precio) } }
      );
      return { id: String(res.variant.id), precio_nuevo: parseFloat(res.variant.price) };
    }

    // Sin varianteId: actualizar primera variante
    const producto = await this.obtenerProducto(id, credenciales);
    if (!producto.variantes || producto.variantes.length === 0) {
      throw new Error('El producto no tiene variantes para actualizar el precio');
    }

    const primeraVarianteId = producto.variantes[0].id;
    const res = await request(
      credenciales.shop, credenciales.access_token,
      `/variants/${primeraVarianteId}.json`, 'PUT',
      { variant: { id: parseInt(primeraVarianteId), price: String(precio) } }
    );
    return { id: String(res.variant.id), precio_nuevo: parseFloat(res.variant.price) };
  },

  /**
   * Crea un descuento usando compare_at_price para mostrar precio tachado
   */
  async crearDescuento(id, tipo, valor, credenciales, fechas = {}) {
    const producto = await this.obtenerProducto(id, credenciales);
    const variante = producto.variantes[0];
    if (!variante) throw new Error('Producto sin variantes');

    let precioVenta;
    const precioBase = variante.precio;

    if (tipo === 'porcentaje') {
      precioVenta = (precioBase * (1 - valor / 100)).toFixed(2);
    } else if (tipo === 'monto_fijo') {
      precioVenta = (precioBase - valor).toFixed(2);
      if (parseFloat(precioVenta) <= 0) throw new Error('El descuento supera el precio del producto');
    } else if (tipo === 'precio_especial') {
      precioVenta = String(valor);
    } else {
      throw new Error(`Tipo de descuento desconocido: ${tipo}`);
    }

    const res = await request(
      credenciales.shop, credenciales.access_token,
      `/variants/${variante.id}.json`, 'PUT',
      { variant: { id: parseInt(variante.id), price: String(precioVenta), compare_at_price: String(precioBase) } }
    );

    return {
      id: String(res.variant.id),
      precio_venta: parseFloat(res.variant.price),
      precio_comparacion: parseFloat(res.variant.compare_at_price)
    };
  },

  /**
   * Elimina descuento limpiando compare_at_price
   */
  async eliminarDescuento(id, credenciales, descuentoId = null) {
    const producto = await this.obtenerProducto(id, credenciales);
    const varianteId = descuentoId || (producto.variantes[0] && producto.variantes[0].id);
    if (!varianteId) throw new Error('No se encontró la variante para eliminar el descuento');

    await request(
      credenciales.shop, credenciales.access_token,
      `/variants/${varianteId}.json`, 'PUT',
      { variant: { id: parseInt(varianteId), compare_at_price: null } }
    );
    return { descuento_eliminado: true };
  },

  /**
   * Actualiza precio masivo por colección
   * Máx 100 productos. Maneja rate limiting con lotes de 10
   */
  async precioMasivo(categoriaId, tipo, valor, credenciales) {
    const res = await request(
      credenciales.shop, credenciales.access_token,
      `/collections/${categoriaId}/products.json?limit=100`,
      'GET'
    );

    const productos = res.products || [];
    if (productos.length > 100) {
      throw new Error(`La colección tiene ${productos.length} productos. El límite es 100. Dividir por subcolección.`);
    }

    const resultados = [];
    const loteSize = 10;

    for (let i = 0; i < productos.length; i += loteSize) {
      const lote = productos.slice(i, i + loteSize);

      for (const p of lote) {
        try {
          const variant = p.variants && p.variants[0];
          if (!variant) continue;

          const precioActual = parseFloat(variant.price) || 0;
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

          await request(
            credenciales.shop, credenciales.access_token,
            `/variants/${variant.id}.json`, 'PUT',
            { variant: { id: variant.id, price: String(precioNuevo) } }
          );

          resultados.push({
            id: String(p.id),
            nombre: p.title,
            precio_anterior: precioActual,
            precio_nuevo: parseFloat(precioNuevo)
          });
        } catch (err) {
          resultados.push({ id: String(p.id), nombre: p.title, error: err.message });
        }
      }

      // Pausa entre lotes para respetar rate limit
      if (i + loteSize < productos.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const exitosos = resultados.filter(r => !r.error).length;
    const errores = resultados.filter(r => r.error).length;
    return { total: productos.length, exitosos, errores, detalle: resultados };
  }
};

module.exports = shopify;
