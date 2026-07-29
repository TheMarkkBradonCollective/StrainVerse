"""Strip near-black background from logo-master.png (flood-fill from corners)."""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'public' / 'logo-master.png'


def is_background(r: int, g: int, b: int) -> bool:
    m = max(r, g, b)
    mn = min(r, g, b)
    if m < 28:
        return True
    if m < 45 and (m - mn) < 18:
        return True
    # near-white studio / checkerboard export backgrounds
    if mn > 235 and (m - mn) < 25:
        return True
    return False


def main() -> None:
    data = np.array(Image.open(path).convert('RGBA'))
    h, w = data.shape[:2]
    bg = np.zeros((h, w), dtype=bool)

    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        q = deque([(sx, sy)])
        while q:
            x, y = q.popleft()
            if x < 0 or y < 0 or x >= w or y >= h or bg[y, x]:
                continue
            r, g, b, _ = data[y, x]
            if is_background(r, g, b):
                bg[y, x] = True
                q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    alpha = data[:, :, 3].copy()
    alpha[bg] = 0
    data[:, :, 3] = alpha
    Image.fromarray(data, 'RGBA').save(path)
    print(f'Removed background from {path} ({int(bg.sum())} pixels)')


if __name__ == '__main__':
    main()
