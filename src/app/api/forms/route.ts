import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonServerClient } from "@/lib/supabase/anon";
import type { FormType } from "@/lib/types";

const ALLOWED: FormType[] = [
  "contact",
  "price_list",
  "product_request",
  "product_selection",
  "partnership",
  "logo_application",
];

function supabaseForFormsInsert() {
  try {
    return createAdminClient();
  } catch {
    return createAnonServerClient();
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const formType = body.formType as FormType;
    if (!ALLOWED.includes(formType)) {
      return NextResponse.json({ error: "Неизвестный тип формы" }, { status: 400 });
    }
    const payload = body.payload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Пустая форма" }, { status: 400 });
    }

    const needsAcceptance = [
      "contact",
      "price_list",
      "product_request",
      "partnership",
    ].includes(formType);
    if (needsAcceptance && payload.acceptance !== "1" && payload.acceptance !== true) {
      return NextResponse.json(
        { error: "Нужно согласие на обработку персональных данных" },
        { status: 400 }
      );
    }

    const sb = supabaseForFormsInsert();
    const { error } = await sb.from("form_submissions").insert({
      form_type: formType,
      payload,
      product_id: body.productId || null,
      product_url: body.productUrl || null,
      status: "new",
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Не удалось сохранить заявку" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
