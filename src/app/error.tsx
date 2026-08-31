"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container empty-state" style={{ padding: "80px 16px", textAlign: "center" }}>
      <h1 className="page-title">Что-то пошло не так</h1>
      <p style={{ color: "#666" }}>{error.message || "Ошибка приложения"}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Попробовать снова
      </button>
    </div>
  );
}
