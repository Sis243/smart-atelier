import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {

  const purchase = await prisma.stockPurchase.findUnique({
    where: { id: params.id },
    include: {
      item: true,
      supplier: true,
    },
  });

  if (!purchase) {
    return new NextResponse("Bon achat introuvable", { status: 404 });
  }

  const total = Number(purchase.quantity || 0) * Number(purchase.unitCost || 0);

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bon d'achat - ${purchase.id}</title>
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
</head>
<body>
<div class="paper">
  <div class="top">
    <div>
      <h1>BON D’ACHAT STOCK</h1>
      <div class="muted">Smart IT Solutions • Smart Atelier</div>
    </div>
    <div style="text-align:right">
      <div class="muted">Date</div>
      <div style="font-weight:800">${new Date(purchase.purchasedAt).toLocaleString("fr-FR")}</div>
    </div>
  </div>

  <div class="box">
    <div class="kv"><span class="muted">Article</span><b>${purchase.item?.name ?? "—"}</b></div>
    <div class="kv"><span class="muted">Fournisseur</span><b>${purchase.supplier?.name ?? "—"}</b></div>
    <div class="kv"><span class="muted">Quantité</span><b>${Number(purchase.quantity || 0).toLocaleString("fr-FR")}</b></div>
    <div class="kv"><span class="muted">Coût unitaire</span><b>${Number(purchase.unitCost || 0).toLocaleString("fr-FR")} ${purchase.currency}</b></div>
    <div class="kv"><span class="muted">Montant total</span><b>${total.toLocaleString("fr-FR")} ${purchase.currency}</b></div>
    <div class="kv"><span class="muted">Référence</span><b>${purchase.reference ?? "—"}</b></div>
    <div class="kv"><span class="muted">ID Achat</span><b style="font-family:monospace">${purchase.id}</b></div>
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
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}