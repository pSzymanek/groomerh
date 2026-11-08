<?php
namespace BookneticApp\Providers\Helpers {
    class Date {
        public static function dateSQL($timestamp) { return gmdate('Y-m-d', $timestamp); }
        public static function time($timestamp) { return gmdate('H:i', $timestamp); }
    }
}
namespace BookneticApp\Models {
    class Appointment {
        public static function get($id) { return \BookneticApp\Backend\Appointments\Helpers\AppointmentSmartObject::$fixture->info; }
    }
    class AppointmentExtra {
        public static function where(...$args) { return new self(); }
        public function fetchAll() { return []; }
    }
}
namespace BookneticApp\Backend\Appointments\Helpers {
    class AppointmentSmartObject {
        public static $fixture;
        public static function load($id) { return self::$fixture; }
    }
    class AppointmentService {
        public static $deletions = 0;
        public static function deleteAppointment($id) { self::$deletions++; }
    }
    class TimeSlotService {
        public static $last;
        public static $bookable = true;
        public $date;
        public $time;
        public $excluded;
        public $backend;
        public function __construct($date, $time) {
            if (trim($date . ' ' . $time) === '') throw new \DateMalformedStringException('Empty date');
            $this->date = $date; $this->time = $time; self::$last = $this;
        }
        public function setStaffId($id) { return $this; }
        public function setServiceId($id) { return $this; }
        public function setServiceExtras($data) { return $this; }
        public function setExcludeAppointmentId($id) { $this->excluded = $id; return $this; }
        public function setCalledFromBackEnd($value) { $this->backend = $value; return $this; }
        public function setShowExistingTimeSlots($value) { return $this; }
        public function isBookable() { return self::$bookable; }
    }
}
namespace BookneticAddon\WCPaymentGateway\Providers {
    class WooCommerceGateway {
        public static $cartItems = [];
        public static $emptyCalls = 0;
        public static function emptyCart() { self::$emptyCalls++; }
    }
}
namespace {
    use BookneticAddon\WCPaymentGateway\Providers\WcProductObject;
    use BookneticAddon\WCPaymentGateway\Providers\WooCommerceGateway;
    use BookneticApp\Backend\Appointments\Helpers\AppointmentSmartObject;
    use BookneticApp\Backend\Appointments\Helpers\AppointmentService;
    use BookneticApp\Backend\Appointments\Helpers\TimeSlotService;

    final class FakeSession {
        public $data = ['cart' => ['target' => ['booknetic_appointment_id'=>42], 'other' => ['booknetic_appointment_id'=>43]]];
        public function get($name, $default = null) { return $this->data[$name] ?? $default; }
        public function set($name, $value) { $this->data[$name] = $value; }
    }
    final class FakeCart {
        public $cart_contents = ['target'=>['booknetic_appointment_id'=>42], 'other'=>['booknetic_appointment_id'=>43]];
        public $removalCalls = 0;
        public function remove_cart_item($key) { $this->removalCalls++; throw new \Exception('Must not call destructive cart-removal hook'); }
    }
    final class FakeBooking {
        public $info;
        public $staff = true;
        public $service = true;
        public function getInfo() { return $this->info; }
        public function getId() { return 42; }
        public function getStaffInf() { return $this->staff ? (object)['id'=>1] : null; }
        public function getServiceInf() { return $this->service ? (object)['id'=>2] : null; }
    }
    $fakeWC = null;
    $notices = [];
    function WC() { return $GLOBALS['fakeWC']; }
    function wc_add_notice($text, $type) { $GLOBALS['notices'][] = [$text, $type]; }
    function wc_has_notice($text, $type) { return in_array([$text, $type], $GLOBALS['notices'], true); }
    $checks = 0;
    function verify($condition, $label) { if (!$condition) throw new \Exception($label); $GLOBALS['checks']++; }

    require __DIR__ . '/../wordpress/booknetic-payment-wc/App/Providers/WcProductObject.php';
    try { new \DateTime(' '); verify(false, 'Original failure must reproduce on PHP 8.5'); }
    catch (\DateMalformedStringException $expected) { verify(true, 'Empty legacy date reproduces the exact fatal exception'); }

    foreach (['valid','pending','missing-date','empty-date','missing-record','missing-staff','missing-service','busy'] as $case) {
        $fakeWC = (object)['cart'=>new FakeCart(), 'session'=>new FakeSession()];
        $notices = [];
        $booking = new FakeBooking();
        $booking->info = (object)['id'=>42,'starts_at'=>1793430000,'payment_status'=>'paid','customer_id'=>3];
        if ($case === 'pending') $booking->info->payment_status = 'pending';
        if ($case === 'missing-date') unset($booking->info->starts_at);
        if ($case === 'empty-date') $booking->info->starts_at = ' ';
        if ($case === 'missing-record') $booking->info = null;
        if ($case === 'missing-staff') $booking->staff = false;
        if ($case === 'missing-service') $booking->service = false;
        $original = serialize($booking);
        AppointmentSmartObject::$fixture = $booking;
        TimeSlotService::$last = null;
        TimeSlotService::$bookable = $case !== 'busy';
        $product = new WcProductObject();
        $product->setCartItemKey('target');
        $product->setAppointmentId(42);
        $product->init();
        $valid = in_array($case, ['valid','pending'], true);
        verify(isset($fakeWC->cart->cart_contents['target']) === $valid, "$case: only valid item remains payable");
        verify(isset($fakeWC->session->data['cart']['target']) === $valid, "$case: current session persisted safely");
        verify(isset($fakeWC->cart->cart_contents['other'], $fakeWC->session->data['cart']['other']), "$case: other cart items preserved");
        verify($fakeWC->cart->removalCalls === 0 && AppointmentService::$deletions === 0 && WooCommerceGateway::$emptyCalls === 0, "$case: zero appointment deletion hooks");
        verify(serialize($booking) === $original, "$case: original booking fields/status untouched");
        verify($product->isAppointmentExists() === $valid, "$case: invalid item cannot enter payment/prefill map");
        if ($case === 'valid') {
            verify(TimeSlotService::$last->date === gmdate('Y-m-d',1793430000), 'Date uses canonical stored timestamp');
            verify(TimeSlotService::$last->time === gmdate('H:i',1793430000), 'Time uses canonical stored timestamp');
            verify(TimeSlotService::$last->excluded === 42, 'Excludes actual ID, not removed appointment_id field');
            verify(TimeSlotService::$last->backend === false, 'Public booking restrictions not bypassed');
        }
        if (!$valid) verify(count($notices) === 1, "$case: useful retry notice without internal errors");
    }
    echo json_encode(['result'=>'PASS','checks'=>$checks,'php'=>PHP_VERSION,'liveCmsMutations'=>0], JSON_PRETTY_PRINT) . PHP_EOL;
}
