"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

/**
 * TiptapEditor — minimal V1 Tiptap editor for the admin offer form.
 *
 * UI-03: improved visual frame — toolbar separation, content area,
 * minimum height, focus state, Methodist tokens. Behavior and JSON
 * storage UNCHANGED.
 *
 * V1 subset (per WP-003 contract): paragraphs, headings 1-3, bullet lists,
 * ordered lists, links, bold, italic. No images, tables, code blocks, embeds.
 *
 * Canonical storage: Tiptap JSON → PostgreSQL JSONB (schema column is jsonb
 * from WP-002). No raw HTML storage; no dangerouslySetInnerHTML.
 *
 * E2e selectors preserved: [contenteditable='true'], hidden name="description".
 */

export type TiptapEditorProps = {
  name: string;
  initialContent?: object | null;
  onChange?: (json: object) => void;
};

export function TiptapEditor({ name, initialContent, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      if (onChange) onChange(json);
      const hidden = document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
      if (hidden) hidden.value = JSON.stringify(json);
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-sm border border-border-strong transition-colors duration-fast focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
      {/* Hidden input holds the Tiptap JSON for form submission */}
      <input
        type="hidden"
        name={name}
        defaultValue={initialContent ? JSON.stringify(initialContent) : ""}
      />
      {/* Toolbar — V1 subset only */}
      <div className="flex flex-wrap gap-1 border-b border-border bg-surface-muted p-2">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          className="font-bold"
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          className="italic"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="H1"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2"
        />
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="H3"
        />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Liste"
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Liste ord."
        />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const prev = editor.getAttributes("link")?.href as string | undefined;
            const url = window.prompt("URL du lien", prev ?? "https://");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          label="Lien"
        />
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 min-h-[240px] focus:outline-none" />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-sm px-2 py-1 text-xs transition-colors duration-fast ${active ? "bg-brand-surface text-brand-primary" : "text-text-secondary hover:bg-surface hover:text-text-primary"} ${className}`}
    >
      {label}
    </button>
  );
}
