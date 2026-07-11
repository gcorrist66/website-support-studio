type ArticleFaq = { q: string; a: string };

const stripMarkdown = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function extractArticleFaqs(markdown: string): ArticleFaq[] {
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const faqStart = withoutFrontmatter.search(/^##\s+(Frequently asked questions|FAQ)\s*$/im);
  if (faqStart === -1) return [];

  const faqSection = withoutFrontmatter.slice(faqStart);
  const nextSection = faqSection.slice(1).search(/\n##\s+/);
  const sectionEnd = nextSection === -1 ? faqSection.length : nextSection + 1;
  const ctaStart = faqSection.search(/^\*This article was written and published by Website Support Studio\b/im);
  const scopedFaqSection = faqSection.slice(
    0,
    ctaStart === -1 ? sectionEnd : Math.min(sectionEnd, ctaStart),
  );
  const matches = Array.from(scopedFaqSection.matchAll(/^###\s+(.+?)\s*$([\s\S]*?)(?=^###\s+|(?![\s\S]))/gm));

  return matches
    .map((match) => ({
      q: stripMarkdown(match[1] ?? ""),
      a: stripMarkdown(match[2] ?? ""),
    }))
    .filter((faq) => faq.q.length > 0 && faq.a.length > 0);
}
