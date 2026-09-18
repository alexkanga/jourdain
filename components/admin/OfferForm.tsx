"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "./TiptapEditor";
import { StatusBadge } from "./StatusBadge";
import {
  createOfferAction,
  updateOfferAction,
} from "@/app/admin/(protected)/offres/actions";
import type { OfferStatus } from "@/lib/server/services/offers";

/**
 * OfferForm — admin create/edit form for an offer.
 *
 * UI-03: migrated to Methodist design tokens. Field grouping per UI-03
 * spec sections. Uses global .form-input and .form-section classes.
 *
 * 16 ADMIN-editable fields grouped per S6 §25 + UI-03 reorganization:
 * 1. Informations principales: title (required), company, sector, category
 * 2. Profil recherché: education_level, experience
 * 3. Localisation et contrat: location, contract_type
 * 4. Dates: source_publication_date, application_deadline
 * 5. Source et candidature: source_name, source_url, application_modalities,
 *    application_email, application_url
 * 6. Description: Tiptap rich-text editor (required)
 *
 * System-managed fields (id, status, published_at, created_at, updated_at)
 * are NOT editable inputs. status is shown as a read-only badge (in edit mode).
 *
 * Field names, form semantics, and server action contracts are UNCHANGED.
 * E2e selectors preserved: getByLabel(/titre/i), [contenteditable='true'],
 * getByRole("button", { name: /enregistrer|sauvegarder|save/i }).
 */

type OfferFormProps = {
  mode: "create" | "edit";
  offer?: {
    id: string;
    title: string;
    description: unknown;
    status: string;
    company?: string | null;
    sector?: string | null;
    category?: string | null;
    contractType?: string | null;
    educationLevel?: string | null;
    experience?: string | null;
    location?: string | null;
    sourcePublicationDate?: string | null;
    applicationDeadline?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    applicationModalities?: string | null;
    applicationEmail?: string | null;
    applicationUrl?: string | null;
    publishedAt?: Date | string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  };
};

function toDateInput(value?: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDate(value?: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export function OfferForm({ mode, offer }: OfferFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (mode === "edit" && offer) {
      fd.set("id", offer.id);
    }
    const r =
      mode === "create"
        ? await createOfferAction(fd)
        : await updateOfferAction(fd);
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push("/admin/offres");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-sm border border-danger bg-danger-surface p-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      {/* 1. Informations principales */}
      <fieldset className="form-section">
        <legend className="px-1">Informations principales</legend>
        <div className="mt-3 space-y-4">
          <Field label="Titre" required>
            <input
              name="title"
              type="text"
              required
              defaultValue={offer?.title ?? ""}
              className="form-input"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Entreprise">
              <input name="company" type="text" defaultValue={offer?.company ?? ""} className="form-input" />
            </Field>
            <Field label="Secteur">
              <input name="sector" type="text" defaultValue={offer?.sector ?? ""} className="form-input" />
            </Field>
            <Field label="Catégorie">
              <input name="category" type="text" defaultValue={offer?.category ?? ""} className="form-input" />
            </Field>
          </div>
        </div>
      </fieldset>

      {/* 2. Profil recherché */}
      <fieldset className="form-section">
        <legend className="px-1">Profil recherché</legend>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Niveau d'étude">
            <input name="educationLevel" type="text" defaultValue={offer?.educationLevel ?? ""} className="form-input" />
          </Field>
          <Field label="Expérience">
            <input name="experience" type="text" defaultValue={offer?.experience ?? ""} className="form-input" />
          </Field>
        </div>
      </fieldset>

      {/* 3. Localisation et contrat */}
      <fieldset className="form-section">
        <legend className="px-1">Localisation et contrat</legend>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Lieu">
            <input name="location" type="text" defaultValue={offer?.location ?? ""} className="form-input" />
          </Field>
          <Field label="Type de contrat">
            <input name="contractType" type="text" defaultValue={offer?.contractType ?? ""} className="form-input" />
          </Field>
        </div>
      </fieldset>

      {/* 4. Dates */}
      <fieldset className="form-section">
        <legend className="px-1">Dates</legend>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Date de publication source">
            <input
              name="sourcePublicationDate"
              type="date"
              defaultValue={toDateInput(offer?.sourcePublicationDate)}
              className="form-input"
            />
          </Field>
          <Field label="Date limite de candidature">
            <input
              name="applicationDeadline"
              type="date"
              defaultValue={toDateInput(offer?.applicationDeadline)}
              className="form-input"
            />
          </Field>
        </div>
      </fieldset>

      {/* 5. Source et candidature */}
      <fieldset className="form-section">
        <legend className="px-1">Source et candidature</legend>
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nom de la source">
              <input name="sourceName" type="text" defaultValue={offer?.sourceName ?? ""} className="form-input" />
            </Field>
            <Field label="URL de la source">
              <input name="sourceUrl" type="url" defaultValue={offer?.sourceUrl ?? ""} className="form-input" />
            </Field>
          </div>
          <Field label="Modalités de candidature">
            <textarea
              name="applicationModalities"
              rows={3}
              defaultValue={offer?.applicationModalities ?? ""}
              className="form-input"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Email de candidature">
              <input name="applicationEmail" type="email" defaultValue={offer?.applicationEmail ?? ""} className="form-input" />
            </Field>
            <Field label="URL de candidature">
              <input name="applicationUrl" type="url" defaultValue={offer?.applicationUrl ?? ""} className="form-input" />
            </Field>
          </div>
        </div>
      </fieldset>

      {/* 6. Description */}
      <fieldset className="form-section">
        <legend className="px-1">
          Description de l&apos;offre <span className="text-danger">*</span>
        </legend>
        <div className="mt-3">
          <TiptapEditor
            name="description"
            initialContent={
              offer?.description
                ? (offer.description as object)
                : null
            }
          />
        </div>
      </fieldset>

      {/* Edit-mode read-only system-managed fields */}
      {mode === "edit" && offer && (
        <fieldset className="form-section bg-surface-muted">
          <legend className="px-1">Champs gérés par le système (lecture seule)</legend>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-text-secondary">Statut</p>
              <StatusBadge status={offer.status as OfferStatus} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-secondary">Publiée le</p>
              <p className="text-sm text-text-primary">{formatDate(offer.publishedAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-text-secondary">Créée le</p>
              <p className="text-sm text-text-primary">{formatDate(offer.createdAt)}</p>
            </div>
          </div>
        </fieldset>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
        >
          {submitting
            ? "Enregistrement…"
            : mode === "create"
              ? "Enregistrer le brouillon"
              : "Enregistrer les modifications"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/offres")}
          className="btn-secondary"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-text-primary">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
