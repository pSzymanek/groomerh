// Verified in Booknetic on 12 October 2026. Service IDs and existing settings
// are preserved; calendar slots represent the start, not the full course hours.
export const coursePackages = [
  { id: 1, name: "Pakiet 1", hours: 40, price: 4500, deposit: 500, capacity: 4, icon: "graduation" as const },
  { id: 2, name: "Pakiet 2", hours: 80, price: 6500, deposit: 500, capacity: 4, icon: "paw" as const },
  { id: 3, name: "Pakiet 3", hours: 120, price: 8500, deposit: 500, capacity: 4, icon: "scissors" as const },
];

export const courseProgram = [
  "kąpiel, suszenie i czesanie",
  "pielęgnacja łap, uszu i pazurków",
  "strzyżenie i trymowanie",
  "praca z psami spokojnymi i lękliwymi",
  "obsługa profesjonalnego sprzętu",
  "organizacja pracy w salonie groomerskim",
];

export function formatCoursePrice(price: number): string {
  return new Intl.NumberFormat("pl-PL").format(price);
}

// Keep archived editorial pages consistent with the currently verified offer.
// Do not rewrite the archive itself or prices in unrelated salon/blog content.
export function currentCourseOffer(html: string): string {
  return html
    .replace(/\b3[\s\u00a0]*900(?=\s*(?:zł|PLN))/g, "4500")
    .replace(/\b5[\s\u00a0]*900(?=\s*(?:zł|PLN))/g, "6500")
    .replace(/\b7[\s\u00a0]*500(?=\s*(?:zł|PLN))/g, "8500")
    // Approved wording correction only: amount and payment deadlines stay intact.
    .replace(/\bzadatku\b/g, "zaliczki")
    .replace(/\bwpłacić zadatek\b/g, "wpłacić zaliczkę")
    .replace(/\bZadatek można opłacić/g, "Zaliczkę można opłacić");
}
