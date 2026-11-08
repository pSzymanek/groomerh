export const businessAddress = "ul. Strzelców Bytomskich 226a/1, 41-933 Bytom";

const query = encodeURIComponent(businessAddress);

/** Google Maps iframe embed (no API key needed). */
export const mapEmbedUrl = (zoom = 16) => `https://maps.google.com/maps?q=${query}&hl=pl&z=${zoom}&output=embed`;
/** Universal link – on Android/iOS opens the Google Maps app when installed. */
export const mapPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
export const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
