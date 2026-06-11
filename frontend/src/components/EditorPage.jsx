import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import Editor from "./Editor";
import CollaborationDrawer from "./CollaborationDrawer";
import HistoryDrawer from "./HistoryDrawer";
import api from "../utils/api";
import { joinDocument, onDocumentInit, onDocumentUpdate, sendDocumentUpdate } from "../utils/socket";

export default function EditorPage() {

  const { id } = useParams();

  const saveTimerRef = useRef(null);
  const loadedRef = useRef(false);

  const [content, setContent] = useState(null);
  const [title, setTitle] = useState("Untitled");
  const [savingTitle, setSavingTitle] = useState(false);
  const [titleSaved, setTitleSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyInfo, setHistoryInfo] = useState(null);
  const [showCollab, setShowCollab] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const initialTitleRef = useRef("");

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // FETCH DOCUMENT
  useEffect(() => {

    const fetchDocument = async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        setTitle(res.data.title || "Untitled");
        setContent(res.data.content);
        setCollaborators(res.data.collaborators || []);

        const currentUserId = (() => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return String(user?._id || user?.id || '');
          } catch {
            return '';
          }
        })();
        setIsOwner(String(res.data.owner?._id || res.data.owner || '') === currentUserId);

        loadedRef.current = true;
        setLoading(false);
      } catch (e) {
        if (e?.response?.status === 403) {
          setAccessDenied(true);
        }
        setLoading(false);
      }
    };

    fetchDocument();

    // join realtime room
    joinDocument(id);

    onDocumentInit((payload) => {
      if (payload && payload.content) {
        setContent(payload.content);
      }
    });

    onDocumentUpdate((payload) => {
      if (payload && payload.content) {
        setContent(payload.content);
      }
    });

  }, [id]);


  // AUTO SAVE
  useEffect(() => {

    if (!loadedRef.current || !content) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {

      await api.put(
        `/documents/${id}`,
        { title, content }
      );

      console.log("Saved");

      // also broadcast to other clients
      try {
        sendDocumentUpdate(id, content);
      } catch (e) {
        // ignore
      }

    }, 1000);

    return () => clearTimeout(saveTimerRef.current);

  }, [content, title, id]);

  const handleSaveTitle = async () => {
    if (!id) return;
    setSavingTitle(true);
    try {
      await api.put(`/documents/${id}`, { title, content });
      setTitleSaved(true);
      setTimeout(() => setTitleSaved(false), 2000);
    } catch (e) {
      // ignore here; autosave will surface errors elsewhere
    } finally {
      setSavingTitle(false);
    }
  };


  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (accessDenied) {
    return <h2>Access Denied</h2>;
  }

  return (
    <main className="dashboard-shell editor-shell">
      <section className="editor-toolbar">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Editor</p>
          {editingTitle ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="editor-title text-3xl font-bold mt-2"
                style={{ border: 'none', padding: 0, margin: 0, background: 'transparent', outline: 'none' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleSaveTitle();
                    setEditingTitle(false);
                  }
                  if (e.key === 'Escape') {
                    setTitle(initialTitleRef.current || 'Untitled');
                    setEditingTitle(false);
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={async () => {
                  await handleSaveTitle();
                  setEditingTitle(false);
                }}
                className="primary-button"
                style={{ whiteSpace: 'nowrap' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle(initialTitleRef.current || 'Untitled');
                  setEditingTitle(false);
                }}
                className="link-button"
                style={{ whiteSpace: 'nowrap' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              className="editor-title text-3xl font-bold mt-2"
              onClick={() => {
                initialTitleRef.current = title;
                setEditingTitle(true);
              }}
              style={{ cursor: 'text' }}
            >
              {title || 'Write with focus'}
            </h1>
          )}
          <p className="text-slate-400 mt-2">Simple Tiptap editor with live autosave.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isOwner && (
              <button
                type="button"
                onClick={async () => {
                  setShowCollab(!showCollab);
                }}
                className="primary-button"
                style={{ whiteSpace: 'nowrap' }}
              >
                Collaborate
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                if (!showHistory) {
                  try {
                    const res = await api.get(`/documents/${id}`);
                    setHistoryInfo({
                      createdAt: res.data.createdAt,
                      updatedAt: res.data.updatedAt,
                      lastSavedBy: res.data.lastSavedBy,
                    });
                  } catch (e) {
                    setHistoryInfo(null);
                  }
                }
                setShowHistory(!showHistory);
              }}
              className="primary-button"
              style={{ whiteSpace: 'nowrap' }}
            >
              History
            </button>
          </div>
          <div className="dashboard-badges">
            <span className="dashboard-badge">Tiptap</span>
          </div>
        </div>
      </section>

      {isOwner && showCollab && (
        <CollaborationDrawer
          docId={id}
          collaborators={collaborators}
          onCollaboratorsChange={(users) => setCollaborators(users)}
          onClose={() => setShowCollab(false)}
        />
      )}

      {showHistory && (
        <HistoryDrawer
          historyInfo={historyInfo}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Title is editable in the header */}

      <section className="editor-card editor-surface">
        <Editor
          content={content}
            setContent={setContent}
            docId={id}
              collabEnabled={collabEnabled}
              onCollaboratorsChange={(users) => setCollaborators(users)}
        />
      </section>
    </main>
  );
}