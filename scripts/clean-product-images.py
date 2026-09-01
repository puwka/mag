#!/usr/bin/env python3
"""
Remove Vitex factory branding from product photos (logo, red labels, blue badges).

Preserves the product: masks only branding-colored pixels in corner regions,
then inpaints with OpenCV Navier-Stokes + white-background restoration.

Usage:
  python scripts/clean-product-images.py
  python scripts/clean-product-images.py --verify-only
  python scripts/clean-product-images.py --file original/foo.jpg --save-mask
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "original"
CLEAN = ROOT / "clean"
REPORT = ROOT / "clean" / "verification-report.json"

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def load_image(path: Path) -> tuple[np.ndarray, bool, np.ndarray | None]:
    data = np.fromfile(str(path), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Cannot read {path}")
    has_alpha = img.ndim == 3 and img.shape[2] == 4
    if has_alpha:
        bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
        alpha = img[:, :, 3]
    else:
        bgr = img if img.ndim == 3 else cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        alpha = None
    return bgr, has_alpha, alpha


def save_image(path: Path, bgr: np.ndarray, has_alpha: bool, alpha: np.ndarray | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out_path = path
    if has_alpha and alpha is not None:
        bgra = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
        bgra[:, :, 3] = alpha
        if path.suffix.lower() in (".jpg", ".jpeg"):
            out_path = path.with_suffix(".png")
        ok, buf = cv2.imencode(out_path.suffix, bgra)
    else:
        ok, buf = cv2.imencode(path.suffix if path.suffix else ".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ok:
        raise ValueError(f"Cannot encode {out_path}")
    buf.tofile(str(out_path))


def estimate_bg_color(bgr: np.ndarray) -> np.ndarray:
    """Median BGR of near-white edge pixels."""
    h, w = bgr.shape[:2]
    strips = [
        bgr[0:3, :, :],
        bgr[h - 3 : h, :, :],
        bgr[:, 0:3, :],
        bgr[:, w - 3 : w, :],
    ]
    pixels = np.concatenate([s.reshape(-1, 3) for s in strips], axis=0)
    bright = pixels[pixels.mean(axis=1) > 230]
    if len(bright) < 10:
        bright = pixels
    return np.median(bright, axis=0).astype(np.uint8)


def red_pixels(hsv: np.ndarray) -> np.ndarray:
    m1 = cv2.inRange(hsv, (0, 80, 50), (10, 255, 255))
    m2 = cv2.inRange(hsv, (170, 80, 50), (180, 255, 255))
    return cv2.bitwise_or(m1, m2)


def blue_pixels(hsv: np.ndarray) -> np.ndarray:
    return cv2.inRange(hsv, (98, 50, 35), (132, 255, 255))


def blue_emblem_top_right_mask(bgr: np.ndarray, hsv: np.ndarray, h: int, w: int) -> np.ndarray:
    """Round blue/cyan Vitex emblem — top-right corner, white background only."""
    zone = np.zeros((h, w), np.uint8)
    y1, y2 = 0, int(h * 0.32)
    x1, x2 = int(w * 0.45), w
    if y2 <= y1 or x2 <= x1:
        return zone

    sub_bgr = bgr[y1:y2, x1:x2]
    sub_hsv = hsv[y1:y2, x1:x2]

    b_ch = sub_bgr[:, :, 0].astype(np.int16)
    g_ch = sub_bgr[:, :, 1].astype(np.int16)
    r_ch = sub_bgr[:, :, 2].astype(np.int16)

    blue_cyan = cv2.inRange(sub_hsv, (75, 12, 35), (135, 255, 255))
    green = cv2.inRange(sub_hsv, (35, 20, 35), (90, 255, 255))
    faded_blue = (
        (b_ch > g_ch + 3) & (b_ch > r_ch + 3)
    ).astype(np.uint8) * 255

    m = cv2.bitwise_or(blue_cyan, green)
    m = cv2.bitwise_or(m, faded_blue)
    knit = knit_fabric_mask(sub_bgr)
    m = cv2.bitwise_and(m, cv2.bitwise_not(knit))
    glove = glove_product_mask(sub_bgr)
    m = cv2.bitwise_and(m, cv2.bitwise_not(glove))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    m = cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=2)
    zone[y1:y2, x1:x2] = m
    return zone


def knit_fabric_mask(bgr: np.ndarray) -> np.ndarray:
    """Grey/white knit glove: low saturation, balanced BGR channels."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    b, g, r = [c.astype(np.int16) for c in cv2.split(bgr)]
    balanced = (np.abs(b - g) < 12) & (np.abs(g - r) < 12)
    return ((hsv[:, :, 1] < 28) & balanced & (gray > 85) & (gray < 240)).astype(np.uint8) * 255


def glove_product_mask(bgr: np.ndarray) -> np.ndarray:
    """Glove = largest non-white component in the center of the frame."""
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    not_white = (gray < 254).astype(np.uint8) * 255
    not_white = cv2.morphologyEx(not_white, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    n, labels, stats, centroids = cv2.connectedComponentsWithStats(not_white, connectivity=8)
    if n <= 1:
        return not_white

    best_idx = 0
    best_area = 0
    for i in range(1, n):
        cx, cy = centroids[i]
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 800:
            continue
        if not (0.10 * w < cx < 0.90 * w and 0.12 * h < cy < 0.90 * h):
            continue
        if area > best_area:
            best_area = area
            best_idx = i

    if best_idx == 0:
        best_idx = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))

    glove = (labels == best_idx).astype(np.uint8) * 255
    # Light fingertips can detach from the main blob — keep fragments near the glove
    near = cv2.dilate(glove, np.ones((31, 31), np.uint8), iterations=2)
    glove = cv2.bitwise_or(glove, cv2.bitwise_and(not_white, near))
    return cv2.dilate(glove, np.ones((9, 9), np.uint8), iterations=2)


def top_right_branding_color_mask(bgr: np.ndarray, h: int, w: int) -> np.ndarray:
    """Blue emblem, yellow handshake, green ring, black «ВИТЕКС» — not knit fabric."""
    zone = np.zeros((h, w), np.uint8)
    y2, x1 = int(h * 0.28), int(w * 0.50)
    if y2 <= 0 or x1 >= w:
        return zone

    roi = bgr[0:y2, x1:w]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    b, g, r = [c.astype(np.int16) for c in cv2.split(roi)]

    blue_cyan = cv2.inRange(hsv, (68, 4, 28), (145, 255, 255))
    green = cv2.inRange(hsv, (32, 8, 28), (95, 255, 255))
    yellow = cv2.inRange(hsv, (8, 28, 55), (48, 255, 255))
    dark_text = cv2.inRange(gray, 0, 108)
    blue_dom = ((b > g + 2) & (b > r + 2)).astype(np.uint8) * 255

    colored = cv2.bitwise_or(blue_cyan, green)
    colored = cv2.bitwise_or(colored, yellow)
    colored = cv2.bitwise_or(colored, blue_dom)
    colored = cv2.bitwise_or(colored, dark_text)

    knit = knit_fabric_mask(roi)
    glove = glove_product_mask(roi)
    protect = cv2.bitwise_or(knit, glove)
    m = cv2.bitwise_and(colored, cv2.bitwise_not(protect))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=1)
    zone[0:y2, x1:w] = m
    return zone


def clean_top_right_corner(bgr: np.ndarray, glove_protect: np.ndarray | None = None) -> np.ndarray:
    """Remove emblem/logo colors from top-right; preserve glove knit."""
    h, w = bgr.shape[:2]
    mask = top_right_branding_color_mask(bgr, h, w)
    if mask.sum() == 0 and glove_protect is None:
        return bgr

    bg = estimate_bg_color(bgr)
    out = bgr.copy()
    gray = cv2.cvtColor(out, cv2.COLOR_BGR2GRAY)
    on_light = gray > 140
    if mask.sum():
        out[(mask > 0) & on_light] = bg
        out = cv2.inpaint(out, mask, 5, cv2.INPAINT_NS)
        out[(mask > 0) & on_light] = bg

    # Flatten top-right background using original glove silhouette
    y2, x1 = int(h * 0.20), int(w * 0.55)
    glove = glove_protect if glove_protect is not None else glove_product_mask(out)
    corner = out[0:y2, x1:w]
    corner_glove = glove[0:y2, x1:w]
    corner[corner_glove == 0] = bg
    out[0:y2, x1:w] = corner
    return out


def logo_zone_mask(bgr: np.ndarray, hsv: np.ndarray) -> np.ndarray:
    """Top-right corner: «Фабрика ВИТЕКС» black text on white background."""
    h, w = bgr.shape[:2]
    zone = np.zeros((h, w), np.uint8)
    y1, y2 = 0, max(int(h * 0.22), 24)
    x1, x2 = int(w * 0.58), w
    if y2 <= y1 or x2 <= x1:
        return zone

    sub_hsv = hsv[y1:y2, x1:x2]
    sub_gray = cv2.cvtColor(bgr[y1:y2, x1:x2], cv2.COLOR_BGR2GRAY)
    on_white = cv2.inRange(sub_gray, 230, 255)
    sat = sub_hsv[:, :, 1]
    val = sub_hsv[:, :, 2]

    text = ((sat < 35) & (val < 105)).astype(np.uint8) * 255
    text = cv2.bitwise_and(text, on_white)
    zone[y1:y2, x1:x2] = cv2.morphologyEx(text, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    return zone


def top_left_red_mask(hsv: np.ndarray, h: int, w: int) -> np.ndarray:
    """Red arrow + «N нитка» (top-left corner only)."""
    zone = np.zeros((h, w), np.uint8)
    y1, y2 = 0, int(h * 0.36)
    x1, x2 = 0, int(w * 0.48)
    sub = hsv[y1:y2, x1:x2]
    r = red_pixels(sub)
    r = cv2.morphologyEx(r, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    r = cv2.dilate(r, np.ones((3, 3), np.uint8), iterations=1)
    zone[y1:y2, x1:x2] = r
    return zone


def bottom_right_badge_mask(hsv: np.ndarray, h: int, w: int) -> np.ndarray:
    """Blue «Упаковка N пар» badge — bottom-right corner only."""
    zone = np.zeros((h, w), np.uint8)
    y1, y2 = int(h * 0.64), h
    x1, x2 = int(w * 0.52), w
    sub = hsv[y1:y2, x1:x2]
    b = blue_pixels(sub)
    # Keep largest connected component (badge blob, not noise)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(b, connectivity=8)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        idx = 1 + int(np.argmax(areas))
        b = (labels == idx).astype(np.uint8) * 255
    b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    zone[y1:y2, x1:x2] = b
    sub_gray = cv2.cvtColor(cv2.cvtColor(sub, cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2GRAY)
    white_text = cv2.inRange(sub_gray, 175, 255)
    white_text = cv2.bitwise_and(white_text, cv2.dilate(b, np.ones((9, 9), np.uint8), iterations=2))
    zone[y1:y2, x1:x2] = cv2.bitwise_or(zone[y1:y2, x1:x2], white_text)
    return zone


def has_vitex_branding(bgr: np.ndarray) -> bool:
    """Detect standard Vitex product photo overlays."""
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    white_ratio = (gray > 240).sum() / gray.size
    if white_ratio < 0.25:
        return False

    tl_red = red_pixels(hsv[0 : int(h * 0.36), 0 : int(w * 0.48)]).sum()
    br_blue = blue_pixels(hsv[int(h * 0.64) :, int(w * 0.52) :]).sum()
    tr = hsv[0 : int(h * 0.20), int(w * 0.60) :]
    tr_dark = cv2.inRange(cv2.cvtColor(cv2.cvtColor(tr, cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2GRAY), 0, 100).sum()

    return tl_red > 800 or br_blue > 800 or tr_dark > 1500


def build_branding_mask(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    mask = logo_zone_mask(bgr, hsv)
    mask = cv2.bitwise_or(mask, blue_emblem_top_right_mask(bgr, hsv, h, w))
    mask = cv2.bitwise_or(mask, top_left_red_mask(hsv, h, w))
    mask = cv2.bitwise_or(mask, bottom_right_badge_mask(hsv, h, w))

    # Never inpaint the glove product
    glove = glove_product_mask(bgr)
    mask = cv2.bitwise_and(mask, cv2.bitwise_not(glove))

    # Slight dilation for anti-aliased edges
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.dilate(mask, k, iterations=1)

    # Never touch product cuff: bottom-center red wrist trim
    cuff_y1 = int(h * 0.78)
    cuff = red_pixels(hsv[cuff_y1:h, int(w * 0.12) : int(w * 0.88)])
    cuff = cv2.morphologyEx(cuff, cv2.MORPH_OPEN, np.ones((3, 7), np.uint8))
    mask[cuff_y1:h, int(w * 0.12) : int(w * 0.88)] = cv2.bitwise_and(
        mask[cuff_y1:h, int(w * 0.12) : int(w * 0.88)], cv2.bitwise_not(cuff)
    )

    return mask


def restore_background(bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    bg = estimate_bg_color(bgr)
    out = bgr.copy()
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    # Near-white masked pixels -> flat background
    near_white = (mask > 0) & (gray > 200)
    out[near_white] = bg
    return out


def inpaint_branding(bgr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    if mask.sum() == 0:
        return bgr.copy()
    r = max(3, min(bgr.shape[:2]) // 90)
    out = cv2.inpaint(bgr, mask, r + 3, cv2.INPAINT_NS)
    out = cv2.inpaint(out, mask, r, cv2.INPAINT_TELEA)
    out = restore_background(out, mask)
    return out


def refine_pass(bgr: np.ndarray, glove_protect: np.ndarray | None = None) -> np.ndarray:
    """Second pass on zones that still contain branding."""
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    extra = np.zeros((h, w), np.uint8)

    tr = hsv[0 : int(h * 0.32), int(w * 0.45) :]
    tr_bgr = bgr[0 : int(h * 0.32), int(w * 0.45) :]
    tr_gray = cv2.cvtColor(tr_bgr, cv2.COLOR_BGR2GRAY)
    sat = tr[:, :, 1]
    m1 = (((tr[:, :, 0] >= 35) & (tr[:, :, 0] <= 90)) & (sat > 30)).astype(np.uint8) * 255
    m2 = cv2.inRange(tr_gray, 0, 100)
    m3 = cv2.inRange(tr, (75, 8, 100), (145, 200, 255))
    m = cv2.bitwise_or(cv2.bitwise_or(m1, m2), m3)
    if glove_protect is not None:
        protect = glove_protect[0 : int(h * 0.32), int(w * 0.45) :]
    else:
        knit = knit_fabric_mask(tr_bgr)
        glove = glove_product_mask(tr_bgr)
        protect = cv2.bitwise_or(knit, glove)
    m = cv2.bitwise_and(m, cv2.bitwise_not(protect))
    extra[0 : int(h * 0.32), int(w * 0.45) :] = m

    tl = hsv[0 : int(h * 0.36), 0 : int(w * 0.48)]
    extra[0 : int(h * 0.36), 0 : int(w * 0.48)] = red_pixels(tl)

    br = hsv[int(h * 0.64) :, int(w * 0.52) :]
    b = blue_pixels(br)
    extra[int(h * 0.64) :, int(w * 0.52) :] = b

    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    extra = cv2.dilate(extra, k, iterations=1)
    return inpaint_branding(bgr, extra) if extra.sum() else bgr


def verify_clean(bgr: np.ndarray) -> dict:
    h, w = bgr.shape[:2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    issues: list[str] = []

    tr = hsv[0 : int(h * 0.32), int(w * 0.45) :]
    tr_gray = cv2.cvtColor(bgr[0 : int(h * 0.32), int(w * 0.45) :], cv2.COLOR_BGR2GRAY)
    sat = tr[:, :, 1]
    logo_color = (
        (((tr[:, :, 0] >= 35) & (tr[:, :, 0] <= 90)) & (sat > 30)).sum()
        + cv2.inRange(tr, (75, 8, 100), (145, 200, 255)).sum() // 255
    )
    if logo_color > 200:
        issues.append("top-right: logo/emblem color")
    if cv2.inRange(tr_gray, 0, 100).sum() // 255 > 350:
        issues.append("top-right: dark text")

    tl = hsv[0 : int(h * 0.36), 0 : int(w * 0.48)]
    if red_pixels(tl).sum() // 255 > 450:
        issues.append("top-left: red label")

    br = hsv[int(h * 0.64) :, int(w * 0.52) :]
    if blue_pixels(br).sum() // 255 > 350:
        issues.append("bottom-right: blue badge")

    return {"ok": len(issues) == 0, "issues": issues}


def process_file(src: Path, dst: Path, save_mask: bool = False) -> dict:
    bgr, has_alpha, alpha = load_image(src)
    h0, w0 = bgr.shape[:2]

    if not has_vitex_branding(bgr):
        save_image(dst, bgr, has_alpha, alpha)
        return {
            "file": src.name,
            "output": dst.name,
            "size": [w0, h0],
            "mask_pixels": 0,
            "skipped": True,
            "ok": True,
            "issues": [],
        }

    mask = build_branding_mask(bgr)
    glove_protect = glove_product_mask(bgr)
    cleaned = inpaint_branding(bgr, mask)
    cleaned = refine_pass(cleaned, glove_protect)
    cleaned = clean_top_right_corner(cleaned, glove_protect)
    cleaned = clean_top_right_corner(cleaned, glove_protect)

    if save_mask:
        cv2.imwrite(str(ORIGINAL / f"_mask-{src.stem}.png"), mask)

    save_image(dst, cleaned, has_alpha, alpha)
    v = verify_clean(cleaned)
    return {
        "file": src.name,
        "output": dst.name,
        "size": [w0, h0],
        "mask_pixels": int(mask.sum() // 255),
        **v,
    }


def iter_sources(single: str | None) -> list[Path]:
    if single:
        p = Path(single)
        if not p.is_absolute():
            p = ROOT / p
        return [p]
    return sorted(
        p
        for p in ORIGINAL.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED and not p.name.startswith("_")
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file")
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--save-mask", action="store_true")
    args = parser.parse_args()

    CLEAN.mkdir(parents=True, exist_ok=True)

    if args.verify_only:
        results = []
        for p in sorted(CLEAN.iterdir()):
            if p.suffix.lower() not in SUPPORTED:
                continue
            bgr, _, _ = load_image(p)
            v = verify_clean(bgr)
            results.append({"file": p.name, **v})
        REPORT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
        failed = [r for r in results if not r["ok"]]
        print(f"Verified {len(results)} files, {len(failed)} with issues")
        for r in failed:
            print(f"  FAIL {r['file']}: {', '.join(r['issues'])}")
        return 1 if failed else 0

    sources = iter_sources(args.file)
    if not sources:
        print(f"No images in {ORIGINAL}. Run: npm run images:download")
        return 1

    results = []
    for src in sources:
        if src.name.startswith("sample-0") and src.stat().st_size < 1000:
            continue
        dst = CLEAN / src.name
        print(f"Processing {src.name} ...")
        try:
            r = process_file(src, dst, save_mask=args.save_mask)
            tag = "OK" if r["ok"] else "WARN"
            print(f"  {tag} mask={r['mask_pixels']}px")
            if not r["ok"]:
                print(f"    {', '.join(r['issues'])}")
            results.append(r)
        except Exception as e:
            print(f"  ERROR {e}")
            results.append({"file": src.name, "ok": False, "issues": [str(e)]})

    REPORT.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    ok = sum(1 for r in results if r.get("ok"))
    print(f"\nDone: {ok}/{len(results)} passed -> {CLEAN}")
    print(f"Report: {REPORT}")
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
