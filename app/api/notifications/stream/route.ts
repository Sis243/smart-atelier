import { NextRequest } from "next/server";
import { requirePermission, requireUser } from "@/lib/guards";

export async function GET(_: NextRequest) {
  const authGuard = await requireUser();
  if (!authGuard.ok) return authGuard.response;

  const permGuard = await requirePermission("notifications.view");
  if (!permGuard.ok) return permGuard.response;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // ping initial
      send({ type: "connected" });

      // Exemple : heartbeat (évite timeout)
      const interval = setInterval(() => {
        send({ type: "ping", time: Date.now() });
      }, 10000);

      // nettoyage
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}