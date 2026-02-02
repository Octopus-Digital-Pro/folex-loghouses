/**
 * Portable Text block (Sanity) with optional markDefs for links.
 */
type PortableTextBlock = {
  children?: Array<{_key?: string; text?: string; marks?: string[]}>;
  markDefs?: Array<{
    _key: string;
    _type?: string;
    href?: string;
    blank?: boolean;
  }>;
};

/**
 * Converts Sanity Portable Text blocks to HTML (handles strong, em, and link marks).
 */
export function portableTextToHtml(
  blocks: PortableTextBlock[] | undefined
): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";

  return blocks
    .map((block) => {
      const markDefsMap = (block.markDefs || []).reduce(
        (acc, def) => ({...acc, [def._key]: def}),
        {} as Record<string, {href?: string; blank?: boolean}>
      );
      const html = (block.children || [])
        .map((child) => {
          let text = escapeHtml(child.text || "");
          (child.marks || []).forEach((markKey) => {
            const def = markDefsMap[markKey];
            if (def?.href !== undefined) {
              const href = escapeHtml(def.href);
              const target = def.blank
                ? ' target="_blank" rel="noopener noreferrer"'
                : "";
              text = `<a href="${href}"${target}>${text}</a>`;
            } else if (markKey === "strong") {
              text = `<strong>${text}</strong>`;
            } else if (markKey === "em") {
              text = `<em>${text}</em>`;
            }
          });
          return text;
        })
        .join("");
      return html
        ? `<p class="prose-p:first:mt-0 prose-p:last:mb-0">${html}</p>`
        : "";
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
