/** Safe menu/link helper — never emit href="#". */
export function menuHref(url: string | null | undefined): string | null {
  if (!url || url === "#" || url.trim() === "") return null;
  return url;
}
