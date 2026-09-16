"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "./TiptapEditor";
import {
  createOfferAction,
  updateOfferAction,
} from "@/app/admin/(protected)/offres/actions";

/**
 * OfferForm — admin create/edit form for an offer.
 *
 * 16 ADMIN-editable fields grouped per S6 §25:
 * - Informations principales: title (required), company, sector, category
 * - Caractéristiques: contract_type, education_level, experience, location
 * - Dates: source_publication_date, application_deadline
 * - Description: Tiptap rich-text editor (required)
 * - Candidature: application_modalities, application_email, application_url
 * - Source: source_name, source_url
 *
 * System-managed fields (id, status, published_at, created_at, updated_at)
 * are NOT editable inputs. status is shown as a read-only badge (in edit mode).
 *
 * Client-side validation mirrors server Zod for UX only. The server is the
 * authority.
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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  SUSPENDED: "Suspendue",
  ARCHIVED: "Archivée",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

function toDateInput(value?: string | null): string {
  if (!value) return "";
  // source_publication_date/application_deadline are stored as date (YYYY-MM-DD);
  // published_at/created_at/updated_at are timestamptz (ISO string). We only show
  // date inputs for the ADMIN-entered date fields.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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
    // The hidden input "description" is filled by TiptapEditor.onUpdate via DOM.
    // FormData reads the current DOM value at submit time.
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
    // Redirect to admin offers list on success
    router.push("/admin/offres");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Informations principales */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Informations principales
        </legend>
        <div className="mt-2 space-y-4">
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

      {/* Caractéristiques */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Caractéristiques
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Type de contrat">
            <input name="contractType" type="text" defaultValue={offer?.contractType ?? ""} className="form-input" />
          </Field>
          <Field label="Niveau d'étude">
            <input name="educationLevel" type="text" defaultValue={offer?.educationLevel ?? ""} className="form-input" />
          </Field>
          <Field label="Expérience">
            <input name="experience" type="text" defaultValue={offer?.experience ?? ""} className="form-input" />
          </Field>
          <Field label="Localisation">
            <input name="location" type="text" defaultValue={offer?.location ?? ""} className="form-input" />
          </Field>
        </div>
      </fieldset>

      {/* Dates */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Dates
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {/* Description */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Description <span className="text-red-600">*</span>
        </legend>
        <div className="mt-2">
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

      {/* Candidature */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Candidature (informationnel uniquement)
        </legend>
        <div className="mt-2 space-y-4">
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

      {/* Source */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-700">
          Source
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nom de la source">
            <input name="sourceName" type="text" defaultValue={offer?.sourceName ?? ""} className="form-input" />
          </Field>
          <Field label="URL de la source">
            <input name="sourceUrl" type="url" defaultValue={offer?.sourceUrl ?? ""} className="form-input" />
          </Field>
        </div>
      </fieldset>

      {/* Edit-mode read-only system-managed fields */}
      {mode === "edit" && offer && (
        <fieldset className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <legend className="px-1 text-sm font-semibold text-gray-700">
            Champs gérés par le système (lecture seule)
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Statut</p>
              <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${STATUS_CLASSES[offer.status] ?? "bg-gray-100 text-gray-800"}`}>
                {STATUS_LABELS[offer.status] ?? offer.status}
              </span>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Publiée le</p>
              <p className="text-sm text-gray-700">
                {offer.publishedAt ? new Date(offer.publishedAt).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Créée le</p>
              <p className="text-sm text-gray-700">
                {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
          </div>
        </fieldset>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          display: block;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          background: #fff;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      `}</style>
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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}
