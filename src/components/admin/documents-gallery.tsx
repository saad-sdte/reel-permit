"use client";

import type { ApplicantDocument } from "@/lib/applicant-documents";

export function DocumentsGallery({
  documents,
  emptyText = "No scanned documents on this application.",
}: {
  documents: ApplicantDocument[];
  emptyText?: string;
}) {
  if (documents.length === 0) {
    return <p className="admin-muted" style={{ margin: 0 }}>{emptyText}</p>;
  }

  return (
    <div className="admin-docs-grid">
      {documents.map((doc) => (
        <article key={doc.key} className="admin-doc-card">
          <div className="admin-doc-preview">
            {doc.kind === "pdf" ? (
              <object data={doc.url} type="application/pdf" title={doc.label}>
                <p className="admin-muted" style={{ margin: 0, fontSize: 12 }}>
                  PDF preview unavailable
                </p>
              </object>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.url} alt={doc.label} />
            )}
          </div>
          <div className="admin-doc-meta">
            <strong>{doc.label}</strong>
            {doc.fileName ? <span className="admin-muted">{doc.fileName}</span> : null}
            <div className="admin-doc-actions">
              <a href={doc.url} target="_blank" rel="noreferrer" className="admin-link">
                Open
              </a>
              <a href={doc.url} download={doc.fileName || doc.label} className="admin-link">
                Download
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
