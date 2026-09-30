import { getCurrentUserId } from "@/lib/current-user";
import { exportData, toMarkdown } from "@/lib/services/export";

// GET /api/export?format=json|markdown -> a file download of all your data.
// A route handler rather than a page: it returns a file, not HTML.
export async function GET(request: Request) {
  // Signed-out requests are redirected to /login.
  const userId = await getCurrentUserId();
  const format = new URL(request.url).searchParams.get("format");
  const data = await exportData(userId);
  const date = new Date().toISOString().slice(0, 10);

  const [body, type, extension] =
    format === "markdown"
      ? [toMarkdown(data), "text/markdown; charset=utf-8", "md"]
      : [JSON.stringify(data, null, 2), "application/json; charset=utf-8", "json"];

  return new Response(body, {
    headers: {
      "Content-Type": type,
      // "attachment" makes the browser download it instead of showing it.
      "Content-Disposition": `attachment; filename="book-tracker-${date}.${extension}"`,
      "Cache-Control": "no-store",
    },
  });
}
