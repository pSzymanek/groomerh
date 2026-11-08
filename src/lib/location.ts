export const businessAddress = "ul. Strzelców Bytomskich 226a/1, 41-933 Bytom";

const query = encodeURIComponent(businessAddress);

/** Google Maps iframe embed (no API key needed). */
export const mapEmbedUrl = (zoom = 16) => `https://maps.google.com/maps?q=${query}&hl=pl&z=${zoom}&output=embed`;
/** Groomer House Google business profile (map pin + reviews); opens the Google Maps app on mobile when installed. */
export const mapPlaceUrl = "https://share.google/JekIgYv3gchotw5NF";
export const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
