

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
 */

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

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
      case "link":
        result = (
          <a
            href={mark.attrs?.href as string}
            target="_blank"
            rel="noopener noreferrer"
            key={mark.type}
          >
            {result}
          </a>
        );
        break;
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
