import { load } from "cheerio";

export function currentCourseFaq(html: string): string {
  const $ = load(html, null, false);
  $("a,summary,.faq-question").filter((_, element) => $(element).text().trim() === "Jak mogę zapłacić za kurs?").each((_, element) => {
    const question = $(element);
    const answer = question.is("summary")
      ? question.parent("details").children("div").first()
      : question.parent().next("div");
    if (answer.length && !answer.find(".faq-online-payment").length) {
      answer.prepend('<p class="faq-online-payment">Za kurs możesz zapłacić online na stronie, za pośrednictwem <a href="/rezerwacja/#szkolenia">panelu rezerwacji</a>. Wybierz kurs i termin, a następnie przejdź do płatności.</p>');
    }
  });

  // Historical Elementor toggles were reduced to links to /. Questions are
  // ordinary text now, and answers remain visible without any click or script.
  $("a").filter((_, element) => $(element).text().trim().endsWith("?")).each((_, element) => {
    $(element).replaceWith($("<strong>").addClass("faq-question").text($(element).text().trim()));
  });
  $("details").each((_, element) => {
    const item = $(element);
    const question = item.children("summary").first();
    if (!question.length) return;
    const replacement = $("<div>").addClass("faq-item");
    replacement.append($("<strong>").addClass("faq-question").text(question.text().trim()));
    question.remove();
    replacement.append(item.contents());
    item.replaceWith(replacement);
  });
  return $.html();
}
