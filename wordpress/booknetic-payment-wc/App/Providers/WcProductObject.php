<?php

namespace BookneticAddon\WCPaymentGateway\Providers;

use BookneticAddon\WCPaymentGateway\Repositories\WcOrderRepository;
use BookneticApp\Backend\Appointments\Helpers\AppointmentSmartObject;
use BookneticApp\Backend\Appointments\Helpers\TimeSlotService;
use BookneticApp\Config;
use BookneticApp\Models\Appointment;
use BookneticApp\Providers\Helpers\Helper;
use BookneticApp\Providers\Helpers\Date;
use BookneticApp\Models\AppointmentExtra;
use BookneticApp\Backend\Appointments\Helpers\AppointmentService;
use BookneticApp\Providers\IoC\Container;

final class WcProductObject
{
    private $cartItemKey;
    private $appointmentId;
    private bool $cartItemDetached = false;

    /** @var AppointmentSmartObject */
    public $bookingData;

    public function init()
    {
        $this->bookingData = AppointmentSmartObject::load($this->appointmentId);
        $this->checkSelectedTimeslot();
    }

    public function productAdditionalData()
    {
        $additionalData = '';

        $woocommerdeOrderDetails = Helper::getOption('woocommerce_order_details', "Date: {appointment_date}\nTime: {appointment_start_time}\nStaff: {staff_name}", false);
        $woocommerdeOrderDetails = trim($woocommerdeOrderDetails);

        if (! empty($woocommerdeOrderDetails)) {
            $shortCodeData = [
                'appointment_id'            => $this->bookingData->getId(),
                'service_id'                => $this->bookingData->getInfo()->service_id,
                'staff_id'                  => $this->bookingData->getInfo()->staff_id,
                'customer_id'               => $this->bookingData->getInfo()->customer_id,
                'location_id'               => $this->bookingData->getInfo()->location_id
            ];

            $replacedData = Config::getShortCodeService()->replace(strip_tags($woocommerdeOrderDetails, '<p><br>'), $shortCodeData);

            $additionalData .= '<div>' . ($replacedData) . '</div>';
        }

        return $additionalData;
    }

    public static function productAdditionalDataStatic($bookingData)
    {
        $additionalData = '';

        $woocommerdeOrderDetails = Helper::getOption('woocommerce_order_details', "Date: {appointment_date}\nTime: {appointment_start_time}\nStaff: {staff_name}", false);
        $woocommerdeOrderDetails = trim($woocommerdeOrderDetails);

        if (! empty($woocommerdeOrderDetails)) {
            $shortCodeData = [
                'appointment_id'            => $bookingData->getId(),
                'service_id'                => $bookingData->getInfo()->service_id,
                'staff_id'                  => $bookingData->getInfo()->staff_id,
                'customer_id'               => $bookingData->getInfo()->customer_id,
                'location_id'               => $bookingData->getInfo()->location_id
            ];

            $replacedData = Config::getShortCodeService()->replace(strip_tags($woocommerdeOrderDetails, '<p><br>'), $shortCodeData);

            $additionalData .= '<div>' . (nl2br($replacedData)) . '</div>';
        }

        return $additionalData;
    }

    public function isAppointmentExists()
    {
        if ($this->cartItemDetached) return false;
        $appointmentInf = Appointment::get($this->appointmentId);

        return $appointmentInf && $appointmentInf->id > 0;
    }

    public function isAppointmentPaid()
    {
        $info = $this->bookingData->getInfo();

        return $info !== null && $info->payment_status === 'paid';
    }

    public function removeAppointment()
    {
        $isPaid        = $this->isAppointmentPaid();
        // Payment alone forces preservation, so only pay for the order lookup when unpaid.
        $placedOrderId = $isPaid ? null : Container::get(WcOrderRepository::class)->getOrderIdByAppointmentId($this->appointmentId);

        if (! self::shouldPreserveAppointment($isPaid, $placedOrderId)) {
            AppointmentService::deleteAppointment($this->appointmentId);
        }

        // Unset before remove_cart_item so the re-entrant woocommerce_remove_cart_item
        // hook can't loop back here when the appointment is preserved (not deleted).
        unset(WooCommerceGateway::$cartItems[ $this->appointmentId ]);

        WC()->cart->remove_cart_item($this->cartItemKey);
    }

    public static function shouldPreserveAppointment(bool $isPaid, ?int $placedOrderId): bool
    {
        return $isPaid || $placedOrderId !== null;
    }

    public function setCartItemKey($key)
    {
        $this->cartItemKey = $key;
    }

    public function setAppointmentId($appointmentId)
    {
        $this->appointmentId = $appointmentId;
    }

    /**
     * Validate the stored appointment's slot before offering it for payment.
     * Groomer House compatibility patch 2026-10-23: Booknetic 5.10 stores
     * starts_at/id, not the legacy date/start_time/appointment_id fields.
     */
    private function checkSelectedTimeslot()
    {
        $bData = $this->bookingData;
        $info  = $bData->getInfo();

        if (empty($info)) {
            $this->detachCartItemOnly();
            return;
        }

        // Never pass an empty date to DateTime or invent a replacement date.
        $startsAt = $info->starts_at ?? null;
        if (! is_numeric($startsAt) || (int) $startsAt <= 0) {
            $this->detachCartItemOnly();
            return;
        }

        if ($info->payment_status === 'pending') {
            return;
        }

        $staff = $bData->getStaffInf();
        $service = $bData->getServiceInf();
        if (! $staff || ! $service) {
            $this->detachCartItemOnly();
            return;
        }

        $extras = [];

        foreach (AppointmentExtra::where('appointment_id', $bData->getId())->fetchAll() as $extraInf) {
            $extras[] = [
                'id'       => $extraInf->extra_id,
                'quantity' => $extraInf->quantity,
                'price'    => $extraInf->price,
                'duration' => $extraInf->duration,
                'customer' => $info->customer_id
            ];
        }

        // Use the same conversion helpers as Booknetic's own TimeSlotService.
        $selectedTimeSlotInfo = new TimeSlotService(Date::dateSQL((int) $startsAt), Date::time((int) $startsAt));

        $selectedTimeSlotInfo->setStaffId($staff->id)
                             ->setServiceId($service->id)
                             ->setServiceExtras($extras)
                             ->setExcludeAppointmentId($info->id)
                             ->setCalledFromBackEnd(false)
                             ->setShowExistingTimeSlots(true);

        if (! $selectedTimeSlotInfo->isBookable()) {
            // A stale cart must not delete this or any other stored appointment.
            $this->detachCartItemOnly();
        }
    }

    private function detachCartItemOnly(): void
    {
        $this->cartItemDetached = true;
        // Intentionally do NOT call remove_cart_item(), emptyCart() or
        // removeAppointment(): the vendor's cart hook deletes unpaid bookings.
        if (WC()->cart) {
            unset(WC()->cart->cart_contents[$this->cartItemKey]);
        }
        if (WC()->session) {
            $cart = (array) WC()->session->get('cart', []);
            unset($cart[$this->cartItemKey]);
            WC()->session->set('cart', $cart);
        }
        if (function_exists('wc_add_notice') && (! function_exists('wc_has_notice') || ! wc_has_notice('Wybrany termin nie jest dostępny do opłacenia. Wybierz ponownie kurs i termin w panelu rezerwacji.', 'notice'))) {
            wc_add_notice('Wybrany termin nie jest dostępny do opłacenia. Wybierz ponownie kurs i termin w panelu rezerwacji.', 'notice');
        }
    }

    public function getAppointmentID()
    {
        return $this->bookingData->getInfo() ? $this->bookingData->getInfo()->id : 0;
    }
}
