import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Currency = "USD" | "CDF";

function safeFxRate(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function convertToOrderCurrency(amount: number, paymentCurrency: Currency, orderCurrency: Currency, fxRate: number) {
  if (!Number.isFinite(amount)) return 0;
  if (paymentCurrency === orderCurrency) return amount;

  // fxRate = USD->CDF
  if (orderCurrency === "USD" && paymentCurrency === "CDF") return amount / fxRate;
  if (orderCurrency === "CDF" && paymentCurrency === "USD") return amount * fxRate;

  return amount;
}

export async function GET(_req: Request, { params }: { params: { id: string; paymentId: string } }) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!payment || payment.orderId !== params.id) {
    return new NextResponse("Reçu introuvable", { status: 404 });
  }

  const order = payment.order;
  const fxRate = safeFxRate(order.fxRate);

  const converted = convertToOrderCurrency(
    Number(payment.amount || 0),
    payment.currency as any,
    order.currency as any,
    fxRate
  );

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Reçu Paiement - ${payment.id}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f6f6f6; margin:0; padding:24px; }
    .paper { max-width: 720px; margin: 0 auto; background:#fff; border-radius: 14px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
    .row { display:flex; justify-content:space-between; gap:16px; }
    .muted { color:#555; font-size:12px; }
    h1 { margin:0; font-size:18px; }
    h2 { margin:18px 0 8px; font-size:14px; }
    .box { border:1px solid #e5e5e5; border-radius: 12px; padding: 12px; }
    .kv { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e8e8e8; font-size:13px; }
    .kv:last-child{ border-bottom:none; }
    .big { font-size:16px; font-weight:700; }
    .btn { display:inline-block; margin-top:14px; background:#111; color:#fff; padding:10px 12px; border-radius:10px; text-decoration:none; font-size:13px; }
    @media print {
      body { background:#fff; padding:0; }
      .paper { box-shadow:none; border-radius:0; }
      .btn { display:none; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="row">
      <div>
        <h1>Reçu de Paiement</h1>
        <div class="muted">Smart Atelier • ERP Atelier Couture</div>
      </div>
      <div style="text-align:right">
        <div class="muted">Date</div>
        <div class="big">${new Date(payment.paidAt).toLocaleString("fr-FR")}</div>
      </div>
    </div>

    <h2>Référence</h2>
    <div class="box">
      <div class="kv"><span>Commande</span><span><b>${order.code}</b></span></div>
      <div class="kv"><span>Client</span><span><b>${order.customer.fullName}</b></span></div>
      <div class="kv"><span>ID Paiement</span><span style="font-family:monospace">${payment.id}</span></div>
    </div>

    <h2>Détails du paiement</h2>
    <div class="box">
      <div class="kv"><span>Montant payé</span><span><b>${payment.currency} ${Number(payment.amount).toLocaleString("fr-FR")}</b></span></div>
      <div class="kv"><span>Méthode</span><span><b>${payment.method}</b></span></div>
      <div class="kv"><span>Note</span><span>${payment.note ?? "—"}</span></div>
    </div>

    <h2>Conversion (selon la devise de la commande)</h2>
    <div class="box">
      <div class="kv"><span>Devise commande</span><span><b>${order.currency}</b></span></div>
      <div class="kv"><span>Taux (USD→CDF)</span><span><b>${fxRate.toLocaleString("fr-FR")}</b></span></div>
      <div class="kv"><span>Montant converti</span><span><b>${order.currency} ${converted.toLocaleString("fr-FR")}</b></span></div>
      <div class="muted" style="margin-top:8px">
        Si le paiement est dans la même devise que la commande, le montant converti = montant payé.
      </div>
    </div>

    <a class="btn" href="#" onclick="window.print(); return false;">Imprimer (ou enregistrer en PDF)</a>
  </div>

  <script>
    // Auto print (optionnel)
    setTimeout(() => { try { window.print(); } catch(e) {} }, 300);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
