import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { moveId: string } }
) {

  const move = await prisma.stockMove.findUnique({
    where: { id: params.moveId },
    include: {
      item: {
        select: {
          id: true,
          name: true,
          category: true,
          unit: true,
          quantity: true,
          minQuantity: true,
        },
      },
    },
  });

  if (!move) {
    return new NextResponse("Bon introuvable", { status: 404 });
  }

  const typeLabel =
    move.type === "IN"
      ? "BON D’ENTRÉE"
      : move.type === "OUT"
      ? "BON DE SORTIE"
      : "BON D’AJUSTEMENT";

  const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${typeLabel} - ${move.id}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;padding:24px;background:#f6f6f6}
  .paper{max-width:820px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px}
  .top{display:flex;justify-content:space-between;gap:14px}
  .muted{color:#6b7280;font-size:12px}
  h1{margin:0;font-size:16px}
  .box{margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;padding:12px}
  .kv{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #eee;font-size:13px}
  .kv:last-child{border-bottom:none}
  .btn{display:inline-block;margin-top:12px;background:#111;color:#fff;padding:10px 12px;border-radius:10px;text-decoration:none;font-size:13px}
  @media print{body{background:#fff;padding:0}.paper{border:none;border-radius:0}.btn{display:none}}
</style>
</head><body>
<div class="paper">
  <div class="top">
    <div>
      <h1>${typeLabel}</h1>
      <div class="muted">Smart IT Solutions • Smart Atelier</div>
    </div>
    <div style="text-align:right">
      <div class="muted">Date</div>
      <div style="font-weight:800">${new Date(move.movedAt).toLocaleString("fr-FR")}</div>
    </div>
  </div>

  <div class="box">
    <div class="kv"><span class="muted">Article</span><b>${move.item.name}</b></div>
    <div class="kv"><span class="muted">Catégorie</span><b>${move.item.category ?? "—"}</b></div>
    <div class="kv"><span class="muted">Unité</span><b>${move.item.unit ?? "—"}</b></div>
    <div class="kv"><span class="muted">Type</span><b>${move.type}</b></div>
    <div class="kv"><span class="muted">Quantité</span><b>${Number(move.quantity).toLocaleString("fr-FR")} ${move.item.unit ?? ""}</b></div>
    <div class="kv"><span class="muted">Note</span><b>${move.note ?? "—"}</b></div>
    <div class="kv"><span class="muted">ID Mouvement</span><b style="font-family:monospace">${move.id}</b></div>
  </div>

  <div class="box">
    <div class="kv"><span class="muted">Stock actuel (après mouvement)</span><b>${Number(move.item.quantity).toLocaleString("fr-FR")} ${move.item.unit ?? ""}</b></div>
    <div class="kv"><span class="muted">Seuil min</span><b>${Number(move.item.minQuantity).toLocaleString("fr-FR")}</b></div>
  </div>

  <div style="display:flex;justify-content:space-between;gap:18px;margin-top:18px">
    <div style="flex:1">
      <div class="muted">Signature & Cachet</div>
      <div style="height:48px;border-bottom:1px solid #e5e7eb"></div>
    </div>
    <div style="flex:1;text-align:right">
      <div class="muted">Nom / Fonction</div>
      <div style="height:48px;border-bottom:1px solid #e5e7eb"></div>
    </div>
  </div>

  <a class="btn" href="#" onclick="window.print();return false;">Imprimer (ou PDF)</a>
</div>

<script>setTimeout(()=>{try{window.print()}catch(e){}},300)</script>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}