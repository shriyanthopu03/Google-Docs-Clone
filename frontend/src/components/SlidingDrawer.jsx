export default function SlidingDrawer({
  title,
  onClose,
  width = 'min(92vw, 360px)',
  zIndex = 40,
  children,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        top: 16,
        width,
        maxHeight: 'calc(100vh - 32px)',
        borderRadius: 16,
        boxShadow: '0 18px 48px rgba(15,23,42,0.16)',
        background: '#fff',
        padding: 16,
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0 }}>
        <strong>{title}</strong>
        <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ fontSize: 13, color: '#475569', overflowY: 'auto', paddingRight: 4, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}