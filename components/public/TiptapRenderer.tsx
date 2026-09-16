
/**
 * TiptapRenderer — deterministic JSON-to-React renderer for public offer descriptions.
 *
 * Renders the approved Tiptap V1 subset (paragraphs, headings 1-3, bullet lists,
 * ordered lists, links, bold, italic) from the stored JSONB Tiptap document
 * directly to safe React elements. No dangerouslySetInnerHTML. No raw HTML.
 * No editor instance. No client JavaScript. Pure Server Component.
 *
 * Per ADR-0005: "Tiptap JSON → React server-side renderer — produces safe
 * React elements from JSON directly inside a Server Component."
 *
 * This is a small deterministic renderer — not a generalized rich-text framework.
 * Only known node types from the approved V1 subset are rendered; unknown
 * types are safely ignored.
 *
 * LINK SAFETY: Tiptap link marks are validated against an allowlist of URL
 * schemes (http, https, mailto). Unsafe schemes (javascript:, data:, vbscript:,
 * file:, etc.) are rejected — the link text is preserved as plain inline content
 * but NO clickable <a href> is rendered. Empty, non-string, or malformed href
 * values are also rejected.
 */

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

/**
 * Safe-link policy: validate a Tiptap link href.
 * Returns a safe href string if the scheme is allowed, or null if rejected.
 *
 * Allowed schemes: http, https, mailto
 * Rejected: javascript, data, vbscript, file, empty, non-string, malformed
 */
function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const trimmed = href.trim();
  if (trimmed === "") return null;
  const lower = trimmed.toLowerCase();
  // Explicitly reject dangerous schemes
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return null;
  }
  // Allow only http, https, mailto
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:")
  ) {
    return trimmed;
  }
  // Reject everything else (relative URLs, protocol-relative, unknown schemes)
  return null;
}

function renderMarks(text: string, marks?: { type: string; attrs?: Record<string, unknown> }[]): React.ReactNode {
  if (!marks || marks.length === 0) return text;
  let result: React.ReactNode = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result = <strong key={mark.type}>{result}</strong>;
        break;
      case "italic":
        result = <em key={mark.type}>{result}</em>;
        break;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (href === null) {
          // Unsafe or invalid href: preserve the link text as plain content
          // but do NOT render a clickable <a> element.
          break;
        }
        if (href.startsWith("mailto:")) {
          result = (
            <a href={href} key={mark.type}>
              {result}
            </a>
          );
        } else {
          result = (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              key={mark.type}
            >
              {result}
            </a>
          );
        }
        break;
      }
      default:
        // Unknown marks are ignored (safe by construction)
        break;
    }
  }
  return result;
}

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  switch (node.type) {
    case "doc":
      return <div key={key}>{node.content?.map((child, i) => renderNode(child, i))}</div>;

    case "paragraph":
      return <p key={key}>{node.content?.map((child, i) => renderInline(child, i))}</p>;

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const Tag = (`h${Math.min(Math.max(level, 1), 3)}`) as "h1" | "h2" | "h3";
      return <Tag key={key}>{node.content?.map((child, i) => renderInline(child, i))}</Tag>;
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return <li key={key}>{node.content?.map((child, i) => renderNode(child, i))}</li>;

    case "text":
      return renderMarks(node.text ?? "", node.marks);

    default:
      return null;
  }
}

function renderInline(node: TiptapNode, key: number): React.ReactNode {
  if (node.type === "text") {
    return renderMarks(node.text ?? "", node.marks);
  }
  return renderNode(node, key);
}

export function TiptapRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return null;
  const doc = content as TiptapNode;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return null;
  return <>{doc.content.map((child, i) => renderNode(child, i))}</>;
}
