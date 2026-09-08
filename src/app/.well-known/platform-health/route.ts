export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", revision: process.env.APP_REVISION || "development" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
