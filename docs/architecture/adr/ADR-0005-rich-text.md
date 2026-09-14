# ADR-0005 — Rich Text: Tiptap JSON/JSONB + Safe Server Rendering

STATUS:           ACCEPTED
DATE:             2026-09-15
DECISION OWNERS:  OWNER
SOURCE TD:        TD-013
RELATED REQ IDS:  BR-034

CONTEXT:
S5 BR-034 requires the offer description to preserve professional formatting (paragraphs, lists, headings, links) entered by the ADMIN, with safe public rendering. The previous S6 draft had an internally inconsistent rendering contract (generateHTML string + "no dangerouslySetInnerHTML" without explaining how HTML was actually rendered).

DECISION:
- Editor (admin): Tiptap (@tiptap/react + starter-kit + extension-link) — WYSIWYG, produces structured JSON.
- Storage: Tiptap JSON (ProseMirror document) in PostgreSQL `jsonb` column. No raw HTML in DB.
- Public rendering: Tiptap React server-side renderer — produces safe React elements from JSON directly inside a Server Component. No generateHTML() string roundtrip. No dangerouslySetInnerHTML with user content.
- If a HTML string is ever needed in the future (RSS, email — not in V1): generate via generateHTML() + sanitize-html with an explicit tag/attribute allowlist, then render via dangerouslySetInnerHTML ONLY after verified sanitization. This path is documented but NOT used in V1.

ALTERNATIVES CONSIDERED:
- Markdown editor + textarea — rejected: requires ADMIN to know Markdown syntax; contradicts "simplicity of use" priority 1.
- Plain textarea — rejected: no formatting; fails BR-034.
- generateHTML() + dangerouslySetInnerHTML — rejected (for V1 public rendering): introduces an HTML-string roundtrip that requires sanitization; the React renderer is safer by construction (only known node types are rendered; arbitrary HTML is ignored by Tiptap's schema).

RATIONALE:
Tiptap JSON → React server-side renderer is the safest rendering contract: structured JSON in DB → safe React elements on the server → safe HTML sent to client. No sanitization needed because the renderer is safe by construction. The HTML-string path is documented for future use only if needed.

CONSEQUENCES:
+ No dangerouslySetInnerHTML with user content in V1.
+ No sanitize-html dependency needed in V1.
+ Tiptap JSON is structured and inspectable (can validate schema, extract plain text for SEO, etc.).
- Tiptap React renderer must run server-side (requires @tiptap/react in a Server Component — supported by Next.js App Router).
- If a future extension enables raw HTML paste, sanitization must be added (documented in TD-013 revised).

VERIFICATION:
Integration test: ADMIN enters description with paragraphs, list, heading, link → save → public detail page renders all elements correctly with formatting preserved. No raw HTML string generated for public rendering.

SUPERSEDES:       NONE
SUPERSEDED BY:    NONE
REFERENCES:       S6 §5 (TD-013 revised), S6 §14.3 (output encoding)
