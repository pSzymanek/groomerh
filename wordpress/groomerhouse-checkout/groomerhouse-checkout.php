<?php
/**
 * Plugin Name: Groomer House — warunki zamówienia
 * Description: Akceptacja dokumentów w WooCommerce, zapis wersji warunków i stan integracji Przelewy24 dla Booknetic.
 * Version: 1.0.4
 * Requires PHP: 8.0
 */
defined('ABSPATH') || exit;

// WooCommerce protects checkout/account with SAMEORIGIN by default. Only the
// configured checkout page may be embedded by our exact HTTPS storefront.
// This runs before WooCommerce's default template_redirect callback, per request.
add_action('template_redirect', function () {
    if (is_admin() || wp_doing_ajax() || !function_exists('wc_get_page_id')) return;
    $checkout_id = (int) wc_get_page_id('checkout');
    if ($checkout_id <= 0 || !is_page($checkout_id) || is_account_page() || headers_sent()) return;

    remove_action('template_redirect', 'wc_send_frame_options_header');
    header_remove('X-Frame-Options');
    // Preserve any unrelated CSP directives while replacing frame-ancestors.
    $policies = array();
    foreach (headers_list() as $existing_header) {
        if (stripos($existing_header, 'Content-Security-Policy:') !== 0) continue;
        $directives = array();
        foreach (explode(';', substr($existing_header, strlen('Content-Security-Policy:'))) as $directive) {
            $directive = trim($directive);
            if ($directive !== '' && !preg_match('/^frame-ancestors(?:\\s|$)/i', $directive)) $directives[] = $directive;
        }
        $policies[] = implode('; ', $directives);
    }
    header_remove('Content-Security-Policy');
    foreach ($policies ?: array('') as $policy) {
        header('Content-Security-Policy: ' . ($policy !== '' ? $policy . '; ' : '') . "frame-ancestors 'self' https://groomerhouse.pl;", false);
    }
}, 1);

function gh_is_course_checkout(): bool {
    if (is_admin() || wp_doing_ajax() || !function_exists('wc_get_page_id')) return false;
    $checkout_id = (int) wc_get_page_id('checkout');
    return $checkout_id > 0 && is_page($checkout_id) && !is_account_page();
}

// The booking iframe must not display the WordPress theme or admin toolbar.
// These styles apply only to the configured public checkout, not wp-admin/account.
add_action('wp_head', function () {
    if (!gh_is_course_checkout()) return;
    echo <<<'HTML'
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Manrope:wght@500;600;700;800&amp;display=swap">
<style id="gh-checkout-style">
html,html:root,body{margin:0!important;padding:0!important;min-height:0!important;height:auto!important;background:#fff!important;overflow-x:hidden}
body{color:#24242a!important;font:15px/1.6 'DM Sans',Arial,sans-serif!important}
*,*::before,*::after{box-sizing:border-box}
#wpadminbar,.wp-site-blocks>header,.wp-site-blocks>footer,header.wp-block-template-part,footer.wp-block-template-part,.wp-block-post-title{display:none!important}
.wp-site-blocks,.wp-site-blocks>main,.wp-block-post-content{width:100%!important;max-width:none!important;min-height:0!important;height:auto!important;margin:0!important;padding:0!important}
.wp-site-blocks>main>*{max-width:none!important;margin-left:0!important;margin-right:0!important}
.wp-block-post-content>*{max-width:none!important}
.woocommerce{width:100%;max-width:1200px;margin:0 auto!important;padding:8px!important}
.woocommerce a{color:#49314d;text-underline-offset:3px}
.woocommerce h2,.woocommerce h3{color:#24242a;font-family:Manrope,'DM Sans',sans-serif!important;letter-spacing:-.04em;font-weight:700;line-height:1.25}
.gh-checkout-intro{padding:22px 24px;margin:0 0 24px;background:#f6f5f0;border-left:3px solid #a5ccc2}
.gh-checkout-intro .gh-eyebrow{display:block;margin-bottom:8px;font:800 10px/1.5 Manrope,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#49314d}
.gh-checkout-intro h2{font-size:28px;margin:0 0 12px}
.gh-checkout-intro p{font-size:12px;line-height:1.8;color:#696a70;margin:0!important}
.woocommerce .woocommerce-info,.woocommerce .woocommerce-message,.woocommerce .woocommerce-error{border:1px solid #dfddd5;border-top:2px solid #a5ccc2;border-radius:0;background:#f6f5f0;color:#49314d;font:13px/1.6 'DM Sans',sans-serif;box-shadow:none;padding:14px 18px 14px 44px;margin:0 0 20px}
.woocommerce .woocommerce-info::before,.woocommerce .woocommerce-message::before{color:#49314d;top:14px;left:18px}
.woocommerce .woocommerce-error{border-top-color:#a23d4a;color:#7d2632}
.woocommerce .wc-block-components-notice-banner{background:#f6f5f0!important;border:1px solid #dfddd5!important;border-left:3px solid #a5ccc2!important;border-radius:0!important;color:#49314d!important;font:13px/1.6 'DM Sans',sans-serif!important}
.woocommerce .wc-block-components-notice-banner>svg{background:#49314d!important}
.woocommerce form.checkout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);grid-template-rows:min-content 1fr;column-gap:36px;align-items:start;margin:24px 0 0!important;padding:0!important}
.woocommerce form.checkout::before,.woocommerce form.checkout::after{display:none}
.woocommerce form.checkout #customer_details{grid-column:1;grid-row:1 / span 2;width:100%!important;min-width:0}
.woocommerce form.checkout #customer_details .col-1,.woocommerce form.checkout #customer_details .col-2{float:none!important;width:100%!important;margin:0;padding:0}
.woocommerce form.checkout #order_review_heading{grid-column:2;grid-row:1;margin:0 0 18px!important}
.woocommerce form.checkout #order_review{grid-column:2;grid-row:2;min-width:0;width:100%!important}
.woocommerce form.checkout h3{font-size:20px;margin:0 0 18px}
.woocommerce .woocommerce-additional-fields{margin-top:26px}
.woocommerce form.checkout .form-row{padding:0;margin:0 0 15px}
.woocommerce form.checkout .form-row-first,.woocommerce form.checkout .form-row-last{width:calc(50% - 8px)}
.woocommerce form.checkout .form-row label{font-size:13px;font-weight:600;line-height:1.5;margin:0 0 7px;color:#49314d}
.woocommerce form.checkout .optional{font-weight:400;font-size:11px;color:#696a70}
.woocommerce form.checkout input.input-text,.woocommerce form.checkout select,.woocommerce form.checkout textarea,.woocommerce form.checkout .select2-container .select2-selection--single{width:100%;min-height:48px;height:auto;border:1px solid #dfddd5!important;border-radius:0!important;background:#fff!important;color:#24242a!important;font:14px/1.5 'DM Sans',Arial,sans-serif!important;padding:12px 13px!important;box-shadow:none!important}
.woocommerce form.checkout textarea{min-height:100px;resize:vertical}
.woocommerce form.checkout input:focus,.woocommerce form.checkout textarea:focus,.woocommerce form.checkout select:focus{outline:2px solid #a5ccc2!important;outline-offset:1px}
.woocommerce .select2-container .select2-selection--single .select2-selection__rendered{padding:0 18px 0 0!important;line-height:22px!important;min-height:0!important;height:22px!important;color:#24242a}
.woocommerce .select2-container .select2-selection--single .select2-selection__arrow{height:46px;right:8px}
.woocommerce .select2-container{max-width:100%}
.woocommerce table.shop_table{width:100%;table-layout:fixed;border:1px solid #dfddd5;border-collapse:collapse;border-radius:0;font-size:13px;margin:0 0 20px}
.woocommerce table.shop_table th,.woocommerce table.shop_table td{border:0;border-bottom:1px solid #dfddd5;padding:14px 16px;vertical-align:top;overflow-wrap:anywhere;line-height:1.65}
.woocommerce table.shop_table thead{background:#f6f5f0}
.woocommerce table.shop_table .product-name{width:68%}
.woocommerce table.shop_table .product-total,.woocommerce table.shop_table tfoot td{text-align:right;white-space:nowrap;overflow-wrap:normal}
.woocommerce table.shop_table tfoot .order-total{background:#cbe5df;font-size:15px;color:#302339}
.woocommerce table.shop_table dl{margin:8px 0 0;color:#696a70;font-size:11px;line-height:1.65}
.woocommerce table.shop_table dl dt,.woocommerce table.shop_table dl dd{float:none;margin:0;font-weight:400}
.woocommerce table.shop_table dl p{margin:0}
.woocommerce-checkout #payment{border:1px solid #dfddd5;border-radius:0;background:#f6f5f0;padding:0}
.woocommerce-checkout #payment ul.payment_methods{padding:18px 20px!important;border-bottom:1px solid #dfddd5}
.woocommerce-checkout #payment ul.payment_methods li{line-height:1.6;text-align:left;font-size:14px}
.woocommerce-checkout #payment ul.payment_methods li label{font-weight:700;color:#49314d}
.woocommerce-checkout #payment ul.payment_methods li img{display:inline-block;max-width:100px;max-height:24px;vertical-align:middle;margin-left:12px}
.woocommerce-checkout #payment div.payment_box{margin:12px 0 0;padding:12px;background:#fff;border:1px solid #dfddd5;border-radius:0;font:12px/1.6 'DM Sans',sans-serif;color:#696a70}
.woocommerce-checkout #payment div.payment_box::before{display:none}
.woocommerce-checkout #payment div.payment_box p{margin:0}
.woocommerce-checkout #payment div.form-row.place-order{margin:0;padding:20px}
.woocommerce-checkout #payment .woocommerce-privacy-policy-text{font-size:11px;line-height:1.75;color:#696a70;margin-bottom:16px}
.woocommerce-checkout #payment .woocommerce-privacy-policy-text p{margin:0}
.woocommerce-checkout #payment .woocommerce-terms-and-conditions-wrapper .form-row{margin:0 0 18px}
.woocommerce-checkout #payment .woocommerce-terms-and-conditions-wrapper label{font-size:12px;font-weight:400;line-height:1.8;cursor:pointer}
.woocommerce-checkout #payment input.input-checkbox{width:17px;height:17px;accent-color:#49314d;margin:3px 8px 0 0!important;position:static!important;vertical-align:top}
.woocommerce-checkout #payment #place_order{float:none;width:100%;min-height:52px;background:#49314d!important;color:#fff!important;border:1px solid #49314d;border-radius:0!important;padding:14px 20px!important;font:700 14px/1.5 Manrope,'DM Sans',sans-serif!important;letter-spacing:0;box-shadow:none;cursor:pointer}
.woocommerce-checkout #payment #place_order:hover{background:#302339!important}
.gh-course-payment-summary{border:1px solid #dfddd5;background:#fff;padding:16px;margin:0 0 18px}
.gh-course-payment-summary h4{font:700 16px/1.35 Manrope,'DM Sans',sans-serif;letter-spacing:-.025em;color:#49314d;margin:0 0 8px}
.gh-course-payment-summary .gh-summary-name{font-size:11px;line-height:1.6;color:#696a70;margin:0 0 12px}
.gh-course-payment-summary dl{margin:0!important;padding:0!important;font:12px/1.6 'DM Sans',sans-serif}
.gh-course-payment-summary dl>div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid #dfddd5}
.gh-course-payment-summary dt,.gh-course-payment-summary dd{float:none!important;margin:0!important;padding:0!important}
.gh-course-payment-summary dd{font-weight:700;text-align:right;white-space:nowrap;color:#302339}
.gh-course-payment-summary .gh-summary-now{background:#cbe5df;margin-inline:-8px;padding-inline:8px;color:#302339;font-weight:700}
.gh-course-payment-summary .gh-summary-deadline{font-size:11px;line-height:1.65;margin:12px 0 0!important;color:#696a70}
.woocommerce :focus-visible{outline:2px solid #49314d;outline-offset:3px}
@media(max-width:760px){.woocommerce{padding:4px!important}.gh-checkout-intro{padding:18px}.gh-checkout-intro h2{font-size:25px}.woocommerce form.checkout{display:block!important;margin-top:22px!important}.woocommerce form.checkout #order_review_heading{margin-top:30px!important}.woocommerce .woocommerce-additional-fields{margin-top:22px}.woocommerce table.shop_table th,.woocommerce table.shop_table td{padding:12px}.woocommerce-checkout #payment ul.payment_methods,.woocommerce-checkout #payment div.form-row.place-order{padding:16px!important}}
@media(max-width:420px){.woocommerce form.checkout .form-row-first,.woocommerce form.checkout .form-row-last{float:none!important;width:100%!important}.woocommerce table.shop_table .product-name{width:65%}}
</style>
HTML;
}, 999);

add_action('wp_footer', function () {
    if (!gh_is_course_checkout()) return;
    echo <<<'HTML'
<script id="gh-checkout-layout">
(() => {
  if (window.parent === window) return;
  const start = () => {
    const content = document.querySelector('main');
    if (!content) return;
    let queued = false;
    let lastHeight = 0;
    const report = () => {
      queued = false;
      const height = Math.ceil(content.getBoundingClientRect().height + 32);
      if (!Number.isFinite(height) || height < 300 || height > 3000 || height === lastHeight) return;
      lastHeight = height;
      window.parent.postMessage({type:'groomerhouse:booking-height',height}, 'https://groomerhouse.pl');
    };
    const queue = () => {
      if (!queued) { queued = true; requestAnimationFrame(report); }
    };
    new ResizeObserver(queue).observe(content);
    window.addEventListener('resize', queue);
    window.addEventListener('load', queue);
    content.addEventListener('load', queue, true);
    if (document.fonts) document.fonts.ready.then(queue);
    if (window.jQuery) window.jQuery(document.body).on('updated_checkout checkout_error', queue);
    queue();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
</script>
HTML;
}, 999);

function gh_checkout_payment_state(): array {
    $gateway = (array) get_option('woocommerce_p24-online-payments_settings', array());
    return array(
        'configured' => class_exists('WC_P24\\Config')
            && ($gateway['enabled'] ?? 'no') === 'yes'
            && (int) get_option('p24_merchant_id', 0) > 0
            && trim((string) get_option('p24_crc_key', '')) !== ''
            && trim((string) get_option('p24_reports_key', '')) !== '',
        'mode' => get_option('p24_mode', 'sandbox') === 'production' ? 'production' : 'sandbox',
    );
}

add_action('wp_head', function () {
    if (!is_page('rezerwacja')) return;
    // Only public booleans and the environment are exposed. Never expose credentials.
    echo '<script>window.groomerhouseCheckout=' . wp_json_encode(gh_checkout_payment_state()) . ';</script>';
}, 5);

add_filter('woocommerce_get_terms_and_conditions_checkbox_text', function ($text) {
    return 'Akceptuję <a href="https://groomerhouse.pl/regulamin/" target="_blank" rel="noopener">regulamin strony i rezerwacji</a> oraz potwierdzam zapoznanie się z <a href="https://groomerhouse.pl/polityka-prywatnosci/" target="_blank" rel="noopener">polityką prywatności</a>.';
});
// Never preselect the contractual acknowledgement, including after checkout refresh.
add_filter('woocommerce_terms_is_checked_default', '__return_false');
add_filter('woocommerce_order_button_text', function ($text) { return 'Zamawiam i płacę'; });

// Course reservations have no shipment. Change only the optional notes wording.
add_filter('woocommerce_checkout_fields', function ($fields) {
    if (isset($fields['order']['order_comments'])) {
        $fields['order']['order_comments']['label'] = 'Uwagi do rezerwacji kursu';
        $fields['order']['order_comments']['placeholder'] = 'Dodatkowe informacje dotyczące udziału w kursie.';
    }
    return $fields;
}, 100);

// Read the booked amount from Booknetic, not a hard-coded package price and not
// the shared virtual WooCommerce product (whose price can be only the deposit).
function gh_course_payment_summaries(): array {
    $bridge = 'BookneticAddon\\WCPaymentGateway\\Providers\\WooCommerceGateway';
    if (!function_exists('WC') || !WC()->cart || !is_callable(array($bridge, 'getWCService'))) return array();
    $summaries = array();
    foreach (WC()->cart->get_cart() as $cart_item) {
        try {
            $service = $bridge::getWCService($cart_item);
            if (!$service || empty($service->bookingData)) continue;
            $booking = $service->bookingData;
            if (!is_callable(array($booking, 'getTotalAmount'))) continue;
            $course = $booking->getServiceInf();
            if (!$course) continue;
            $total = round((float) $booking->getTotalAmount(true), 2);
            $paid_before = is_callable(array($booking, 'getRealPaidAmount')) ? max(0, round((float) $booking->getRealPaidAmount(), 2)) : 0;
            $payable = isset($cart_item['line_total'])
                ? (float) $cart_item['line_total'] + (float) ($cart_item['line_tax'] ?? 0)
                : (float) ($cart_item['booknetic_appointment_payable_sum'] ?? 0);
            $payable = round($payable, 2);
            if (!is_finite($total) || !is_finite($payable) || !is_finite($paid_before) || $total <= 0 || $payable < 0) continue;
            $summaries[] = array(
                'name' => (string) $course->name,
                'total' => $total,
                'paid_before' => $paid_before,
                'payable' => $payable,
                'remaining' => max(0, round($total - $paid_before - $payable, 2)),
            );
        } catch (\Throwable $error) {
            // An unavailable booking must not disclose internals or break checkout.
            continue;
        }
    }
    return $summaries;
}

add_action('woocommerce_checkout_before_terms_and_conditions', function () {
    foreach (gh_course_payment_summaries() as $summary) {
        echo '<section class="gh-course-payment-summary" aria-label="Rozliczenie kursu"><h4>Podsumowanie płatności</h4><p class="gh-summary-name">' . esc_html($summary['name']) . '</p><dl>';
        echo '<div><dt>Pełna cena kursu (brutto)</dt><dd data-gh-course-total="' . esc_attr((string) $summary['total']) . '">' . wp_kses_post(wc_price($summary['total'])) . '</dd></div>';
        if ($summary['paid_before'] > 0) echo '<div><dt>Wpłacono wcześniej</dt><dd>' . wp_kses_post(wc_price($summary['paid_before'])) . '</dd></div>';
        echo '<div class="gh-summary-now"><dt>Do zapłaty teraz — ' . ($summary['remaining'] > 0 ? 'zaliczka' : 'pełna kwota') . '</dt><dd data-gh-payable-now="' . esc_attr((string) $summary['payable']) . '">' . wp_kses_post(wc_price($summary['payable'])) . '</dd></div>';
        echo '<div><dt>Pozostała kwota po tej wpłacie</dt><dd data-gh-course-remaining="' . esc_attr((string) $summary['remaining']) . '">' . wp_kses_post(wc_price($summary['remaining'])) . '</dd></div></dl>';
        echo '<p class="gh-summary-deadline">' . ($summary['remaining'] > 0 ? 'Dopłata najpóźniej w dniu rozpoczęcia kursu. ' : 'Wybrano płatność pełnej ceny kursu. ') . 'Miejsce na kursie potwierdzamy po skutecznej płatności.</p></section>';
    }
}, 5);

add_action('woocommerce_after_checkout_validation', function ($data, $errors) {
    if (empty($data['terms'])) {
        $errors->add('gh_legal_required', 'Zaakceptuj regulamin i potwierdź zapoznanie się z polityką prywatności.');
    }
    if (strpos((string) ($data['payment_method'] ?? ''), 'p24') === 0 && !gh_checkout_payment_state()['configured']) {
        $errors->add('gh_payment_unavailable', 'Płatność online jest obecnie niedostępna. Skontaktuj się z Groomer House.');
    }
}, 20, 2);

add_action('woocommerce_checkout_create_order', function ($order, $data) {
    $order->update_meta_data('_gh_p24_mode', gh_checkout_payment_state()['mode']);
    if (empty($data['terms'])) return;
    $order->update_meta_data('_gh_legal_accepted_at', gmdate('c'));
    $order->update_meta_data('_gh_course_payment_summary', gh_course_payment_summaries());
    $order->update_meta_data('_gh_legal_terms_url', 'https://groomerhouse.pl/regulamin/');
    $order->update_meta_data('_gh_legal_privacy_url', 'https://groomerhouse.pl/polityka-prywatnosci/');
    // A snapshot survives later edits of the published documents.
    foreach (array('terms' => (int) get_option('woocommerce_terms_page_id'), 'privacy' => (int) get_option('wp_page_for_privacy_policy')) as $key => $id) {
        $order->update_meta_data('_gh_legal_' . $key . '_snapshot', wp_kses_post((string) get_post_field('post_content', $id)));
    }
}, 20, 2);

// Successful sandbox callbacks are not real paid course reservations.
// Keep the original environment on the order even after switching to production.
add_filter('woocommerce_payment_complete_order_status', function ($status, $order_id, $order) {
    if ($order && $order->get_meta('_gh_p24_mode') === 'sandbox' && strpos((string) $order->get_payment_method(), 'p24') === 0) return 'on-hold';
    return $status;
}, 100, 3);

add_action('woocommerce_email_after_order_table', function ($order, $sent_to_admin, $plain_text, $email) {
    if ($sent_to_admin || !$order->get_meta('_gh_legal_accepted_at')) return;
    // Preserve the exact course/deposit breakdown accepted with this order.
    foreach ((array) $order->get_meta('_gh_course_payment_summary') as $summary) {
        if (!is_array($summary) || !isset($summary['name'], $summary['total'], $summary['payable'], $summary['remaining'])) continue;
        $deadline = (float) $summary['remaining'] > 0 ? 'Dopłata najpóźniej w dniu rozpoczęcia kursu.' : 'Wybrano płatność pełnej ceny kursu.';
        if ($plain_text) {
            echo "\n\nRozliczenie kursu: " . wp_strip_all_tags($summary['name']) . "\n";
            foreach (array('total' => 'Pełna cena kursu (brutto)', 'payable' => 'Kwota bieżącego zamówienia', 'remaining' => 'Pozostała kwota po opłaceniu tego zamówienia') as $key => $label) {
                echo $label . ': ' . html_entity_decode(wp_strip_all_tags(wc_price((float) $summary[$key])), ENT_QUOTES, 'UTF-8') . "\n";
            }
            echo $deadline . "\n";
        } else {
            echo '<h2>Rozliczenie kursu</h2><p><strong>' . esc_html($summary['name']) . '</strong><br>';
            foreach (array('total' => 'Pełna cena kursu (brutto)', 'payable' => 'Kwota bieżącego zamówienia', 'remaining' => 'Pozostała kwota po opłaceniu tego zamówienia') as $key => $label) {
                echo esc_html($label) . ': ' . wp_kses_post(wc_price((float) $summary[$key])) . '<br>';
            }
            echo esc_html($deadline) . '</p>';
        }
    }
    foreach (array('terms' => 'Regulamin zaakceptowany przy zamówieniu', 'privacy' => 'Informacja o przetwarzaniu danych') as $key => $heading) {
        $snapshot = (string) $order->get_meta('_gh_legal_' . $key . '_snapshot');
        if (!$snapshot) continue;
        if ($plain_text) echo "\n\n" . $heading . "\n" . wp_strip_all_tags($snapshot) . "\n";
        else echo '<h2>' . esc_html($heading) . '</h2>' . wp_kses_post($snapshot);
    }
}, 20, 4);

add_action('woocommerce_before_checkout_form', function () {
    echo '<div class="gh-checkout-intro"><span class="gh-eyebrow">Rezerwacja kursu</span><h2>Dane i płatność</h2><p><strong>Groomer House Sylwia Ociepka</strong> · NIP 6262553631<br>ul. Strzelców Bytomskich 226a/1, 41-933 Bytom<br><a href="https://groomerhouse.pl/regulamin/" target="_blank" rel="noopener">Regulamin i odstąpienie od umowy</a> · <a href="https://groomerhouse.pl/polityka-prywatnosci/" target="_blank" rel="noopener">Polityka prywatności</a></p></div>';
});

// Admin-only, explicit diagnostic: ask an external IP reflector from the PHP server.
// No payment keys, customer data, browser IP or order information are transmitted.
add_action('admin_menu', function () {
    add_submenu_page('woocommerce', 'IP serwera dla Przelewy24', 'IP serwera P24', 'manage_woocommerce', 'gh-p24-server-ip', function () {
        if (!current_user_can('manage_woocommerce')) return;
        echo '<div class="wrap"><h1>IP serwera dla Przelewy24</h1><p>Pomiar publicznego adresu wychodzącego z serwera PHP WordPress. Zapytanie jest wysyłane wyłącznie do api.ipify.org, bez kluczy P24 i bez danych klientów.</p>';
        if (isset($_POST['gh_check_ip']) && check_admin_referer('gh_check_server_ip')) {
            $response = wp_remote_get('https://api.ipify.org?format=json', array('timeout' => 10, 'redirection' => 0));
            $body = is_wp_error($response) ? array() : json_decode(wp_remote_retrieve_body($response), true);
            $ip = is_array($body) ? (string) ($body['ip'] ?? '') : '';
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                echo '<div class="notice notice-success inline"><p>Publiczny adres wychodzący WordPress: <strong>' . esc_html($ip) . '</strong></p></div>';
            } else {
                echo '<div class="notice notice-error inline"><p>Nie udało się zmierzyć IP. Poproś hosting o publiczny adres wychodzący połączeń PHP do API Przelewy24.</p></div>';
            }
        }
        echo '<form method="post">';
        wp_nonce_field('gh_check_server_ip');
        echo '<p><button class="button button-primary" name="gh_check_ip" value="1">Sprawdź IP serwera</button></p></form><p>Przepisz wynik do listy IP w konfiguracji API właściwego konta sandbox lub produkcyjnego. Nie wpisuj adresu Cloudflare ani własnego komputera. W przypadku wielu adresów wyjściowych lub odrębnych tras IPv4/IPv6 potwierdź kompletną listę z hostingiem.</p></div>';
    });
});

// Never calls payment APIs, reveals credentials, confirms a fake payment or creates products.
