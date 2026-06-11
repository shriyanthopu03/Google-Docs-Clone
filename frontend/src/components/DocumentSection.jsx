import DocumentCard from "./DocumentCard";

export default function DocumentSection({
  title,
  description,
  documents,
  onOpen,
  onDelete,
}) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#64748b' }}>{title}</div>
      {description ? <div className="text-sm text-slate-400 mt-1 mb-3">{description}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {documents.map((document) => (
          <DocumentCard
            key={document._id}
            document={document}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}