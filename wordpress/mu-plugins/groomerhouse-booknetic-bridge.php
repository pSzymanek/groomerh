<?php
/**
 * Plugin Name: Groomer House — Booknetic Bridge
 * Description: Tworzy stronę rezerwacji Booknetic i bezpieczny widok do osadzenia w froncie Astro.
 * Version: 1.0.0
 */

defined('ABSPATH') || exit;

function groomerhouse_ensure_booking_page(): void
{
    if (!shortcode_exists('booknetic') || get_page_by_path('rezerwacja')) {
        return;
    }

    wp_insert_post([
        'post_title' => 'Rezerwacja',
        'post_name' => 'rezerwacja',
        'post_content' => '[booknetic]',
        'post_status' => 'publish',
        'post_type' => 'page',
        'comment_status' => 'closed',
    ]);
}
add_action('init', 'groomerhouse_ensure_booking_page', 20);

function groomerhouse_render_embedded_booking(): void
{
    if (!is_page('rezerwacja') || !isset($_GET['embed']) || $_GET['embed'] !== '1') {
        return;
    }

    header("Content-Security-Policy: frame-ancestors 'self' https://groomerhouse.pl");
    status_header(200);
    ?><!doctype html>
    <html <?php language_attributes(); ?>>
    <head>
        <meta charset="<?php bloginfo('charset'); ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?php wp_head(); ?>
        <style>
            html, body { margin: 0; background: #fff; }
            body { padding: 24px; }
            @media (max-width: 640px) { body { padding: 12px; } }
        </style>
    </head>
    <body class="groomerhouse-booknetic-embed">
        <?php echo do_shortcode('[booknetic]'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        <?php wp_footer(); ?>
    </body>
    </html><?php
    exit;
}
add_action('template_redirect', 'groomerhouse_render_embedded_booking', 0);

function groomerhouse_booknetic_admin_notice(): void
{
    if (shortcode_exists('booknetic') || !current_user_can('activate_plugins')) {
        return;
    }
    echo '<div class="notice notice-warning"><p><strong>Groomer House:</strong> aktywuj Booknetic, aby uruchomić stronę /rezerwacja/.</p></div>';
}
add_action('admin_notices', 'groomerhouse_booknetic_admin_notice');
