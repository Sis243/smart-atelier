import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();

    const items = await prisma.stockItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        quantity: true,
        minQuantity: true,
        unitCost: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (format === "excel") {
      const rows = items
        .map((i) => {
          const value = Number(i.quantity || 0) * Number(i.unitCost || 0);
          return `<tr>
            <td>${i.name}</td>
            <td>${i.category ?? ""}</td>
            <td>${i.unit ?? ""}</td>
            <td>${i.quantity}</td>
            <td>${i.minQuantity}</td>
            <td>${i.unitCost}</td>
            <td>${value.toFixed(2)}</td>
            <td>${new Date(i.updatedAt).toLocaleString("fr-FR")}</td>
          </tr>`;
        })
        .join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"/></head><body>
        <table border="1" cellspacing="0" cellpadding="6">
          <thead>
            <tr>
              <th>Article</th>
              <th>Catégorie</th>
              <th>Unité</th>
              <th>Quantité</th>
              <th>Seuil min</th>
              <th>Coût unitaire</th>
              <th>Valeur stock</th>
              <th>Maj</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="stock.xls"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const header = [
      "Article",
      "Catégorie",
      "Unité",
      "Quantité",
      "Seuil min",
      "Coût unitaire",
      "Valeur stock",
      "Mis à jour",
    ];

    const lines = [
      header.map(csvEscape).join(","),
      ...items.map((i) => {
        const value = Number(i.quantity || 0) * Number(i.unitCost || 0);
        return [
          i.name,
          i.category ?? "",
          i.unit ?? "",
          i.quantity,
          i.minQuantity,
          i.unitCost,
          value.toFixed(2),
          new Date(i.updatedAt).toISOString(),
        ]
          .map(csvEscape)
          .join(",");
      }),
    ].join("\n");

    return new NextResponse(lines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stock.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Export stock impossible" },
      { status: 500 }
    );
  }
}