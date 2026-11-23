# Binokor — reklama sayti

Qurilish materiallari do'konlari uchun **Binokor POS tizimi**ning reklama (landing) sayti.
3D sahnalar, scroll bilan boshqariladigan animatsiyalar va bepul demo so'rov formasi.

## Bo'limlar

| Bo'lim | Nima ko'rsatadi |
|---|---|
| Hero | Do'konga tushgan tartibsiz mahsulotlar skanerlanadi, yorliq oladi va tartibli katalogga tiziladi |
| Katalog (gorizontal scroll) | 9 ta material va ularning real o'lchov hisobi: 1 paddon = 400 dona, 20 qop = 1 tonna, 1 m³ ≈ 27 gazoblok, 1 quti kafel = 1,44 m² va h.k. |
| Afzalliklar | Ombor sahnasi: savdo va chek, omborni to'ldirish, hisobot, filiallar, xavfsizlik |
| AI agent | Kassa ichidagi AI yordamchi: ombor, kassa, hisobot, narx, Telegram buyurtmalari |
| Ishga tushirish | 3 qadam |
| Aloqa | Demo so'rov formasi (Telegram orqali yuboriladi), telefon |

## Texnologiyalar

React 19 + TypeScript, Three.js / React Three Fiber / drei, GSAP ScrollTrigger, Framer Motion, Lenis, Tailwind CSS, Parcel.

Barcha 3D modellar koddan yasalgan (`src/three/models`), materiallar PBR teksturalar va studiya HDRI yorug'ligi bilan (`src/three/materials.ts`).

## Ishga tushirish

```bash
pnpm install
pnpm dev            # lokal server, brauzerda ochiladi
pnpm build          # dist/ papkaga build
pnpm build:single   # docs/index.html: bitta fayldagi tayyor sayt
```

## Joylashtirish (GitHub Pages)

`docs/index.html` — barcha kod va teksturalar ichiga joylangan tayyor sayt.
Repo → **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `docs`**.

## Tuzilishi

```
src/
  App.tsx                 Lenis + GSAP + yagona WebGL canvas (drei View)
  sections/               sahifa bo'limlari
  components/             navigatsiya, footer, preloader, marquee
  three/
    catalog.tsx           9 ta material: matnlar, o'lchov formulalari, sanagichlar
    models/               har bir materialning 3D modeli va o'lchov animatsiyasi
    scenes/               hero, katalog, ombor, AI, final sahnalari
    materials.ts          PBR materiallar, HDRI
  assets/tex/             teksturalar (tools/gen_textures.py bilan yaratilgan)
```

## Sozlash

- Telefon va Telegram: `src/sections/DemoForm.tsx` (`PHONE`, `TELEGRAM`)
- Material matnlari va raqamlar: `src/three/catalog.tsx`
- Teksturalarni qayta yaratish: `pnpm textures` (Python 3, numpy, Pillow kerak)
