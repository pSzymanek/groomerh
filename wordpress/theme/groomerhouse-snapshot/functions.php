<?php

defined('ABSPATH') || exit;

require_once __DIR__ . '/inc/snapshot-renderer.php';

function groomerhouse_snapshot_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
}
add_action('after_setup_theme', 'groomerhouse_snapshot_setup');

function groomerhouse_snapshot_assets(): void
{
    wp_enqueue_style('groomerhouse-snapshot', get_stylesheet_uri(), [], '1.0.0');
}
add_action('wp_enqueue_scripts', 'groomerhouse_snapshot_assets');

function groomerhouse_snapshot_route(): void
{
    if (is_admin() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return;
    }

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = '/' . trim($path, '/') . '/';
    if ($path === '//') {
        $path = '/';
    }

    if ($path === '/cennik-uslug/') {
        wp_safe_redirect(home_url('/cennik/'), 301);
        exit;
    }

    $routes = [
        '/' => 'home.html',
        '/kurs-grooming-kotow/' => 'kurs-grooming-kotow.html',
        '/kurs-groomerski/' => 'kurs-groomerski.html',
        '/podstawowy-kurs-groomerski-slask/' => 'podstawowy-kurs-groomerski-slask.html',
        '/cennik/' => 'cennik.html',
        '/polityka-prywatnosci/' => 'polityka-prywatnosci.html',
    ];

    if (isset($routes[$path])) {
        groomerhouse_output_snapshot($routes[$path]);
    }

    if ($path === '/blog/') {
        groomerhouse_output_blog_snapshot('blog.html');
    }

    if (is_singular('post')) {
        groomerhouse_output_post_snapshot('post-jak-zostac-groomerem.html');
    }
}
add_action('template_redirect', 'groomerhouse_snapshot_route', -100);
