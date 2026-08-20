'use client';

// Rich Q&A / notebook — global scratchpad below the swimlanes.
// One row in grid_notebook (singleton). Autosaves on blur.
// Rich formatting via TipTap: bold, italic, headings, lists, blockquote,
// code, links, undo/redo, task checklist.

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { supabase } from '../../lib/supabase';
import type { GridNotebook } from '../../lib/supabase';

const CYAN = '#00f0ff';
const CYAN_DIM = 'rgba(0,240,255,0.55)';
const CYAN_FAINT = 'rgba(0,240,255,0.22)';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(0,240,255,0.14)' : 'transparent',
        border: `1px solid ${active ? CYAN : CYAN_FAINT}`,
        color: active ? CYAN : CYAN_DIM,
        padding: '4px 8px',
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        lineHeight: 1,
        minWidth: 28,
      }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  const chain = () => editor.chain().focus();
  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        padding: '6px 0 8px',
        borderBottom: `1px solid ${CYAN_FAINT}`,
        marginBottom: 8,
      }}
    >
      <ToolbarButton title="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
        B
      </ToolbarButton>
      <ToolbarButton
        title="Italic (⌘I)"
        active={editor.isActive('italic')}
        onClick={() => chain().toggleItalic().run()}
      >
        <span style={{ fontStyle: 'italic' }}>I</span>
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => chain().toggleStrike().run()}
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        active={editor.isActive('code')}
        onClick={() => chain().toggleCode().run()}
      >
        {'</>'}
      </ToolbarButton>
      <span style={{ width: 1, background: CYAN_FAINT, margin: '0 4px' }} />
      <ToolbarButton
        title="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => chain().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton
        title="Paragraph"
        active={editor.isActive('paragraph')}
        onClick={() => chain().setParagraph().run()}
      >
        ¶
      </ToolbarButton>
      <span style={{ width: 1, background: CYAN_FAINT, margin: '0 4px' }} />
      <ToolbarButton
        title="Bulleted list"
        active={editor.isActive('bulletList')}
        onClick={() => chain().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        title="Task list"
        active={editor.isActive('taskList')}
        onClick={() => chain().toggleTaskList().run()}
      >
        ☐
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => chain().toggleBlockquote().run()}
      >
        &quot;
      </ToolbarButton>
      <ToolbarButton
        title="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => chain().toggleCodeBlock().run()}
      >
        {'{ }'}
      </ToolbarButton>
      <ToolbarButton
        title="Horizontal rule"
        onClick={() => chain().setHorizontalRule().run()}
      >
        ─
      </ToolbarButton>
      <span style={{ width: 1, background: CYAN_FAINT, margin: '0 4px' }} />
      <ToolbarButton
        title="Link"
        active={editor.isActive('link')}
        onClick={() => {
          const prior = editor.getAttributes('link').href as string | undefined;
          const url = window.prompt('Link URL', prior ?? 'https://');
          if (url === null) return;
          if (url === '') {
            chain().extendMarkRange('link').unsetLink().run();
          } else {
            chain().extendMarkRange('link').setLink({ href: url }).run();
          }
        }}
      >
        Link
      </ToolbarButton>
      <span style={{ width: 1, background: CYAN_FAINT, margin: '0 4px' }} />
      <ToolbarButton title="Undo (⌘Z)" onClick={() => chain().undo().run()}>
        ↶
      </ToolbarButton>
      <ToolbarButton title="Redo (⌘⇧Z)" onClick={() => chain().redo().run()}>
        ↷
      </ToolbarButton>
      <span style={{ width: 1, background: CYAN_FAINT, margin: '0 4px' }} />
      <ToolbarButton title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        ⌫
      </ToolbarButton>
    </div>
  );
}

export default function NotebookPanel() {
  const [row, setRow] = useState<GridNotebook | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const rowRef = useRef<GridNotebook | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: true, autolink: true }),
      Placeholder.configure({
        placeholder:
          "Things to research, questions I need to ask, half-thoughts. Nothing here is blocking — it's just a place to put stuff so it doesn't leave my head.",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        style:
          'min-height: 160px; padding: 10px 12px; outline: none; color: #f5f5f5; line-height: 1.6; font-size: 14px;',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    let alive = true;
    supabase
      .from('grid_notebook')
      .select('*')
      .order('updated_at', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (!alive) return;
        const first = (data?.[0] as GridNotebook | undefined) ?? null;
        setRow(first);
        rowRef.current = first;
        if (editor && first?.content) editor.commands.setContent(first.content);
      });
    return () => {
      alive = false;
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const persist = async () => {
      const current = rowRef.current;
      if (!current) return;
      const html = editor.getHTML();
      const { error } = await supabase
        .from('grid_notebook')
        .update({ content: html, updated_at: new Date().toISOString() })
        .eq('id', current.id);
      if (error) {
        console.error('Notebook save failed:', error.message);
        return;
      }
      setSavedAt(new Date());
    };
    editor.on('blur', persist);
    return () => {
      editor.off('blur', persist);
    };
  }, [editor]);

  return (
    <div
      style={{
        marginTop: 24,
        border: `1px solid ${CYAN_FAINT}`,
        background: 'rgba(0, 12, 16, 0.65)',
        padding: '14px 16px 16px',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: CYAN_DIM,
            textTransform: 'uppercase',
          }}
        >
          Q&amp;A · Notebook
        </div>
        {savedAt && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 9,
              color: CYAN_DIM,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Saved · {savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
      </div>
      <Toolbar editor={editor} />
      <div
        style={{
          background: 'rgba(0,0,0,0.55)',
          border: `1px solid ${CYAN_FAINT}`,
          minHeight: 160,
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <style jsx global>{`
        .ProseMirror { min-height: 140px; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror p { margin: 0.4em 0; }
        .ProseMirror h1 { font-size: 22px; font-weight: 800; margin: 0.6em 0 0.3em; }
        .ProseMirror h2 { font-size: 18px; font-weight: 700; margin: 0.6em 0 0.3em; }
        .ProseMirror h3 { font-size: 15px; font-weight: 700; margin: 0.5em 0 0.25em; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.4em; margin: 0.4em 0; }
        .ProseMirror ul { list-style: disc; }
        .ProseMirror ol { list-style: decimal; }
        .ProseMirror li { margin: 0.2em 0; }
        .ProseMirror blockquote {
          border-left: 3px solid ${CYAN_FAINT};
          padding-left: 12px;
          margin: 0.5em 0;
          color: rgba(245,245,245,0.75);
          font-style: italic;
        }
        .ProseMirror code {
          background: rgba(0,240,255,0.10);
          border: 1px solid ${CYAN_FAINT};
          padding: 1px 4px;
          font-family: ${MONO};
          font-size: 12px;
        }
        .ProseMirror pre {
          background: rgba(0,0,0,0.6);
          border: 1px solid ${CYAN_FAINT};
          padding: 10px 12px;
          font-family: ${MONO};
          font-size: 12px;
          overflow-x: auto;
          margin: 0.5em 0;
        }
        .ProseMirror pre code { border: none; background: transparent; padding: 0; }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid ${CYAN_FAINT};
          margin: 1em 0;
        }
        .ProseMirror a { color: ${CYAN}; text-decoration: underline; text-underline-offset: 2px; }
        .ProseMirror ul[data-type='taskList'] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type='taskList'] li { display: flex; gap: 8px; align-items: flex-start; }
        .ProseMirror ul[data-type='taskList'] li > label { flex: 0 0 auto; margin-top: 3px; }
        .ProseMirror ul[data-type='taskList'] input[type='checkbox'] {
          accent-color: ${CYAN};
          cursor: pointer;
        }
        .ProseMirror ul[data-type='taskList'] li > div { flex: 1 1 auto; }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: ${CYAN_DIM};
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _cyanUsed = CYAN;
