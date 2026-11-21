<?php
/**
 * Plugin Name: Groomer House — CMS dla groomerhouse.pl
 * Description: Pole „Kafelek miejscowości” dla stron oraz ukrycie publicznego frontu WordPressa (przekierowanie na groomerhouse.pl). Panel, API, rezerwacja Booknetic i kasa WooCommerce działają bez zmian.
 * Version: 1.0.0
 * Requires PHP: 8.0
 */

defined('ABSPATH') || exit;

const GROOMERHOUSE_PUBLIC_SITE = 'https://groomerhouse.pl';
const GROOMERHOUSE_CITY_META = 'gh_city_tile';

/* -------------------------------------------------------------------------
 * 1. „Kafelek miejscowości” — checkbox na stronach, widoczny w REST API.
 * ---------------------------------------------------------------------- */

add_action('init', function (): void {
    register_post_meta('page', GROOMERHOUSE_CITY_META, [
        'type' => 'boolean',
        'single' => true,
        'default' => false,
        'show_in_rest' => true,
        'sanitize_callback' => 'rest_sanitize_boolean',
        'auth_callback' => static fn(): bool => current_user_can('edit_pages'),
    ]);
});

add_action('add_meta_boxes_page', function (): void {
    add_meta_box(
        'groomerhouse-city-tile',
        'groomerhouse.pl',
        'groomerhouse_render_city_tile_box',
        'page',
        'side',
        'high'
    );
});

function groomerhouse_render_city_tile_box(WP_Post $post): void
{
    wp_nonce_field('groomerhouse_city_tile', 'groomerhouse_city_tile_nonce');
    $checked = (bool) get_post_meta($post->ID, GROOMERHOUSE_CITY_META, true);
    ?>
    <label style="display:flex;gap:8px;align-items:flex-start">
        <input type="checkbox" name="groomerhouse_city_tile" value="1" <?php checked($checked); ?> style="margin-top:3px">
        <span><strong>Kafelek miejscowości</strong><br>
        Pokaż tę stronę na groomerhouse.pl pod adresem <code>/<?php echo esc_html($post->post_name ?: 'adres-strony'); ?>/</code>
        i jako kafelek w sekcji „Szkolenia Groomerskie na Śląsku” na stronie Kursy groomerskie.</span>
    </label>
    <p style="color:#646970;margin:10px 0 0">Kolejność kafelków: pole „Kolejność” w atrybutach strony (mniejsza liczba = wcześniej). Nazwa kafelka = tytuł strony.</p>
    <?php
}

add_action('save_post_page', function (int $post_id): void {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!isset($_POST['groomerhouse_city_tile_nonce'])
        || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['groomerhouse_city_tile_nonce'])), 'groomerhouse_city_tile')) return;
    if (!current_user_can('edit_page', $post_id)) return;
    update_post_meta($post_id, GROOMERHOUSE_CITY_META, !empty($_POST['groomerhouse_city_tile']));
});

// Kolumna na liście stron, żeby od razu było widać, które są kafelkami.
add_filter('manage_page_posts_columns', function (array $columns): array {
    $columns['groomerhouse_city_tile'] = 'Kafelek miejscowości';
    return $columns;
});
add_action('manage_page_posts_custom_column', function (string $column, int $post_id): void {
    if ($column === 'groomerhouse_city_tile') echo get_post_meta($post_id, GROOMERHOUSE_CITY_META, true) ? '✓' : '—';
}, 10, 2);

/* -------------------------------------------------------------------------
 * 2. Ukrycie publicznego frontu WordPressa.
 *    WordPress służy do zarządzania treścią; odwiedzający trafiają na
 *    odpowiednią stronę groomerhouse.pl.
 * ---------------------------------------------------------------------- */

/** Strony, które MUSZĄ działać na wp.groomerhouse.pl (osadzane lub po płatności). */
function groomerhouse_is_operational_request(): bool
{
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) return true;
    if (defined('REST_REQUEST') && REST_REQUEST) return true;
    if (is_user_logged_in() && current_user_can('edit_posts')) return true; // podgląd dla redakcji
    if (is_preview() || is_feed() || is_robots() || is_favicon()) return true;
    if (isset($_GET['wc-api']) || isset($_GET['booknetic_action']) || isset($_GET['embed'])) return true;

    // Booknetic: formularz rezerwacji osadzany na groomerhouse.pl/rezerwacja/.
    if (is_page('rezerwacja')) return true;

    // WooCommerce: koszyk, kasa (w tym powrót z Przelewy24 / potwierdzenie zamówienia), konto.
    if (function_exists('is_woocommerce')) {
        if (is_cart() || is_checkout() || is_account_page() || is_wc_endpoint_url()) return true;
    }
    return false;
}

/** Odpowiednik danego adresu WordPressa na groomerhouse.pl. */
function groomerhouse_public_target(): string
{
    if (is_front_page()) return GROOMERHOUSE_PUBLIC_SITE . '/';
    if (is_singular('post')) {
        $post = get_queried_object();
        if ($post instanceof WP_Post && $post->post_name !== 'hello-world') return GROOMERHOUSE_PUBLIC_SITE . '/' . $post->post_name . '/';
    }
    if (is_page()) {
        $page = get_queried_object();
        if ($page instanceof WP_Post) {
            $map = [
                'privacy-policy' => '/polityka-prywatnosci/',
                'regulamin-strony-i-rezerwacji' => '/regulamin/',
                'sukcesy-naszych-klientow' => '/sukcesy-naszych-klientow/',
            ];
            if (isset($map[$page->post_name])) return GROOMERHOUSE_PUBLIC_SITE . $map[$page->post_name];
            if (get_post_meta($page->ID, GROOMERHOUSE_CITY_META, true)) return GROOMERHOUSE_PUBLIC_SITE . '/' . $page->post_name . '/';
        }
    }
    if (is_home() || is_category() || is_tag() || is_author() || is_date()) return GROOMERHOUSE_PUBLIC_SITE . '/blog/';
    return GROOMERHOUSE_PUBLIC_SITE . '/';
}

// Priorytet 1: przed innymi przekierowaniami, ale po ustaleniu zapytania.
add_action('template_redirect', function (): void {
    if (groomerhouse_is_operational_request()) return;
    $target = groomerhouse_public_target();
    // 301 tylko dla treści mającej dokładny odpowiednik; reszta tymczasowo na stronę główną.
    $status = $target === GROOMERHOUSE_PUBLIC_SITE . '/' ? 302 : 301;
    wp_redirect($target, $status, 'Groomer House');
    exit;
}, 1);

// Pozostałe publiczne strony WordPressa (kasa, rezerwacja) nie trafiają do wyszukiwarek.
add_filter('wp_robots', function (array $robots): array {
    if (!is_admin()) {
        $robots['noindex'] = true;
        $robots['nofollow'] = true;
        unset($robots['max-image-preview']);
    }
    return $robots;
});
add_filter('wp_sitemaps_enabled', '__return_false');
