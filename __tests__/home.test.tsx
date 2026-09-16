import { describe, it, expect } from "vitest";
import { TiptapRenderer } from "../components/public/TiptapRenderer";
import { render, screen } from "@testing-library/react";

describe("TiptapRenderer (replaces Home test)", () => {
  it("renders a simple paragraph", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
      ],
    };
    render(<TiptapRenderer content={doc} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
});
