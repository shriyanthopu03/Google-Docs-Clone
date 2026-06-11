import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

function ToolbarButton({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
        active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Editor({ content, setContent, docId, collabEnabled = false, onCollaboratorsChange }) {
  const ydocRef = useRef(null)
  const providerRef = useRef(null)

  // prepare Y doc and provider when collaboration is enabled
  useEffect(() => {
    if (!collabEnabled || !docId || typeof window === 'undefined') return;

    if (!ydocRef.current) ydocRef.current = new Y.Doc()

    const url = import.meta.env.VITE_YWS_URL || (() => {
      try {
        // Extract backend URL and convert to WebSocket protocol
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const protocol = socketUrl.startsWith('https') ? 'wss:' : 'ws:';
        const host = socketUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return `${protocol}//${host}/yjs`;
      } catch (e) {
        return 'ws://localhost:1234';
      }
    })();
    if (!providerRef.current) {
      providerRef.current = new WebsocketProvider(url, docId, ydocRef.current)
    }

    // set local awareness info
    try {
      const raw = localStorage.getItem('user')
      const user = raw ? JSON.parse(raw) : { name: 'Anonymous' }
      providerRef.current.awareness.setLocalStateField('user', { name: user.name || user.email || 'Anon' })
    } catch (e) {}

    const awareness = providerRef.current.awareness
    const onChange = () => {
      try {
        const states = Array.from(awareness.getStates().values())
        const users = states.map(s => s.user).filter(Boolean)
        onCollaboratorsChange?.(users)
      } catch (e) {}
    }
    awareness.on('change', onChange)
    onChange()

    return () => {
      try {
        awareness.off('change', onChange)
        providerRef.current && providerRef.current.destroy()
        providerRef.current = null
      } catch (e) {}
    }
  }, [collabEnabled, docId])

  const extensions = useMemo(() => {
    const exts = [StarterKit]
    if (collabEnabled && ydocRef.current) {
      exts.push(Collaboration.configure({ document: ydocRef.current }))
    }
    return exts
  }, [collabEnabled])

  const editor = useEditor({
    extensions,
    content: content || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900 outline-none focus:border-blue-400",
      },
    },
    onUpdate({ editor }) {
      setContent(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor || !content) return;

    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(content);

    if (current !== next) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>Bold</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>Italic</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>Strike</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>Bullet list</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>Numbered list</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>Quote</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>Code block</ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
