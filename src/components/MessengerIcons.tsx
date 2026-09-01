import Image from "next/image";

const ICON_SIZE = 28;

export function HeaderMessengers({
  telegram,
  max,
  telegramLabel = "Telegram",
  maxLabel = "MAX",
  className,
}: {
  telegram?: string;
  max?: string;
  telegramLabel?: string;
  maxLabel?: string;
  className?: string;
}) {
  const links = [
    telegram
      ? { href: telegram, label: telegramLabel, src: "/icons/telegram.svg" }
      : null,
    max ? { href: max, label: maxLabel, src: "/icons/max.png" } : null,
  ].filter(Boolean) as { href: string; label: string; src: string }[];

  if (!links.length) return null;

  return (
    <div className={`header-messengers${className ? ` ${className}` : ""}`}>
      {links.map(({ href, label, src }) => (
        <a
          key={label}
          href={href}
          className="header-messengers__link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
        >
          <Image
            src={src}
            alt=""
            width={ICON_SIZE}
            height={ICON_SIZE}
            unoptimized
          />
        </a>
      ))}
    </div>
  );
}
