import { readFile, writeFile } from "node:fs/promises";

// Optional native WordPress importer: exactly one Page, no users, bookings,
// orders, plugins, settings or existing page content in this file.
const html = await readFile("wordpress/sukcesy-naszych-klientow.html", "utf8");
const cdata = value => `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
await writeFile("wordpress/sukcesy-naszych-klientow.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel><title>Groomer House</title><link>https://wp.groomerhouse.pl</link><description>Jedna strona redakcyjna</description><language>pl-PL</language><wp:wxr_version>1.2</wp:wxr_version><wp:base_site_url>https://wp.groomerhouse.pl</wp:base_site_url><wp:base_blog_url>https://wp.groomerhouse.pl</wp:base_blog_url>
<item><title>${cdata("Sukcesy naszych klientów")}</title><link>https://wp.groomerhouse.pl/index.php/sukcesy-naszych-klientow/</link><dc:creator>${cdata("groomerhouse")}</dc:creator><guid isPermaLink="false">https://groomerhouse.pl/sukcesy-naszych-klientow/</guid><description></description><content:encoded>${cdata(html)}</content:encoded><excerpt:encoded></excerpt:encoded><wp:post_name>${cdata("sukcesy-naszych-klientow")}</wp:post_name><wp:status>${cdata("publish")}</wp:status><wp:post_parent>0</wp:post_parent><wp:menu_order>0</wp:menu_order><wp:post_type>${cdata("page")}</wp:post_type><wp:post_password></wp:post_password><wp:comment_status>closed</wp:comment_status><wp:ping_status>closed</wp:ping_status></item>
</channel></rss>
`, "utf8");
console.log("wordpress/sukcesy-naszych-klientow.xml");
