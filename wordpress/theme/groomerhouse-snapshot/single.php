<?php get_header(); ?>
<main class="gh-shell gh-main">
    <?php while (have_posts()) : the_post(); ?>
        <article class="gh-content">
            <p><a href="<?php echo esc_url(home_url('/blog/')); ?>">← Blog</a></p>
            <h1><?php the_title(); ?></h1>
            <?php the_content(); ?>
        </article>
    <?php endwhile; ?>
</main>
<?php get_footer(); ?>
