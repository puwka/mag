import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/types";
import { mediaUrl } from "@/lib/media";

export function CategoryCard({ category }: { category: Category }) {
  const img = mediaUrl(category.image_path, "categories");
  return (
    <Link href={`/${category.path}`} className="category-card">
      <div className="category-card__media">
        {img ? (
          <Image src={img} alt={category.name} width={400} height={300} />
        ) : null}
      </div>
      <span className="category-card__title">{category.name}</span>
    </Link>
  );
}
