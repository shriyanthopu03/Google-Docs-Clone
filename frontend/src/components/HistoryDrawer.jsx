import SlidingDrawer from "./SlidingDrawer";

export default function HistoryDrawer({ historyInfo, onClose }) {
  return (
    <SlidingDrawer title="Document history" onClose={onClose} width="min(92vw, 320px)">
      {historyInfo ? (
        <div>
          <div style={{ marginBottom: 8 }}><strong>Created:</strong> {new Date(historyInfo.createdAt).toLocaleString()}</div>
          <div style={{ marginBottom: 8 }}><strong>Last saved:</strong> {new Date(historyInfo.updatedAt).toLocaleString()}</div>
          <div>
            <strong>Last saved by:</strong>{' '}
            {historyInfo.lastSavedBy ? (
              <span>{historyInfo.lastSavedBy.name || historyInfo.lastSavedBy.email || 'Anon'}</span>
            ) : (
              <span>Unknown</span>
            )}
          </div>
        </div>
      ) : (
        <div>No history available</div>
      )}
    </SlidingDrawer>
  );
}