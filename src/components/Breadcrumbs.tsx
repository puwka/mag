import Link from "next/link";

export type Crumb = { name: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <div className="container">
        <span>
          <Link href="/">Главная страница</Link>
        </span>
        {items.map((item, i) => (
          <span key={i}>
            {item.href && i < items.length - 1 ? (
              <Link href={item.href}>{item.name}</Link>
            ) : (
              <strong>{item.name}</strong>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
