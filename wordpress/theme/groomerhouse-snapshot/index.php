<?php get_header(); ?>
<main class="gh-shell gh-main">
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
        <article class="gh-content">
            <h1><?php the_title(); ?></h1>
            <?php the_content(); ?>
        </article>
    <?php endwhile; else : ?>
        <h1>Nie znaleziono treści</h1>
    <?php endif; ?>
</main>
<?php get_footer(); ?>
