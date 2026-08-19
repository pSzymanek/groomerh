<?php get_header(); ?>
<main class="gh-shell gh-main">
    <h1>Umów wizytę</h1>
    <p>Wybierz usługę i dogodny termin w formularzu Groomer House.</p>
    <section class="gh-booking-panel">
        <?php if (shortcode_exists('booknetic')) : ?>
            <?php echo do_shortcode('[booknetic]'); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
        <?php else : ?>
            <p>Formularz zostanie uruchomiony po aktywacji wtyczki Booknetic.</p>
        <?php endif; ?>
    </section>
</main>
<?php get_footer(); ?>
