
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import blankDocumentImage from "../assets/blank-document.svg";
import DocumentSection from "./DocumentSection";

import api from "../utils/api";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const userName = storedUser?.name || storedUser?.email || "User";
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadRequestIdRef = useRef(0);

  const loadDocuments = async () => {
    const requestId = ++loadRequestIdRef.current;

    setError("");
    setLoading(true);

    try {
      const response = await api.get("/documents");
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      const data = response.data || {};
      // support legacy array response
      if (Array.isArray(data)) {
        setOwnedDocs(data);
        setSharedDocs([]);
      } else {
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }

      setError(err?.response?.data?.message || "Unable to load documents.");
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      loadDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  const handleCreateDocument = async () => {
    // ask the user for a title before creating
    setError("");

    try {
      let title = window.prompt("Title for new document", "Untitled");
      if (title === null) return; // user cancelled
      title = (title || "").trim() || "Untitled";

      const response = await api.post("/documents/create", {
        title,
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
      });

      navigate(`/document/${response.data._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create a document.");
    }
  };

  const handleOpenDocument = (documentId) => {
    navigate(`/document/${documentId}`);
  };

  const handleDeleteDocument = async (document) => {
    const title = document?.title || "Untitled";
    const confirmed = window.confirm(`Delete "${title}"?`);

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(`/documents/${document._id}`);
      await loadDocuments();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete the document.");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (onLogout) {
      onLogout();
    }
    navigate("/", { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">DOCS WORKSPACE</p>
          </div>

          <div className="flex items-center gap-3" style={{ marginLeft: 'auto', paddingTop: '0.15rem' }}>
            <button
              type="button"
              onClick={handleProfileClick}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-700 font-medium shadow-sm"
            >
              {userName}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="primary-button"
              style={{ paddingInline: '1.1rem' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Full-width template gallery */}
      <div className="templates-gallery mb-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400 mb-3">Start a new document</p>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
          <button onClick={handleCreateDocument} className="sidebar-card" style={{ minWidth: 160, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <img src={blankDocumentImage} alt="Blank document" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Blank document</div>
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="sidebar-card" style={{ width: '100%', minHeight: '68vh' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Documents</p>
              <div className="text-sm text-slate-400 mt-1">Owned by you</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadDocuments} className="primary-button">
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-80">
              <p className="text-slate-400">Loading documents...</p>
            </div>
          ) : ownedDocs.length === 0 && sharedDocs.length === 0 ? (
            <div className="grid gap-6 place-items-center text-center min-h-80">
              <img
                src={blankDocumentImage}
                alt="Blank document"
                className="w-56 max-w-full drop-shadow-xl"
              />
              <div>
                <h2 className="text-2xl font-semibold">No documents yet</h2>
                <p className="text-slate-400 mt-2">
                  Create your first document to start writing.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <DocumentSection
                  title="Owned by you"
                  documents={ownedDocs}
                  onOpen={handleOpenDocument}
                  onDelete={handleDeleteDocument}
                />
              </div>

              <DocumentSection
                title="Shared With Me"
                documents={sharedDocs}
                onOpen={handleOpenDocument}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;