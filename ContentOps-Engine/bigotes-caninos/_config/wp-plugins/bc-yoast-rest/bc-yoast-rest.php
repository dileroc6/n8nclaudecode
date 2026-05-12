<?php
/**
 * Plugin Name: BC Yoast REST
 * Plugin URI: https://bigotescaninos.com
 * Description: Expone los campos meta de Yoast SEO (_yoast_wpseo_title, _yoast_wpseo_metadesc, _yoast_wpseo_focuskw) vía la WP REST API para posts y pages. Permite que workflows automatizados de n8n lean y escriban estos campos enviando un objeto `meta` en el body del request POST/PATCH a /wp-json/wp/v2/{posts|pages}.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Bigotes Caninos ContentOps
 * Author URI: https://bigotescaninos.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: bc-yoast-rest
 *
 * Uso desde n8n / cualquier cliente REST autenticado:
 *   POST /wp-json/wp/v2/posts (o /pages, /pages/{id})
 *   Body: {
 *     "title": "...",
 *     "slug": "...",
 *     "content": "...",
 *     "status": "publish",
 *     "meta": {
 *       "_yoast_wpseo_title": "Título SEO ≤60 chars",
 *       "_yoast_wpseo_metadesc": "Meta description ≤155 chars",
 *       "_yoast_wpseo_focuskw": "keyword principal"
 *     }
 *   }
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Registra los meta fields de Yoast con show_in_rest = true.
 * Esto los expone en /wp-json/wp/v2/{type}/{id} bajo la clave `meta`,
 * y permite escribirlos vía POST/PATCH para usuarios con capability edit_posts.
 */
add_action('init', function () {
    $post_types = ['post', 'page'];
    $meta_fields = [
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw',
    ];

    foreach ($post_types as $post_type) {
        foreach ($meta_fields as $meta_key) {
            register_post_meta($post_type, $meta_key, [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'string',
                'auth_callback' => function () {
                    return current_user_can('edit_posts');
                },
            ]);
        }
    }
}, 20);
