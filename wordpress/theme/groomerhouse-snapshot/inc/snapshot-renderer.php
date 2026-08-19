<?php

defined('ABSPATH') || exit;

function groomerhouse_snapshot_file(string $name): string
{
    return __DIR__ . '/../snapshot/pages/' . basename($name);
}

function groomerhouse_prepare_snapshot(string $html): string
{
    $snapshot_uri = trailingslashit(get_template_directory_uri()) . 'snapshot/';

    $html = preg_replace('/<script[^>]*(?:pixelyoursite|\bpys[-_])[^>]*>[\s\S]*?<\/script>/i', '', $html) ?: $html;
    $html = preg_replace('/<noscript>\s*<img[^>]+facebook\.com\/tr[^>]*>\s*<\/noscript>/i', '', $html) ?: $html;

    $replacements = [
        'https://groomerhouse.pl/wp-content/' => $snapshot_uri . 'wp-content/',
        'https://www.groomerhouse.pl/wp-content/' => $snapshot_uri . 'wp-content/',
        'https://groomerhouse.pl/wp-includes/' => $snapshot_uri . 'wp-includes/',
        'https://www.groomerhouse.pl/wp-includes/' => $snapshot_uri . 'wp-includes/',
        '="/wp-content/' => '="' . $snapshot_uri . 'wp-content/',
        "='/wp-content/" => "='" . $snapshot_uri . 'wp-content/',
        '="/wp-includes/' => '="' . $snapshot_uri . 'wp-includes/',
        "='/wp-includes/" => "='" . $snapshot_uri . 'wp-includes/',
        'https://booksy.com/pl-pl/dl/show-business/203451?utm_medium=c2c_referral' => home_url('/rezerwacja/'),
        'https://groomerhouse.pl/cennik-uslug' => home_url('/cennik/'),
        'href="/cennik-uslug' => 'href="' . home_url('/cennik/'),
        "href='/cennik-uslug" => "href='" . home_url('/cennik/'),
    ];

    return str_replace(array_keys($replacements), array_values($replacements), $html);
}

function groomerhouse_send_snapshot(string $html): void
{
    status_header(200);
    header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
    header('X-Content-Type-Options: nosniff');
    echo groomerhouse_prepare_snapshot($html); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    exit;
}

function groomerhouse_output_snapshot(string $name): void
{
    $file = groomerhouse_snapshot_file($name);
    if (!is_readable($file)) {
        return;
    }
    groomerhouse_send_snapshot((string) file_get_contents($file));
}

function groomerhouse_find_matching_div(string $html, int $open_end): ?array
{
    $offset = $open_end + 1;
    $depth = 1;
    while (preg_match('/<div\b[^>]*>|<\/div\s*>/i', $html, $match, PREG_OFFSET_CAPTURE, $offset)) {
        $token = $match[0][0];
        $position = $match[0][1];
        $depth += str_starts_with(strtolower($token), '</div') ? -1 : 1;
        if ($depth === 0) {
            return [$position, strlen($token)];
        }
        $offset = $position + strlen($token);
    }
    return null;
}

function groomerhouse_replace_div_contents(string $html, string $needle, string $contents): string
{
    $class_index = strpos($html, $needle);
    if ($class_index === false) {
        return $html;
    }
    $open_start = strrpos(substr($html, 0, $class_index), '<div');
    $open_end = strpos($html, '>', $class_index);
    if ($open_start === false || $open_end === false) {
        return $html;
    }
    $closing = groomerhouse_find_matching_div($html, $open_end);
    if (!$closing) {
        return $html;
    }
    return substr($html, 0, $open_end + 1) . "\n" . $contents . "\n" . substr($html, $closing[0]);
}

function groomerhouse_blog_cards(array $posts, bool $sidebar = false): string
{
    $cards = [];
    foreach ($posts as $post) {
        $title = esc_html(get_the_title($post));
        $url = esc_url(get_permalink($post));
        if ($sidebar) {
            $cards[] = '<article class="elementor-post elementor-grid-item post-' . (int) $post->ID . ' post type-post status-publish hentry" role="listitem"><div class="elementor-post__text"><h3 class="elementor-post__title"><a href="' . $url . '">' . $title . '</a></h3><a class="elementor-post__read-more" href="' . $url . '">Przeczytaj całość »</a></div></article>';
            continue;
        }
        $excerpt = esc_html(wp_trim_words(wp_strip_all_tags(get_the_excerpt($post)), 32));
        $date = esc_html(get_the_date('Y-m-d', $post));
        $cards[] = '<article class="elementor-post elementor-grid-item post-' . (int) $post->ID . ' post type-post status-publish hentry" role="listitem"><div class="elementor-post__card"><div class="elementor-post__text"><h3 class="elementor-post__title"><a href="' . $url . '">' . $title . '</a></h3><div class="elementor-post__excerpt"><p>' . $excerpt . '</p></div><a class="elementor-post__read-more" href="' . $url . '">Przeczytaj całość »</a></div><div class="elementor-post__meta-data"><span class="elementor-post-date">' . $date . '</span></div></div></article>';
    }
    return implode("\n", $cards);
}

function groomerhouse_output_blog_snapshot(string $name): void
{
    $file = groomerhouse_snapshot_file($name);
    if (!is_readable($file)) {
        return;
    }
    $html = (string) file_get_contents($file);
    $posts = get_posts(['post_status' => 'publish', 'numberposts' => 100, 'orderby' => 'date', 'order' => 'DESC']);
    $html = groomerhouse_replace_div_contents($html, 'elementor-posts elementor-posts--skin-cards elementor-grid', groomerhouse_blog_cards($posts));
    $html = groomerhouse_replace_div_contents($html, 'elementor-posts elementor-posts--skin-classic elementor-grid', groomerhouse_blog_cards(array_slice($posts, 0, 8), true));
    groomerhouse_send_snapshot($html);
}

function groomerhouse_replace_elementor_post(string $html, string $content): string
{
    $needle = 'data-elementor-type="wp-post"';
    $index = strpos($html, $needle);
    if ($index === false) {
        return $html;
    }
    $open_start = strrpos(substr($html, 0, $index), '<div');
    $open_end = strpos($html, '>', $index);
    if ($open_start === false || $open_end === false) {
        return $html;
    }
    $closing = groomerhouse_find_matching_div($html, $open_end);
    if (!$closing) {
        return $html;
    }
    return substr($html, 0, $open_start) . $content . substr($html, $closing[0] + $closing[1]);
}

function groomerhouse_output_post_snapshot(string $name): void
{
    $file = groomerhouse_snapshot_file($name);
    if (!is_readable($file)) {
        return;
    }
    $html = (string) file_get_contents($file);
    $post = get_queried_object();
    if ($post instanceof WP_Post) {
        $content = apply_filters('the_content', $post->post_content);
        $title = esc_html(get_the_title($post));
        $date = esc_html(get_the_date('Y-m-d', $post));
        $article = '<main class="gh-snapshot-post"><p class="gh-snapshot-post__back"><a href="' . esc_url(home_url('/blog/')) . '">← Blog</a></p><article><h1>' . $title . '</h1><p class="gh-snapshot-post__date">' . $date . '</p><div class="gh-snapshot-post__content">' . $content . '</div></article></main>';
        $html = groomerhouse_replace_elementor_post($html, $article);

        $styles = '<style id="groomerhouse-dynamic-post">.gh-snapshot-post{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:64px 0 88px;color:#17142d}.gh-snapshot-post article{max-width:820px;margin:0 auto}.gh-snapshot-post__back{margin:0 auto 28px;max-width:820px}.gh-snapshot-post__back a{color:#77356f;font-weight:700;text-decoration:none}.gh-snapshot-post h1{font-size:clamp(2.35rem,6vw,4.6rem);line-height:1.06;margin:0 0 14px}.gh-snapshot-post__date{color:#68656f;margin-bottom:36px}.gh-snapshot-post__content{font-size:17px;line-height:1.75}.gh-snapshot-post__content h2{font-size:clamp(1.65rem,4vw,2.5rem);line-height:1.15;margin-top:2em}.gh-snapshot-post__content h3{font-size:1.45rem;margin-top:1.7em}.gh-snapshot-post__content img{max-width:100%;height:auto}.gh-snapshot-post__content a{color:#77356f}.gh-snapshot-post__content figure{margin-left:0;margin-right:0}@media(max-width:720px){.gh-snapshot-post{padding:40px 0 60px}.gh-snapshot-post__content{font-size:16px}}</style>';
        $html = str_ireplace('</head>', $styles . '</head>', $html);

        $html = preg_replace('/<title>.*?<\/title>/is', '<title>' . $title . ' | Groomer House</title>', $html, 1) ?: $html;
    }
    groomerhouse_send_snapshot($html);
}
