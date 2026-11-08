export const businessStats = {
  experienceYears: 10,
  graduates: 100,
} as const;

// Refresh the displayed business facts without rewriting historical WP backups,
// course prices, dates, addresses or unrelated numbers.
export function currentBusinessStats(value: string): string {
  return value
    .replace(/\b(?:ponad(?:\s|&nbsp;|&#160;|&#x0*a0;)+)?9(?:\s|&nbsp;|&#160;|&#x0*a0;)+lat(?=(?:\s|&nbsp;|&#160;|&#x0*a0;)+doświadczenia)/gi, `ponad ${businessStats.experienceYears} lat`)
    .replace(/\b50(?=\+?(?:\s|&nbsp;|&#160;|&#x0*a0;)+kursant)/gi, String(businessStats.graduates));
}
