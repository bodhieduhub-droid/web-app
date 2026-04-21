export function parseMarkdown(markdown: string): string {
  if (!markdown) return "";
  let html = markdown;

  // Headers
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-bold mt-5 mb-2 text-[#2f4d36]">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-[#1b3022]">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-black mt-8 mb-4 text-[#1b3022]">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-black mt-10 mb-6 text-[#1b3022]">$1</h1>');

  // Bold / Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-emerald-700 underline hover:text-emerald-900">$1</a>');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-5 list-disc mb-1">$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li class="ml-5 list-disc mb-1">$1</li>');
  
  // Wrap isolated list items
  html = html.replace(/(<li.*<\/li>)/gim, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\n<ul>/gim, '\n');

  // Paragraphs
  const paragraphs = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<ul')) return p;
    return `<p class="mb-4 leading-relaxed text-[#405042] text-lg">${p}</p>`;
  });

  html = paragraphs.join('');

  // Line breaks inside paragraphs
  html = html.replace(/\n/gim, '<br />');

  return html;
}
