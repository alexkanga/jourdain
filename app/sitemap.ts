import type { MetadataRoute } from "next";
import { listPublishedOfferIds } from "@/lib/server/services/public-offers";

/**
 * Sitemap — lists all PUBLISHED offers (TD-029, ADR-0009).
 * DRAFT, SUSPENDED, ARCHIVED offers are NOT included (BR-025).
 * /admin/* is NOT included.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const offers = await listPublishedOfferIds();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const offerEntries: MetadataRoute.Sitemap = offers.map((offer) => ({
    url: `${base}/offres/${offer.id}`,
    lastModified: offer.publishedAt ?? undefined,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: base,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...offerEntries,
  ];
}
