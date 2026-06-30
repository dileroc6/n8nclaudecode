# FerreteríaYa MK — Proyecto de Administración Web

## Descripción del Proyecto

Administración completa del sitio web **https://ferreteriaya.com.co/** desde este directorio local. El objetivo es gestionar cambios en diseño, SEO, productos y configuración general, desplegando directamente a producción.

## Stack Tecnológico

| Componente      | Detalle                          |
|-----------------|----------------------------------|
| CMS             | WordPress                        |
| Tema            | Xtra                             |
| Page Builder    | WPBakery Page Builder            |
| Hosting         | Hostinger                        |
| Dominio         | ferreteriaya.com.co              |

## Alcance de Administración

- **Diseño**: Cambios de layout, colores, tipografía, banners, secciones con WPBakery
- **SEO**: Metadatos, títulos, descripciones, URLs amigables, sitemap, schema markup
- **Productos**: Creación, edición, categorías, precios, imágenes, stock (WooCommerce si aplica)
- **Contenido**: Páginas, entradas, menús de navegación
- **Configuración**: Plugins, widgets, ajustes generales de WordPress
- **Rendimiento**: Caché, optimización de imágenes, velocidad de carga

## Credenciales y Accesos

> Las credenciales están en el archivo `.env` (nunca subir a git).

- [x] **WordPress Admin**: `https://ferreteriaya.com.co/wp-admin` — configurado en `.env`
- [x] **WordPress REST API**: `https://ferreteriaya.com.co/wp-json/wp/v2`
- [x] **Hostinger API Token**: configurado en `.env` y `.mcp.json`
- [x] **SFTP / SSH**: Host `141.136.43.59`, usuario `u228175010`, puerto `65002`, clave `~/.ssh/ferreteriaya_hostinger` — **ACTIVO**
- [ ] **Google Search Console**: Pendiente
- [ ] **Google Analytics**: Pendiente

## Integraciones Configuradas

- **Hostinger MCP** (`hostinger-api-mcp`): configurado en Claude Code — permite gestionar hosting, dominios y DNS directo desde el chat. Requiere token API de Hostinger.

## Flujo de Trabajo

```
Local (este directorio)
    │
    ├── Cambios de código/archivos → SFTP / SSH → Hostinger
    ├── Cambios de contenido/diseño → WordPress REST API / WP-CLI
    └── Cambios de BD → phpMyAdmin / MySQL remoto
```

## Archivos y Estructura Local

```
FerreteríaYa MK/
├── .env                          ← Credenciales (nunca subir a git)
├── .mcp.json                     ← Config MCP Hostinger
├── CLAUDE.md                     ← Este archivo
│
├── seo/                          ← Gestión SEO
│   ├── keywords/                 ← Investigación de palabras clave
│   ├── meta/                     ← Títulos y descripciones meta
│   ├── schema/                   ← JSON-LD y schema markup
│   └── auditoria/                ← Reportes de auditoría SEO
│
├── admin/                        ← Administración WordPress
│   ├── configuracion/            ← Exportaciones de ajustes WP
│   ├── plugins/                  ← Lista y configs de plugins
│   └── menus/                    ← Estructura de menús de navegación
│
├── contenido/                    ← Contenido del sitio
│   ├── paginas/                  ← Drafts y textos de páginas
│   ├── productos/                ← CSVs y fichas de productos
│   └── banners/                  ← Textos e imágenes de banners
│
├── assets/                       ← Recursos gráficos
│   ├── logos/                    ← Logos en distintos formatos
│   ├── imagenes/                 ← Imágenes generales del sitio
│   └── iconos/                   ← Iconos e íconos SVG
│
├── scripts/                      ← Automatización
│   ├── wpcli/                    ← Comandos y scripts WP-CLI
│   ├── deploy/                   ← Scripts de despliegue vía SFTP/SSH
│   └── backup/                   ← Scripts de backup automático
│
├── backups/                      ← Backups almacenados localmente
│   ├── db/                       ← Dumps de base de datos (.sql)
│   └── archivos/                 ← Backups de archivos del sitio
│
└── repositorios/                 ← Código personalizado
    ├── child-theme/              ← Child theme del tema Xtra
    └── plugins-custom/           ← Plugins desarrollados a medida
```

## Comandos Útiles

```bash
# Conectar por SSH a Hostinger
ssh u228175010@141.136.43.59 -p 65002 -i ~/.ssh/ferreteriaya_hostinger

# WP-CLI (una vez con SSH activo)
wp plugin list
wp theme status
wp cache flush
wp search-replace 'url-vieja' 'url-nueva'

# Subir archivos por SFTP
sftp -P 65002 -i ~/.ssh/ferreteriaya_hostinger u228175010@141.136.43.59

# Ejecutar script de deploy local
bash scripts/deploy/deploy.sh

# Ejecutar backup de BD
bash scripts/backup/backup-db.sh
```

## Notas Importantes

- Hostinger usa el **puerto 65002** para SSH/SFTP por defecto
- El tema **Xtra** guarda customizaciones en la BD (opciones del tema), no solo en archivos
- **WPBakery** genera shortcodes dentro del contenido de las páginas — los cambios de layout se hacen mejor desde el admin de WordPress
- Hacer **backup antes de cualquier cambio en producción**

## Estado del Proyecto

- Fecha de inicio: 2026-05-02
- Estado: Accesos principales configurados — operativo
