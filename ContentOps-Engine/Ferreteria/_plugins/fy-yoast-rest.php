<?php
/**
 * Plugin Name: Ferretería Ya — Yoast REST Bridge
 * Plugin URI:  https://ferreteriaya.com.co
 * Description: Habilita lectura/escritura de los campos meta de Yoast SEO (_yoast_wpseo_title, _yoast_wpseo_metadesc, _yoast_wpseo_focuskw) vía la WP REST API. Necesario para que el workflow `Ferretería Ya - WF-1 - Blog SEO` (n8n) pueda publicar posts con SEO Yoast configurado.
 * Version:     1.0.0
 * Author:      Ferretería Ya ContentOps
 * License:     GPL-2.0-or-later
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'init', function () {
    $fields = array(
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw',
    );

    foreach ( $fields as $field ) {
        register_post_meta( 'post', $field, array(
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
} );
