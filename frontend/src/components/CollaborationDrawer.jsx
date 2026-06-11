import InviteUsers from "./InviteUsers";
import SlidingDrawer from "./SlidingDrawer";

export default function CollaborationDrawer({
  docId,
  collaborators,
  onCollaboratorsChange,
  onClose,
}) {
  return (
    <SlidingDrawer title="Collaboration" onClose={onClose} width="min(92vw, 420px)" zIndex={50}>
      <div>
        <div style={{ marginBottom: 8 }}><strong>Collaborators:</strong></div>
        {collaborators.length === 0 ? <div style={{ marginTop: 6 }}>No collaborators yet</div> : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {collaborators.map((c) => <li key={c._id}>{c.name || c.email || 'Anon'}</li>)}
          </ul>
        )}
        <div style={{ marginTop: 8 }}>
          <small style={{ color: '#94a3b8' }}>Realtime enabled via Yjs</small>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Invite users</div>
        <InviteUsers
          docId={docId}
          collaborators={collaborators}
          onCollaboratorsChange={onCollaboratorsChange}
        />
      </div>
    </SlidingDrawer>
  );
}