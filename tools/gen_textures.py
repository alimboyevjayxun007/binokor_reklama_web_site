"""
Builds the PBR texture set for the Binokor site.
Photo sources (three.js example textures): wood planks.
Everything else is tileable spectral noise tuned to real material photos.
Outputs to binokor-site/src/assets/tex/.
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources")
OUT = os.path.join(HERE, "..", "src", "assets", "tex")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SRC, exist_ok=True)

# source photos/HDRIs (three.js examples, MIT; Poly Haven HDRIs via pmndrs/drei-assets, CC0)
SOURCES = {
    "hardwood2_diffuse.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg",
    "hardwood2_bump.jpg": "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_bump.jpg",
    "studio.hdr": "https://raw.githubusercontent.com/pmndrs/drei-assets/master/hdri/studio_small_03_1k.hdr",
    "warehouse.hdr": "https://raw.githubusercontent.com/pmndrs/drei-assets/master/hdri/empty_warehouse_01_1k.hdr",
}


def fetch_sources():
    import urllib.request

    for name, url in SOURCES.items():
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print("downloading", name)
            urllib.request.urlretrieve(url, path)
FONT_BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"


def fractal(n, beta=2.0, seed=0, m=None):
    """Tileable fractal noise via spectral synthesis, normalised to 0..1."""
    m = m or n
    rng = np.random.default_rng(seed)
    white = rng.standard_normal((m, n))
    f = np.fft.fft2(white)
    fy = np.fft.fftfreq(m)[:, None]
    fx = np.fft.fftfreq(n)[None, :]
    r = np.sqrt(fx * fx + fy * fy)
    r[0, 0] = 1
    f *= 1.0 / r ** (beta / 2)
    f[0, 0] = 0
    out = np.real(np.fft.ifft2(f))
    out -= out.min()
    out /= out.max()
    return out


def normal_map(h, strength=4.0):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    nx = -dx * strength
    ny = dy * strength
    nz = np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    return ((n * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)


def dents(n, count, rmin, rmax, seed, m=None, depth=1.0):
    """Tileable round pits (pores, chips)."""
    m = m or n
    rng = np.random.default_rng(seed)
    h = np.zeros((m, n))
    yy, xx = np.mgrid[0:m, 0:n]
    for _ in range(count):
        cx, cy = rng.uniform(0, n), rng.uniform(0, m)
        r = rng.uniform(rmin, rmax)
        x0, x1 = int(cx - r - 2), int(cx + r + 3)
        y0, y1 = int(cy - r - 2), int(cy + r + 3)
        xs = np.arange(x0, x1) % n
        ys = np.arange(y0, y1) % m
        gx, gy = np.meshgrid(np.arange(x0, x1), np.arange(y0, y1))
        d = np.sqrt((gx - cx) ** 2 + (gy - cy) ** 2) / r
        bowl = np.clip(1 - d * d, 0, 1) * depth * rng.uniform(0.6, 1.0)
        sub = h[np.ix_(ys, xs)]
        h[np.ix_(ys, xs)] = np.maximum(sub, bowl)
    return h


def save_rgb(arr, name, q=88):
    name = name.rsplit(".", 1)[0] + ".webp"
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name), "WEBP", quality=q, method=6)


def lerp_col(a, b, t):
    a = np.array(a, float)
    b = np.array(b, float)
    return a + (b - a) * t[..., None]


# ---------------------------------------------------------------- clay brick
def clay():
    n = 1024
    low = fractal(n, 3.2, 1)
    mid = fractal(n, 2.2, 2)
    fine = fractal(n, 1.0, 3)
    base = lerp_col((150, 62, 38), (196, 96, 60), low)
    base *= (0.86 + 0.22 * mid)[..., None]
    burnt = np.clip((fractal(n, 2.6, 4) - 0.6) * 2.5, 0, 1) * 0.12
    base *= (1 - burnt)[..., None]
    rng = np.random.default_rng(5)
    specks = rng.random((n, n))
    base[specks > 0.9975] = (70, 32, 20)
    base[(specks < 0.0012)] = (226, 205, 178)  # lime inclusions
    base *= (0.93 + 0.12 * fine)[..., None]
    pits = dents(n, 900, 1.2, 4.5, 6)
    base *= (1 - pits * 0.35)[..., None]
    save_rgb(base, "clay_color.jpg")
    h = mid * 0.5 + fine * 0.35 - pits * 1.6
    save_rgb(normal_map(h, 6.0), "clay_normal.jpg", 90)


# ------------------------------------------------------- aerated concrete
def aerated():
    n = 1024
    low = fractal(n, 3.0, 11)
    fine = fractal(n, 1.2, 12)
    base = lerp_col((206, 208, 210), (230, 231, 232), low)
    base *= (0.95 + 0.07 * fine)[..., None]
    pores = dents(n, 5200, 0.8, 3.6, 13)
    base *= (1 - pores * 0.42)[..., None]
    save_rgb(base, "aerated_color.jpg")
    h = low * 0.2 + fine * 0.4 - pores * 2.2
    save_rgb(normal_map(h, 5.0), "aerated_normal.jpg", 90)


# ------------------------------------------------- woven polypropylene bag
def weave_height(n=512, strands=32):
    s = n / strands
    yy, xx = np.mgrid[0:n, 0:n].astype(float)
    u = (xx % s) / s
    v = (yy % s) / s
    cu = np.floor(xx / s)
    cv = np.floor(yy / s)
    warp_on_top = ((cu + cv) % 2 == 0)
    warp = np.sin(np.pi * u) ** 0.6  # strand cross-section
    weft = np.sin(np.pi * v) ** 0.6
    h = np.where(warp_on_top, 0.55 + 0.45 * warp, 0.55 + 0.45 * weft) * 0.9
    h += fractal(n, 1.4, 21) * 0.12
    return h


def weave():
    n = 512
    h = weave_height(n)
    dirt = fractal(n, 3.0, 22)
    base = lerp_col((214, 208, 194), (238, 234, 224), dirt)
    base *= (0.86 + 0.16 * h)[..., None]
    save_rgb(base, "weave_color.jpg")
    save_rgb(normal_map(h, 3.0), "weave_normal.jpg", 90)
    return h


def bag_label(h_weave):
    W, H = 1024, 640
    reps_x, reps_y = W // 512 + 1, H // 512 + 1
    hw = np.tile(h_weave, (reps_y, reps_x))[:H, :W]
    dirt = fractal(1024, 3.0, 23)[:H, :W]
    paper = lerp_col((216, 210, 196), (240, 236, 226), dirt) * (0.86 + 0.16 * hw)[..., None]

    ink = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ink)
    blue = (31, 70, 196, 255)
    d.rectangle([0, int(H * 0.30), W, int(H * 0.66)], fill=blue)
    d.rectangle([0, int(H * 0.66), W, int(H * 0.69)], fill=(214, 64, 40, 255))
    f_big = ImageFont.truetype(FONT_BLACK, 150)
    f_mid = ImageFont.truetype(FONT_BOLD, 64)
    f_small = ImageFont.truetype(FONT_SEMI, 30)
    d.text((W / 2, H * 0.48), "SEMENT", font=f_big, fill=(255, 255, 255, 255), anchor="mm")
    d.text((60, H * 0.15), "PORTLANDSEMENT", font=f_mid, fill=(20, 28, 48, 255), anchor="lm")
    d.text((W - 60, H * 0.15), "M400", font=f_mid, fill=(214, 64, 40, 255), anchor="rm")
    d.text((60, H * 0.82), "Netto 50 kg", font=ImageFont.truetype(FONT_BOLD, 56), fill=(20, 28, 48, 255), anchor="lm")
    d.text((W - 60, H * 0.80), "D20  GOST 31108", font=f_small, fill=(20, 28, 48, 255), anchor="rm")
    d.text((W - 60, H * 0.87), "Namlikdan saqlang", font=f_small, fill=(20, 28, 48, 255), anchor="rm")
    ink = ink.filter(ImageFilter.GaussianBlur(0.6))
    a = np.asarray(ink).astype(float)
    alpha = a[..., 3:4] / 255.0
    # print ink sits on the weave: modulate by strand height so the weave shows through
    inked = a[..., :3] * (0.82 + 0.22 * hw)[..., None]
    out = paper * (1 - alpha) + inked * alpha
    save_rgb(out, "bag_label.jpg", 90)


# ------------------------------------------------------------- rusty rebar
def rust():
    n = 512
    patches = fractal(n, 2.4, 31)
    fine = fractal(n, 1.0, 32)
    t = np.clip((patches - 0.42) * 3.2, 0, 1)
    steel = lerp_col((58, 60, 64), (84, 86, 90), fine)
    rustc = lerp_col((112, 52, 26), (168, 88, 44), fractal(n, 1.6, 33))
    col = steel * (1 - t[..., None]) + rustc * t[..., None]
    save_rgb(col, "rust_color.jpg")
    rough = 0.45 + 0.5 * t
    metal = 0.85 * (1 - t)
    rm = np.stack([np.zeros_like(rough), rough, metal], -1) * 255
    save_rgb(rm, "rust_rm.jpg", 90)
    h = fine * 0.6 + t * 0.5 + fractal(n, 0.8, 34) * 0.3
    save_rgb(normal_map(h, 3.5), "rust_normal.jpg", 90)


# ------------------------------------------------------------------- tiles
def marble():
    n = 1024
    yy, xx = np.mgrid[0:n, 0:n].astype(float) / n
    turb = fractal(n, 3.6, 41)
    turb2 = fractal(n, 3.0, 42)
    v1 = np.abs(np.sin((xx * 2 + yy * 1) * np.pi * 2 + turb * 5.0 + fractal(n, 2.0, 44) * 0.6))
    veins = np.clip(1 - v1 * 2.4, 0, 1) ** 3
    v2 = np.abs(np.sin((xx * 1 - yy * 3) * np.pi * 2 + turb2 * 6.0))
    fine_veins = np.clip(1 - v2 * 10, 0, 1) * 0.5
    cloud = fractal(n, 3.0, 43)
    base = lerp_col((232, 232, 229), (247, 247, 245), cloud)
    vein_col = np.array((112, 114, 120), float)
    t = np.clip(0.55 * veins + 0.35 * fine_veins, 0, 1)[..., None]
    t = np.asarray(Image.fromarray((t[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(float)[..., None] / 255
    base = base * (1 - t) + vein_col * t
    save_rgb(base, "tile_marble.jpg")


def porcelain():
    n = 1024
    low = fractal(n, 3.2, 51)
    fine = fractal(n, 1.1, 52)
    base = lerp_col((104, 106, 108), (138, 139, 140), low)
    base *= (0.93 + 0.1 * fine)[..., None]
    specks = np.random.default_rng(53).random((n, n))
    base[specks > 0.997] *= 0.7
    save_rgb(base, "tile_stone.jpg")


def travertine():
    n = 1024
    yy = np.mgrid[0:n, 0:n][0].astype(float) / n
    bands = np.sin((yy * 14 + fractal(n, 2.4, 61) * 3) * np.pi) * 0.5 + 0.5
    base = lerp_col((200, 178, 146), (228, 212, 186), bands * 0.7 + fractal(n, 2.8, 62) * 0.3)
    holes = dents(n, 260, 1.5, 6, 63)
    base *= (1 - holes * 0.3)[..., None]
    save_rgb(base, "tile_travertine.jpg")


# -------------------------------------------------------------------- wood
def wood():
    img = Image.open(os.path.join(SRC, "hardwood2_diffuse.jpg")).convert("RGB")
    bump = Image.open(os.path.join(SRC, "hardwood2_bump.jpg")).convert("L")
    # long planks in the source (x0, y0, x1, y1) in 2048x1024 pixels
    boxes = [(8, 6, 956, 124), (8, 268, 956, 386), (976, 522, 2040, 642), (976, 268, 2040, 386)]
    atlas = Image.new("RGB", (1024, 512))
    natlas = Image.new("L", (1024, 512))
    for i, b in enumerate(boxes):
        atlas.paste(img.crop(b).resize((1024, 128), Image.LANCZOS), (0, i * 128))
        natlas.paste(bump.crop(b).resize((1024, 128), Image.LANCZOS), (0, i * 128))
    atlas.save(os.path.join(OUT, "wood_atlas.webp"), "WEBP", quality=85, method=6)
    h = np.asarray(natlas).astype(float) / 255.0
    save_rgb(normal_map(h, 2.5), "wood_normal.jpg", 90)

    # end grain rings
    n = 256
    yy, xx = np.mgrid[0:n, 0:n].astype(float)
    r = np.sqrt((xx - n * 0.3) ** 2 + (yy + n * 0.6) ** 2) / n
    rings = np.sin((r * 38 + fractal(n, 2.4, 71) * 2.5) * np.pi) * 0.5 + 0.5
    base = lerp_col((176, 128, 80), (214, 170, 118), rings)
    save_rgb(base, "wood_end.jpg")


# ---------------------------------------------------------------- cardboard
def kraft():
    n = 512
    fib = fractal(n, 1.3, 81)
    low = fractal(n, 3.0, 82)
    base = lerp_col((166, 124, 80), (196, 156, 108), low) * (0.92 + 0.12 * fib)[..., None]
    save_rgb(base, "kraft.jpg")


# ---------------------------------------------------------------- HDR resize
def read_hdr(path):
    data = open(path, "rb").read()
    head_end = data.index(b"\n\n") + 2
    line_end = data.index(b"\n", head_end)
    dims = data[head_end:line_end].split()
    h, w = int(dims[1]), int(dims[3])
    pos = line_end + 1
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        if data[pos] == 2 and data[pos + 1] == 2:
            pos += 4
            for c in range(4):
                x = 0
                while x < w:
                    cnt = data[pos]
                    pos += 1
                    if cnt > 128:
                        cnt -= 128
                        out[y, x:x + cnt, c] = data[pos]
                        pos += 1
                    else:
                        out[y, x:x + cnt, c] = np.frombuffer(data[pos:pos + cnt], np.uint8)
                        pos += cnt
                    x += cnt
        else:
            raise ValueError("flat hdr not supported")
    e = out[..., 3].astype(np.int32)
    f = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0)
    return out[..., :3].astype(np.float64) * f[..., None]


def write_hdr(path, rgb):
    h, w, _ = rgb.shape
    m = rgb.max(-1)
    mant, ex = np.frexp(m)
    scale = np.where(m > 1e-32, mant * 256.0 / np.maximum(m, 1e-32), 0)
    rgbe = np.zeros((h, w, 4), np.uint8)
    rgbe[..., :3] = np.clip(rgb * scale[..., None], 0, 255).astype(np.uint8)
    rgbe[..., 3] = np.where(m > 1e-32, ex + 128, 0).astype(np.uint8)
    with open(path, "wb") as fp:
        fp.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n")
        fp.write(f"-Y {h} +X {w}\n".encode())
        fp.write(rgbe.tobytes())


def hdr_small(src, dst, w=512):
    img = read_hdr(src)
    H, W, _ = img.shape
    k = W // w
    small = img[: H - H % k, : W - W % k].reshape(H // k, k, W // k, k, 3).mean((1, 3))
    write_hdr(dst, small)


if __name__ == "__main__" and os.environ.get("ONLY"):
    for name in os.environ["ONLY"].split(","):
        globals()[name]()
elif __name__ == "__main__":
    fetch_sources()
    clay()
    aerated()
    hw = weave()
    bag_label(hw)
    rust()
    marble()
    porcelain()
    travertine()
    wood()
    kraft()
    hdr_small(os.path.join(SRC, "studio.hdr"), os.path.join(OUT, "studio.hdr"))
    hdr_small(os.path.join(SRC, "warehouse.hdr"), os.path.join(OUT, "warehouse.hdr"))
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")
