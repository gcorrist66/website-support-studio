type ArticleFaq = { q: string; a: string };

const stripMarkdown = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function extractArticleFaqs(markdown: string): ArticleFaq[] {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const faqStart = withoutFrontmatter.search(/^##\s+Frequently asked questions\s*$/im);
  if (faqStart === -1) return [];

  const faqSection = withoutFrontmatter.slice(faqStart);
  const nextSection = faqSection.slice(1).search(/\n##\s+/);
  const scopedFaqSection = nextSection === -1 ? faqSection : faqSection.slice(0, nextSection + 1);
  const matches = Array.from(scopedFaqSection.matchAll(/^###\s+(.+?)\s*$([\s\S]*?)(?=^###\s+|(?![\s\S]))/gm));

  return matches
    .map((match) => ({
      q: stripMarkdown(match[1] ?? ""),
      a: stripMarkdown(match[2] ?? ""),
    }))
    .filter((faq) => faq.q.length > 0 && faq.a.length > 0);
}
