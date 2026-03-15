import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  await requirePermission(user.id, "NOTIFICATIONS_VIEW");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`retry: 2000\n\n`));

      let last = new Date(Date.now() - 60_000);

      const tick = async () => {
        try {
          const n = await prisma.notification.findFirst({
            where: { userId: user.id, createdAt: { gt: last } },
            orderBy: { createdAt: "desc" },
          });

          if (n) {
            last = n.createdAt;
            controller.enqueue(encoder.encode(`event: notification\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(n)}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
          }
        } catch {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        }
      };

      const interval = setInterval(tick, 2000);

      // cleanup
      // @ts-ignore
      req.signal?.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
