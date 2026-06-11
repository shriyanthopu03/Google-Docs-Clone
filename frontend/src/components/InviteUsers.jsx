import { useEffect, useMemo, useState } from "react";

import api from "../utils/api";

const getCollaboratorId = (collaborator) => String(collaborator?._id || collaborator || '');

export default function InviteUsers({ docId, collaborators, onCollaboratorsChange }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const collaboratorIds = useMemo(
    () => new Set((collaborators || []).map(getCollaboratorId).filter(Boolean)),
    [collaborators]
  );

  const search = async (term) => {
    setLoading(true);
    try {
      const res = await api.get(`/users?q=${encodeURIComponent(term)}`);
      setResults(res.data || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search('');
  }, []);

  const refreshCollaborators = async () => {
    const refreshed = await api.get(`/documents/${docId}`);
    onCollaboratorsChange?.(refreshed.data.collaborators || []);
  };

  return (
    <div>
      <input
        placeholder="Search users by name or email"
        value={q}
        onChange={(e) => { setQ(e.target.value); search(e.target.value); }}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6e9ee' }}
      />
      <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
        {loading ? <div>Searching...</div> : (
          results.map((u) => (
            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 8, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 13 }}>{u.name || u.email}</div>
              <div>
                {collaboratorIds.has(String(u._id)) ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.delete(`/documents/${docId}/collaborators/${u._id}`);
                        await refreshCollaborators();
                        alert(`Removed access for ${u.name || u.email}`);
                      } catch (e) {
                        alert(e?.response?.data?.message || 'Unable to remove access');
                      }
                    }}
                    className="primary-button"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 12px 24px rgba(220, 38, 38, 0.18)' }}
                  >
                    Remove Access
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.post(`/documents/${docId}/collaborators`, { userId: u._id });
                        await refreshCollaborators();
                        alert(`Granted access to ${u.name || u.email}`);
                      } catch (e) {
                        alert(e?.response?.data?.message || 'Unable to grant access');
                      }
                    }}
                    className="primary-button"
                  >
                    Enable Access
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}