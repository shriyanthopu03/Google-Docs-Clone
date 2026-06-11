export default function DocumentCard({ document, onOpen, onDelete }) {
  return (
    <div className="sidebar-card" style={{ padding: 12, textAlign: 'left', minHeight: 260 }}>
      <button
        type="button"
        onClick={() => onOpen(document._id)}
        style={{ width: '100%', textAlign: 'left' }}
      >
        <div style={{ height: 180, borderRadius: 6, background: '#fff', border: '1px solid #e6e9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>
          {document.title || 'Untitled'}
        </div>
      </button>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>{new Date(document.updatedAt || document.createdAt).toLocaleDateString()}</div>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(document)}
            className="text-sm text-red-500 font-medium"
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}