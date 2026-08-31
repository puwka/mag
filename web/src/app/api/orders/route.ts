import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderItemIn = {
  productId: string;
  name?: string;
  sku?: string | null;
  quantity: number;
  pairsPerPack?: number;
  unitPrice?: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (
      !body.customer_name ||
      !body.customer_phone ||
      !Array.isArray(body.items) ||
      !body.items.length
    ) {
      return NextResponse.json(
        { error: "Заполните обязательные поля" },
        { status: 400 }
      );
    }

    const sb = createAdminClient();
    const inputItems = body.items as OrderItemIn[];
    const productIds = inputItems.map((i) => i.productId).filter(Boolean);

    const { data: products } = await sb
      .from("products")
      .select("id, name, sku, pack_price, pairs_per_pack, price_on_request, status")
      .in("id", productIds);

    const byId = new Map(
      ((products as {
        id: string;
        name: string;
        sku: string | null;
        pack_price: number | null;
        pairs_per_pack: number | null;
        price_on_request: boolean;
        status: string;
      }[] | null) ?? []).map((p) => [p.id, p])
    );

    const rows: {
      product_id: string;
      product_name: string;
      product_sku: string | null;
      quantity_packs: number;
      pairs_per_pack: number | null;
      unit_price: number;
      line_total: number;
    }[] = [];

    let subtotal = 0;
    for (const item of inputItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const p = byId.get(item.productId);
      if (!p || p.status !== "published") {
        return NextResponse.json(
          { error: "Один из товаров недоступен" },
          { status: 400 }
        );
      }
      const unit =
        p.price_on_request || p.pack_price == null
          ? 0
          : Number(p.pack_price);
      const line = unit * qty;
      subtotal += line;
      rows.push({
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        quantity_packs: qty,
        pairs_per_pack: p.pairs_per_pack,
        unit_price: unit,
        line_total: line,
      });
    }

    const source =
      typeof body.source === "string" && body.source
        ? body.source
        : "checkout";

    const { data: order, error } = await sb
      .from("orders")
      .insert({
        customer_name: String(body.customer_name).trim(),
        customer_phone: String(body.customer_phone).trim(),
        customer_email: body.customer_email
          ? String(body.customer_email).trim()
          : null,
        customer_note: body.customer_note
          ? String(body.customer_note).trim()
          : null,
        subtotal,
        total: subtotal,
        status: "new",
        order_number: "",
        source_utm: {
          source,
          created_via: "web_checkout",
        },
      })
      .select("id, order_number, status, created_at, total")
      .single();

    if (error || !order) {
      console.error(error);
      return NextResponse.json(
        { error: "Не удалось создать заявку" },
        { status: 500 }
      );
    }

    const { error: itemsErr } = await sb.from("order_items").insert(
      rows.map((r) => ({ ...r, order_id: order.id }))
    );
    if (itemsErr) {
      console.error(itemsErr);
      return NextResponse.json(
        { error: "Заявка создана без позиций" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      order_number: order.order_number,
      id: order.id,
      status: "Новая",
      total: order.total,
      created_at: order.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
