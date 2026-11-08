import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const patched = await readFile("wordpress/booknetic-payment-wc/App/Providers/WcProductObject.php", "utf8");
const start = patched.indexOf("    /**\n     * Validate the stored appointment's slot");
const end = patched.indexOf("    public function getAppointmentID()", start);
if (start < 0 || end < 0) throw new Error("Compatibility patch markers missing");
const oldMethod = `    /**
     * Sechilen timeslot 10 deqiqe erzinde statusu pending olur ki, bu muddet erzinde 2-ci user eyni timeslotu seche bilmesin.
     * Lakin 10 deqiqe sonra avtomatik status cancel olur ve mushteriler artiq bu timeslotu seche bilerler.
     * Eyni timeslota 2 mushteri rezervasiya etmesinin qarshisini almaq uchun bu metod yaradilib...
     */
    private function checkSelectedTimeslot()
    {
        $bData = $this->bookingData;
        $info  = $bData->getInfo();

        if (empty($info)) {
            return;
        }

        if ($info->payment_status === 'pending') {
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

        $selectedTimeSlotInfo = new TimeSlotService($info->date, $info->start_time);

        $selectedTimeSlotInfo->setStaffId($bData->getStaffInf()->id)
                             ->setServiceId($bData->getServiceInf()->id)
                             ->setServiceExtras($extras)
                             ->setExcludeAppointmentId($info->appointment_id)
                             ->setCalledFromBackEnd(false)
                             ->setShowExistingTimeSlots(true);

        if (! $selectedTimeSlotInfo->isBookable()) {
            WooCommerceGateway::emptyCart();
        }
    }

`;
const before = (patched.slice(0, start) + oldMethod + patched.slice(end))
  .replace("use BookneticApp\\Providers\\Helpers\\Date;\n", "")
  .replace("    private bool $cartItemDetached = false;\n", "")
  .replace("        if ($this->cartItemDetached) return false;\n", "");
const hash = createHash("sha256").update(before.trimEnd() + "\n").digest("hex");
if (hash !== "480dc0f78cb9db893848c26dba7ca0241ef17e6934c29ad54dabe6707dd231f1") throw new Error(`Original vendor backup does not match live source: ${hash}`);
await mkdir("export/proofs-20261023", {recursive:true});
await writeFile("export/proofs-20261023/WcProductObject.before.php", before);
console.log(JSON.stringify({originalVerifiedSHA256:hash, patchedSHA256:createHash("sha256").update(patched).digest("hex")}));
