import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TiptapRenderer } from "../components/public/TiptapRenderer";

/**
 * Unit tests — Tiptap link scheme safety.
 *
 * Verifies that the public TiptapRenderer enforces URL scheme validation
 * on link marks. Only http, https, and mailto schemes are rendered as
 * clickable links. All other schemes (javascript, data, vbscript, file,
 * empty, malformed, non-string) are rejected — the link text is preserved
 * as plain content but NO clickable <a> is rendered.
 */

function makeDoc(linkHref: unknown, linkText = "Click here") {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: linkText,
            marks: [{ type: "link", attrs: { href: linkHref } }],
          },
        ],
      },
    ],
  };
}

describe("TiptapRenderer link scheme safety", () => {
  it("renders https:// as a clickable link", () => {
    render(<TiptapRenderer content={makeDoc("https://example.com")} />);
    const link = screen.getByText("Click here");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("renders http:// as a clickable link", () => {
    render(<TiptapRenderer content={makeDoc("http://example.com")} />);
    const link = screen.getByText("Click here");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("http://example.com");
  });

  it("renders mailto: as a link (no target=_blank)", () => {
    render(<TiptapRenderer content={makeDoc("mailto:test@example.com")} />);
    const link = screen.getByText("Click here");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("mailto:test@example.com");
    expect(link.getAttribute("target")).toBeNull();
  });

  it("does NOT render javascript: as a clickable href", () => {
    render(<TiptapRenderer content={makeDoc("javascript:alert(1)")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
    expect(text.tagName).toBe("P"); // or span — just not <a>
  });

  it("does NOT render data: as a clickable href", () => {
    render(<TiptapRenderer content={makeDoc("data:text/html,<script>alert(1)</script>")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("does NOT render vbscript: as a clickable href", () => {
    render(<TiptapRenderer content={makeDoc("vbscript:msgbox(1)")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("does NOT render file: as a clickable href", () => {
    render(<TiptapRenderer content={makeDoc("file:///etc/passwd")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("does NOT render malformed href as a clickable link", () => {
    render(<TiptapRenderer content={makeDoc("not-a-url")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("does NOT render empty href as a clickable link", () => {
    render(<TiptapRenderer content={makeDoc("")} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("does NOT render missing href (undefined) as a clickable link", () => {
    render(<TiptapRenderer content={makeDoc(undefined)} />);
    const text = screen.getByText("Click here");
    expect(text.tagName).not.toBe("A");
  });

  it("preserves visible child text for rejected links", () => {
    render(<TiptapRenderer content={makeDoc("javascript:alert(1)", "Dangerous link")} />);
    expect(screen.getByText("Dangerous link")).toBeInTheDocument();
  });

  it("renders nested formatting inside a safe link", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "bold link",
              marks: [
                { type: "link", attrs: { href: "https://example.com" } },
                { type: "bold" },
              ],
            },
          ],
        },
      ],
    };
    const { container } = render(<TiptapRenderer content={doc} />);
    // When marks are ordered [link, bold], the outer element is <a> wrapping <strong>
    // When marks are ordered [bold, link], the outer element is <strong> wrapping <a>
    // Either way, an <a> with the safe href must exist in the output
    const anchor = container.querySelector("a[href='https://example.com']");
    expect(anchor).not.toBeNull();
    expect(anchor!.textContent).toBe("bold link");
  });
});
