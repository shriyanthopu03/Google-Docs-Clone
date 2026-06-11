import React from "react";

const DocumentSidebar = ({ documents = [], onOpenDocument, onRefresh, onDeleteDocument }) => {
  return (
    <aside className="sidebar-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Documents</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="primary-button">
            Refresh
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-4">Open a document below or create a new one from the dashboard.</p>
      <div className="flex flex-col gap-2">
        {documents.map((document) => (
          <div
            key={document._id}
            className="document-item"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}
          >
            <button
              type="button"
              onClick={() => onOpenDocument(document._id)}
              style={{ flex: 1, textAlign: "left" }}
            >
              {document.title || 'Untitled'}
            </button>
            <button
              type="button"
              onClick={() => onDeleteDocument?.(document)}
              className="text-sm text-red-500 font-medium"
              aria-label={`Delete ${document.title || 'Untitled'}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DocumentSidebar;