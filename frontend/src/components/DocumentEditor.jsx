import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

function DocumentEditor({
  activeDocument,
  title,
  text,
  onTitleChange,
  onTextChange,
  onCreate,
  onSave,
}) {

  const savingRef = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: text || null,
    onUpdate({ editor }) {
      // push JSON content to parent
      const json = editor.getJSON();
      onTextChange(json);
    },
  });

  // keep editor content in sync when `text` prop changes
  useEffect(() => {
    if (!editor) return;
    if (!text) return;
    try {
      // compare serialized forms to avoid unnecessary sets
      const current = editor.getJSON();
      if (JSON.stringify(current) !== JSON.stringify(text)) {
        editor.commands.setContent(text);
      }
    } catch (e) {
      // fallback: set raw content
      editor.commands.setContent(text);
    }
  }, [text, editor]);

  // expose a save handler that calls onSave with current editor content
  const handleSave = async () => {
    if (!editor) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const json = editor.getJSON();
      await onSave(json);
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <main className="editor-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">{activeDocument ? 'Edit Document' : 'New Document'}</h3>
        <div className="flex gap-2">
          <button type="button" onClick={onCreate} className="primary-button">Create</button>
          <button type="button" onClick={handleSave} className="primary-button" disabled={!activeDocument}>Save</button>
        </div>
      </div>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Title"
        className="field-input mb-3"
      />

      <div className="editor-textarea" style={{ minHeight: 400 }}>
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}

export default DocumentEditor;