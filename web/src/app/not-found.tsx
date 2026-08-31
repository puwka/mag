import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-content">
      <div className="container empty-state" style={{ padding: "80px 16px", textAlign: "center" }}>
        <h1 className="page-title">404 — страница не найдена</h1>
        <p>Запрашиваемая страница удалена или никогда не существовала.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            На главную
          </Link>
          <Link href="/rabochie-perchatki/" className="btn btn-outline">
            В каталог
          </Link>
          <Link href="/contact/" className="btn btn-outline">
            Контакты
          </Link>
        </div>
      </div>
    </div>
  );
}
