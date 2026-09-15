import { pgTable, pgEnum, uuid, text, jsonb, date, timestamp, index } from "drizzle-orm/pg-core";

// Offer status enum — DRAFT, PUBLISHED, SUSPENDED, ARCHIVED (per S5 BR-020, S6 §9.1)
export const offerStatus = pgEnum("offer_status", [
  "DRAFT",
  "PUBLISHED",
  "SUSPENDED",
  "ARCHIVED",
]);

// Principal type enum — ADMIN, FANTOMAS (per S6 §9.3.2, V1 business principal field)
export const principalType = pgEnum("principal_type", ["ADMIN", "FANTOMAS"]);

// Offers table (per S6 §9.3.1 — central business entity)
export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: jsonb("description").notNull(), // Tiptap JSON (per ADR-0005, TD-013)
    status: offerStatus("status").notNull().default("DRAFT"),
    company: text("company"),
    sector: text("sector"),
    category: text("category"),
    contractType: text("contract_type"),
    educationLevel: text("education_level"),
    experience: text("experience"),
    location: text("location"),
    sourcePublicationDate: date("source_publication_date"),
    applicationDeadline: date("application_deadline"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    applicationModalities: text("application_modalities"),
    applicationEmail: text("application_email"),
    applicationUrl: text("application_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_offers_status").on(table.status),
    index("idx_offers_created_at_desc").on(table.createdAt),
  ]
);

// User table — extends Better Auth standard user table with V1 business fields
// principalType: input: false, returned: true — server-owned, client can NEVER set
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  emailVerified: text("email_verified"),
  name: text("name"),
  username: text("username").notNull().unique(), // Username plugin
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // V1 business principal field — server-owned (input: false, returned: true)
  principalType: principalType("principal_type").notNull().default("ADMIN"),
  // Better Auth Admin plugin internal field — NOT used for business authorization
  role: text("role"),
});

// Session table (Better Auth standard — managed by Drizzle adapter)
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Account table (Better Auth standard — credential-account records)
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"), // scrypt hash managed by Better Auth — NEVER manually written
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Verification table (Better Auth standard)
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// Rate limit table (Better Auth rate limiter with database storage)
export const rateLimits = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: text("count").notNull(),
  lastRequest: timestamp("last_request", { withTimezone: true }).notNull(),
});
