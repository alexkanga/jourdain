import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { OfferDetail } from "../components/public/OfferDetail";
import type { PublicOfferRow } from "../lib/server/services/public-offers";

/**
 * Public render tests — application_url and source_url defense in depth.
 * Verifies that even if unsafe values are stored in the database (bypassing
 * save-time Zod validation), the public renderer does NOT render them as
 * clickable <a href> links.
 */

function makeOffer(overrides: Partial<PublicOfferRow> = {}): PublicOfferRow {
  return {
    id: "test-id",
    title: "Test Offer",
    description: { type: "doc", content: [{ type: "paragraph" }] },
    status: "PUBLISHED",
    company: null,
    sector: null,
    category: null,
    contractType: null,
    educationLevel: null,
    experience: null,
    location: null,
    sourcePublicationDate: null,
    applicationDeadline: null,
    sourceName: null,
    sourceUrl: null,
    applicationModalities: null,
    applicationEmail: null,
    applicationUrl: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as PublicOfferRow;
}

describe("OfferDetail URL render-time safety — application_url", () => {
  it("renders safe https application_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: "https://apply.example.com" })} />,
    );
    const link = container.querySelector('a[href="https://apply.example.com"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("target")).toBe("_blank");
    expect(link!.getAttribute("rel")).toContain("noopener");
    expect(link!.getAttribute("rel")).toContain("noreferrer");
  });

  it("renders safe http application_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: "http://apply.example.com" })} />,
    );
    const link = container.querySelector('a[href="http://apply.example.com"]');
    expect(link).not.toBeNull();
  });

  it("does NOT render javascript: application_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: "javascript:alert(1)" })} />,
    );
    const unsafeLink = container.querySelector('a[href="javascript:alert(1)"]');
    expect(unsafeLink).toBeNull();
    // No <a> with "Candidater en ligne" should exist
    const links = container.querySelectorAll("a");
    const appLink = Array.from(links).find((a) => a.textContent === "Candidater en ligne");
    expect(appLink).toBeUndefined();
  });

  it("does NOT render data: application_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: "data:text/html,<script>x</script>" })} />,
    );
    expect(container.querySelector('a[href^="data:"]')).toBeNull();
  });

  it("does NOT render vbscript: application_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: "vbscript:msgbox(1)" })} />,
    );
    expect(container.querySelector('a[href^="vbscript:"]')).toBeNull();
  });

  it("omits application_url link when value is null", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ applicationUrl: null })} />,
    );
    const links = container.querySelectorAll("a");
    const appLink = Array.from(links).find((a) => a.textContent === "Candidater en ligne");
    expect(appLink).toBeUndefined();
  });
});

describe("OfferDetail URL render-time safety — source_url", () => {
  it("renders safe https source_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ sourceUrl: "https://source.example.com", sourceName: "Source" })} />,
    );
    const link = container.querySelector('a[href="https://source.example.com"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("target")).toBe("_blank");
    expect(link!.getAttribute("rel")).toContain("noopener");
    expect(link!.getAttribute("rel")).toContain("noreferrer");
  });

  it("renders safe http source_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ sourceUrl: "http://source.example.com", sourceName: "Source" })} />,
    );
    const link = container.querySelector('a[href="http://source.example.com"]');
    expect(link).not.toBeNull();
  });

  it("does NOT render javascript: source_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ sourceUrl: "javascript:alert(1)", sourceName: "Source" })} />,
    );
    expect(container.querySelector('a[href="javascript:alert(1)"]')).toBeNull();
    // "Voir la source" link should NOT exist
    const links = container.querySelectorAll("a");
    const sourceLink = Array.from(links).find((a) => a.textContent === "Voir la source");
    expect(sourceLink).toBeUndefined();
  });

  it("does NOT render data: source_url as clickable link", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ sourceUrl: "data:text/html,x", sourceName: "Source" })} />,
    );
    expect(container.querySelector('a[href^="data:"]')).toBeNull();
  });

  it("omits source_url link when value is null but sourceName present", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({ sourceUrl: null, sourceName: "Source Name" })} />,
    );
    // sourceName text should still be present
    expect(container.textContent).toContain("Source Name");
    // But no "Voir la source" link
    const links = container.querySelectorAll("a");
    const sourceLink = Array.from(links).find((a) => a.textContent === "Voir la source");
    expect(sourceLink).toBeUndefined();
  });
});

describe("OfferDetail legacy/stored unsafe value defense", () => {
  it("remains safe when application_url = javascript:alert(1) stored in DB", () => {
    // This simulates an offer with unsafe data already in the database
    // (bypassing save-time validation). The public renderer must NOT
    // render a clickable unsafe link.
    const { container } = render(
      <OfferDetail offer={makeOffer({
        applicationUrl: "javascript:alert(1)",
        applicationModalities: "Contact us",
      })} />,
    );
    // Modalities text should still render
    expect(container.textContent).toContain("Contact us");
    // But NO unsafe href
    expect(container.querySelector('a[href="javascript:alert(1)"]')).toBeNull();
    // No "Candidater en ligne" link
    const links = container.querySelectorAll("a");
    const appLink = Array.from(links).find((a) => a.textContent === "Candidater en ligne");
    expect(appLink).toBeUndefined();
  });

  it("remains safe when source_url = data:text/html,... stored in DB", () => {
    const { container } = render(
      <OfferDetail offer={makeOffer({
        sourceUrl: "data:text/html,<script>alert(1)</script>",
        sourceName: "Bad Source",
      })} />,
    );
    // Source name should still render
    expect(container.textContent).toContain("Bad Source");
    // But NO unsafe href
    expect(container.querySelector('a[href^="data:"]')).toBeNull();
    // No "Voir la source" link
    const links = container.querySelectorAll("a");
    const sourceLink = Array.from(links).find((a) => a.textContent === "Voir la source");
    expect(sourceLink).toBeUndefined();
  });
});
