"use client";

import { cn } from "@mumzo/ui/lib/utils";
import DOMPurify from "dompurify";

/** Renders admin-authored HTML (from RichTextEditor) sanitized against XSS. */
export function RichTextView({
  html,
  className,
  testId,
}: {
  html: string;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed",
        "[&_a]:text-primary [&_a]:underline",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_p:not(:last-child)]:mb-3",
        className,
      )}
      data-testid={testId}
      // Sanitized via DOMPurify above — safe to render as HTML.
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

export default RichTextView;
