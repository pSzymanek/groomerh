<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="gh-shell gh-header">
    <a href="<?php echo esc_url(home_url('/')); ?>" aria-label="Groomer House — strona główna">
        <img src="<?php echo esc_url(get_template_directory_uri() . '/snapshot/wp-content/uploads/2023/08/logo-1.png'); ?>" alt="Groomer House">
    </a>
    <nav class="gh-nav" aria-label="Menu">
        <a href="<?php echo esc_url(home_url('/')); ?>">Strona główna</a>
        <a href="<?php echo esc_url(home_url('/kurs-groomerski/')); ?>">Kursy</a>
        <a href="<?php echo esc_url(home_url('/cennik/')); ?>">Cennik</a>
        <a href="<?php echo esc_url(home_url('/blog/')); ?>">Blog</a>
    </nav>
</header>
