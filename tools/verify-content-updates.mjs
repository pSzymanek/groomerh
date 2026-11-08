import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { load } from "cheerio";

let checks = 0;
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
async function moduleExports(file) {
  const source = await readFile(file, "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: createRequire(import.meta.url) });
  return exports;
}
const { currentBusinessStats } = await moduleExports("src/lib/business-stats.ts");
for (const [old, updated] of [
  ["9 lat doświadczenia", "ponad 10 lat doświadczenia"],
  ["Ponad 9 lat doświadczenia", "ponad 10 lat doświadczenia"],
  ["9&nbsp;lat doświadczenia", "ponad 10 lat doświadczenia"],
  ["Zaufało mi już ponad 50 kursantów", "Zaufało mi już ponad 100 kursantów"],
  ["50+ kursantów", "100+ kursantów"],
  ["50 kursantek", "100 kursantek"],
  ["150 kursantów; 19 lat doświadczenia; 4500 zł; 7 lat; 41-933", "150 kursantów; 19 lat doświadczenia; 4500 zł; 7 lat; 41-933"],
]) equal(currentBusinessStats(old), updated, `Targeted business fact: ${old}`);
const { currentCourseFaq } = await moduleExports("src/lib/course-faq.ts");
const original = '<div><div><div><a href="/">Jak mogę zapłacić za kurs?</a></div><div><p>Przelew: 31 1050 1230 1000 0090 8251 8383.</p><a href="tel:+48607252521">Zadzwoń</a></div></div><div><div><a href="/">Jak długo trwa kurs?</a></div><div><p>40, 80 lub 120 godzin.</p></div></div></div>';
let $ = load(currentCourseFaq(original));
equal($("a[href='/']").length, 0, "No homepage navigation from FAQ questions");
equal($(".faq-question").length, 2, "Questions preserved as static text");
equal($(".faq-online-payment").length, 1, "Online payment information added");
equal($(".faq-online-payment a").attr("href"), "/rezerwacja/#szkolenia", "Intentional answer link points to booking panel");
equal($("a[href^='tel:']").length, 1, "Answer contact links preserved");
equal($("body").text().includes("31 1050 1230 1000 0090 8251 8383"), true, "Existing bank details preserved");
$ = load(currentCourseFaq(currentCourseFaq(original)));
equal($(".faq-online-payment").length, 1, "No duplicate payment text on repeated processing");
$ = load(currentCourseFaq('<section><details><summary>Czy mogę zacząć bez doświadczenia?</summary><div><p>Tak, uczymy od podstaw.</p></div></details></section>'));
equal($("summary,details").length, 0, "Native FAQ questions are not clickable either");
equal($(".faq-question").text(), "Czy mogę zacząć bez doświadczenia?", "Native question preserved");
equal($(".faq-item p").text(), "Tak, uczymy od podstaw.", "Native answer remains visible");
const pages = JSON.parse(await readFile("archive/current/normalized-pages.json", "utf8"));
for (const page of pages) {
  for (const block of page.blocks) {
    const refreshed = currentBusinessStats(block.text || block.html || "");
    equal(/\b9\s+lat\s+doświadczenia|\b50\+?\s+kursant/i.test(load(refreshed).text()), false, `No old stats in displayed source ${page.path}`);
  }
}
console.log(JSON.stringify({ checks, result: "PASS", scope: "Displayed statistics across archived content and static FAQ/payment copy; no archive mutation" }));
