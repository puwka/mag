"""
Rebuild white backgrounds on catalog-export product photos:
remove logo paint-overs by forcing the entire background to uniform
#FFFFFF while keeping the product, callout text, and packaging badge.

Saves PNG (JPEG reintroduces visible patch texture on flat white).

Usage:
  python scripts/clean_catalog_export_blotches.py
  python scripts/clean_catalog_export_blotches.py --dry-run
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path("catalog-export/products")
REPORT = Path("tmp/blotch-clean-report.json")


def product_keep_mask(arr: np.ndarray) -> np.ndarray:
    """Preserve product + labels; do not keep noisy near-white background."""
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    mean = (r + g + b) / 3.0
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)

    strong = (chroma > 25) | (mean < 200)
    red = (r > 110) & (r > g + 35) & (r > b + 35)
    blue = (b > r + 12) & (b > g + 8) & (b > 70)
    warm = (r > 150) & (g > 100) & (r > b + 30) & (chroma > 25)
    light = (mean < 242) & (mean > 160) & (chroma >= 4) & (chroma <= 40)

    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    core = (strong | red | blue | warm).astype(np.uint8)
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, ker, iterations=2)

    # Light knit only if near core (avoids keeping noisy white bg as "fabric")
    core_d = cv2.dilate(core, ker, iterations=4)
    fabric = light.astype(np.uint8) & core_d
    keep = cv2.bitwise_or(core, fabric)
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, ker, iterations=2)

    num, labels, stats, _ = cv2.connectedComponentsWithStats(keep, 8)
    cleaned = np.zeros_like(keep)
    min_area = max(120, int(arr.shape[0] * arr.shape[1] * 0.0008))
    for i in range(1, num):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            cleaned[labels == i] = 1

    dil = cv2.dilate(
        cleaned, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)), 1
    )
    fringe_ok = (chroma > 10) | (mean < 235) | cleaned.astype(bool)
    return (dil.astype(bool) & fringe_ok) | cleaned.astype(bool)


def is_white_bg_candidate(arr: np.ndarray) -> bool:
    h, w = arr.shape[:2]
    samples = [
        arr[0:8, 0:8],
        arr[0:8, w - 8 : w],
        arr[h - 8 : h, 0:8],
        arr[h - 8 : h, w - 8 : w],
    ]
    return sum(1 for s in samples if s.mean() >= 235) >= 2


def rebuild_white_bg(arr: np.ndarray) -> tuple[np.ndarray, int]:
    keep = product_keep_mask(arr)
    bg = ~keep
    changed = int(np.count_nonzero(bg & ~((arr == 255).all(axis=2))))
    out = arr.copy()
    out[bg] = (255, 255, 255)
    return out, changed


def clean_image(path: Path, dry_run: bool = False) -> dict:
    im = Image.open(path).convert("RGB")
    arr = np.array(im)

    if not is_white_bg_candidate(arr):
        return {"file": str(path), "pixels": 0, "changed": False}

    out, pixels = rebuild_white_bg(arr)
    if pixels < 50:
        return {"file": str(path), "pixels": 0, "changed": False}

    out_path = path
    if not dry_run:
        out_path = path.with_suffix(".png")
        Image.fromarray(out).save(out_path, optimize=True)
        if out_path != path and path.exists():
            path.unlink()

    return {
        "file": str(out_path).replace("\\", "/"),
        "pixels": pixels,
        "changed": True,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not ROOT.exists():
        raise SystemExit(f"Missing {ROOT}")

    files = sorted(
        p
        for p in ROOT.glob("*/images/*")
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    print(f"Scanning {len(files)} images{' (dry-run)' if args.dry_run else ''}...")

    changed = []
    for f in files:
        s = clean_image(f, dry_run=args.dry_run)
        if s["changed"]:
            changed.append(s)
            rel = Path(s["file"]).relative_to(ROOT).as_posix()
            print(f"cleaned {s['pixels']:6d} px  {rel}")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "dryRun": args.dry_run,
        "scanned": len(files),
        "cleaned": len(changed),
        "files": [
            {
                "file": Path(c["file"]).relative_to(ROOT).as_posix(),
                "pixels": c["pixels"],
            }
            for c in changed
        ],
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone. Cleaned {len(changed)}/{len(files)}. Report: {REPORT}")


if __name__ == "__main__":
    main()
