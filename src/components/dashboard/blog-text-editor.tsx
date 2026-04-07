"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";

import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

function editorButtonClassName(active?: boolean) {
  return `inline-flex h-9 w-9 items-center justify-center rounded-xl border text-[#1b3022] transition-colors ${
    active
      ? "border-[#1b3022] bg-[#1b3022] text-white"
      : "border-[#d7ddd3] bg-white hover:bg-[#f3f7f0]"
  }`;
}

type BlogTextEditorProps = {
  initialContent?: string;
  submitIdleLabel: string;
  submitPendingLabel: string;
};

export function BlogTextEditor({
  initialContent = "",
  submitIdleLabel,
  submitPendingLabel,
}: BlogTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(initialContent);

  const syncContent = () => {
    setContent(editorRef.current?.innerHTML ?? "");
  };

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncContent();
  };

  const addLink = () => {
    const value = window.prompt("Enter the link URL");
    if (!value) return;
    runCommand("createLink", value);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 rounded-[1.2rem] border border-[#d7ddd3] bg-[#f7faf5] p-3">
        <button type="button" onClick={() => runCommand("bold")} className={editorButtonClassName()} aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand("italic")} className={editorButtonClassName()} aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={addLink} className={editorButtonClassName()} aria-label="Add link">
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand("insertUnorderedList")} className={editorButtonClassName()} aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand("insertOrderedList")} className={editorButtonClassName()} aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => runCommand("formatBlock", "blockquote")} className={editorButtonClassName()} aria-label="Quote">
          <Quote className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        className="min-h-64 rounded-[1.4rem] border border-[#d7ddd3] bg-white px-4 py-4 text-sm font-medium text-[#1b3022] outline-none focus:border-[#1b3022]"
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />

      <textarea name="content" value={content} readOnly className="hidden" />

      <PendingSubmitButton
        idleLabel={submitIdleLabel}
        pendingLabel={submitPendingLabel}
        className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white"
      />
    </>
  );
}
