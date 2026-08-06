"use client";

import { Separator } from "@mumzo/ui/components/separator";
import { Toggle } from "@mumzo/ui/components/toggle";
import { cn } from "@mumzo/ui/lib/utils";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";

/** Rich text field over Tiptap — stores/emits sanitizable HTML. */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  testId,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  testId?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-24 text-foreground text-sm leading-relaxed focus:outline-none",
          "[&_a]:text-primary [&_a]:underline",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_p:not(:last-child)]:mb-3",
        ),
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border bg-background", className)} data-testid={testId}>
      <div className="flex flex-wrap items-center gap-1 border-border/60 border-b p-1.5">
        <Toggle
          aria-label="Bold"
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          pressed={editor.isActive("bold")}
          size="sm"
        >
          <Bold className="size-4" />
        </Toggle>
        <Toggle
          aria-label="Italic"
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          pressed={editor.isActive("italic")}
          size="sm"
        >
          <Italic className="size-4" />
        </Toggle>
        <Toggle
          aria-label="Strikethrough"
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          pressed={editor.isActive("strike")}
          size="sm"
        >
          <Strikethrough className="size-4" />
        </Toggle>
        <Separator className="mx-1 h-5" orientation="vertical" />
        <Toggle
          aria-label="Bullet list"
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          pressed={editor.isActive("bulletList")}
          size="sm"
        >
          <List className="size-4" />
        </Toggle>
        <Toggle
          aria-label="Numbered list"
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          pressed={editor.isActive("orderedList")}
          size="sm"
        >
          <ListOrdered className="size-4" />
        </Toggle>
        <Separator className="mx-1 h-5" orientation="vertical" />
        <Toggle
          aria-label="Link"
          onPressedChange={() => {
            const url = window.prompt("Link URL");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else if (url === "") {
              editor.chain().focus().unsetLink().run();
            }
          }}
          pressed={editor.isActive("link")}
          size="sm"
        >
          <LinkIcon className="size-4" />
        </Toggle>
      </div>
      <EditorContent className="px-3 py-2" editor={editor} />
    </div>
  );
}

export default RichTextEditor;
