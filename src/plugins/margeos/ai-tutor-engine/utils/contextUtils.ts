export function formatContextSummary(docTitle?: string, pageNumber?: number, subject?: string): string {
  return `Document: ${docTitle || "PDF Reference"} | Page: ${pageNumber || 1} | Subject: ${subject || "General Study"}`;
}
