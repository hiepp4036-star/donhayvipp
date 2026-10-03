# Free Fire Sensitivity Calculator OB54

> **Tính toán độ nhạy Free Fire chuẩn OB54 theo thiết bị thực tế** · Make By Benz

![Version](https://img.shields.io/badge/version-8.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## 🎯 Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **380+ thiết bị** | Catalog đầy đủ 21 hãng: Apple, Samsung, Xiaomi, OPPO, vivo, OnePlus, Pixel, Gaming Phone... |
| **Thuật toán V8.0** | Pipeline: Device → Tier Base → Hardware Compensation → Gaussian Variance → Playstyle → NLP → Cross-calibration |
| **NLP tiếng Việt** | Phân tích ngữ cảnh: "rung tâm", "lag", "kéo lố", "bắn xa", "cứng"... với fuzzy matching |
| **3 phong cách** | Rusher / Cân bằng / Sniper - điều chỉnh tự động theo lối chơi |
| **License Key System** | Key gắn chặt brand+model, HMAC-SHA256, expiry, max uses, device binding |
| **Admin Key Generator** | Tạo key hàng loạt, export CSV/JSON, bảo vệ bằng mật khẩu |
| **PWA Ready** | Offline-first, installable, Service Worker, manifest |
| **Theme System** | Dark / Light / Auto (OS) |
| **i18n** | Tiếng Việt / English |
| **Accessibility** | ARIA, keyboard nav, focus visible, reduced motion |

## 🚀 Demo & Deploy

**Live Demo**: [https://ff-ob54.vercel.app](https://ff-ob54.vercel.app)

**Admin Keygen**: [https://ff-ob54.vercel.app/admin](https://ff-ob54.vercel.app/admin)

### Deploy lên Vercel (Free Tier)

```bash
# 1. Fork repo này
# 2. Kết nối Vercel với GitHub repo
# 3. Thêm Environment Variables:
#    LICENSE_SECRET_KEY=your-secret-key
#    ADMIN_PASSWORD_HASH=your-bcrypt-hash
# 4. Deploy!
```

Vercel Free Tier đủ dùng:
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/tháng
- ✅ Serverless Functions (10s timeout)
- ✅ Custom domains
- ✅ Edge Network

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite 5 + TypeScript 5 |
| **Runtime** | Vanilla JS (no framework) |
| **Styling** | CSS Custom Properties, CSS Modules pattern |
| **Testing** | Vitest + jsdom |
| **PWA** | Service Worker (custom), Web Manifest |
| **Crypto** | Web Crypto API (HMAC-SHA256, SHA-256) |
| **Audio** | Web Audio API |
| **Deploy** | Vercel + GitHub Actions CI/CD |

## 📁 Cấu trúc dự án

```
freefire-sensitivity-ob54/
├── public/
│   ├── manifest.json          # PWA Manifest
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA Icons (72-512px)
├── src/
│   ├── assets/
│   │   ├── data/
│   │   │   └── device-catalog.json    # 380+ devices
│   │   └── styles/
│   │       ├── _variables.css
│   │       ├── _reset.css
│   │       ├── _components.css
│   │       ├── _buttons.css
│   │       ├── _gauges.css
│   │       ├── _animations.css
│   │       └── main.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.ts
│   │   │   ├── Toast.ts
│   │   │   └── Gauge.ts
│   │   ├── DeviceSelector.ts
│   │   ├── SensitivityForm.ts
│   │   ├── ResultPanel.ts
│   │   ├── LicenseGate.ts
│   │   ├── AdminKeygen.ts
│   │   ├── MatrixRain.ts
│   │   └── SoundEngine.ts
│   ├── core/
│   │   ├── algorithm.ts       # V8.0 calculation
│   │   ├── constants.ts       # Tier, Playstyle, NLP rules
│   │   ├── crypto.ts          # FNV1a, Xorshift128, HMAC
│   │   ├── storage.ts         # localStorage wrapper
│   │   ├── i18n.ts            # Vi/En translations
│   │   ├── types.ts           # TypeScript interfaces
│   │   └── index.ts
│   ├── api/
│   │   ├── validate-key.ts    # Vercel Function
│   │   └── generate-keys.ts   # Vercel Function (admin)
│   ├── main.ts                # App entry
│   └── vite-env.d.ts
├── tests/
│   ├── setup.ts
│   ├── algorithm.test.ts
│   ├── nlp.test.ts
│   └── crypto.test.ts
├── .github/workflows/
│   └── deploy.yml             # CI/CD
├── index.html                 # Main entry
├── admin.html                 # Admin entry
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── vercel.json
└── README.md
```

## 🔐 License Key System

### Key Format
```
BZ-OB54-{BRAND}-{MODEL}-{RANDOM8}-{EXPIRY_TS}-{MAX_USES}-{HMAC16}
```

**Ví dụ**: `BZ-OB54-SAMSUNG-S24U-A1B2C3D4-1735689600000-0-F3A2B1C4D5E6F7A8`

### Validation Flow
1. Client nhập key → gửi lên `/api/validate-key`
2. Server verify HMAC-SHA256 với secret key
3. Check brand/model match
4. Check expiry timestamp
5. Cache valid key 30 ngày trong localStorage
6. Tự động validate lần sau không cần internet

### Admin Keygen
- Truy cập `/admin` → nhập mật khẩu admin
- Chọn brand/model → set expiry/max uses → generate
- Export CSV/JSON cho team

## 🧮 Thuật toán V8.0 (Pipeline)

```
Device Selection (Brand + Model từ catalog)
       ↓
Tier Base Sensitivity (FN/FS/FO/UM/MD/BG/GM/TP/TL/LG)
       ↓
Hardware Compensation:
  • DPI adjustment (-6 → +6)
  • Refresh Rate (160Hz: -6, 144Hz: -4.5, 120Hz: -2, 90Hz: +2, 60Hz: +5)
  • Touch Latency ((tl-6) × 1.2)
  • Panel Type (LTPO: -2, OLED: 0, LCD: +3)
       ↓
Gaussian Variance (deterministic, seeded)
       ↓
Playstyle Modifiers:
  • Rusher: General -15, RedDot -8, Fire +8, Camera +12
  • Balanced: 0
  • Sniper: General +12, Sniper -12, Fire -4, Camera -8
       ↓
NLP Analysis (6 categories):
  • Recoil: giảm nhạy
  • Lag: tăng nhạy
  • Overshoot: giảm nhạy + giảm fire
  • Close: tăng fire/camera, giảm nhạy
  • Far: giảm 4X/5X sâu hơn, giảm fire
  • Stiff: tăng nhạy
       ↓
Cross-calibration (5 scopes logic)
       ↓
Final Clamping + Confidence Score (82-99%)
```

## 🧪 Development

```bash
# Clone & install
git clone https://github.com/yourusername/ff-sensitivity-ob54.git
cd ff-sensitivity-ob54
npm install

# Dev server (HMR)
npm run dev

# Type check
npm run lint

# Test
npm test
npm run test:ui

# Build production
npm run build

# Preview build
npm run preview
```

## 📱 PWA Features

- **Offline**: Tính toán độ nhạy hoàn toàn offline sau khi load lần đầu
- **Installable**: "Add to Home Screen" trên mobile
- **Auto-update**: Service worker check update khi reload
- **Fast**: Cache-first cho static assets, network-first cho API

## ♿ Accessibility

- Semantic HTML5
- ARIA labels & roles
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus visible states
- Reduced motion support (`prefers-reduced-motion`)
- High contrast support (`prefers-contrast`)
- Screen reader compatible

## 🌐 i18n

Hỗ trợ 2 ngôn ngữ:
- **Tiếng Việt** (mặc định)
- **English**

Chuyển đổi qua Settings hoặc auto-detect từ browser.

## 🎨 Theme System

| Theme | Mô tả |
|-------|-------|
| Dark | Mặc định, màu tối chuẩn gaming |
| Light | Màu sáng cho ban ngày |
| Auto | Theo system preference |

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LICENSE_SECRET_KEY` | Yes | HMAC secret cho license key (min 32 chars) |
| `ADMIN_PASSWORD_HASH` | Yes | SHA-256 hash của mật khẩu admin |
| `VERCEL_TOKEN` | CI/CD | Token deploy Vercel |
| `VERCEL_ORG_ID` | CI/CD | Organization ID |
| `VERCEL_PROJECT_ID` | CI/CD | Project ID |

### Tạo ADMIN_PASSWORD_HASH
```bash
# Node.js
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('your-password').digest('hex'))"
```

## 📝 Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:ui": "vitest --ui",
  "lint": "eslint src --ext ts",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
  "generate:catalog": "tsx scripts/generate-catalog.ts",
  "generate:icons": "tsx scripts/generate-pwa-icons.ts"
}
```

## 🤝 Contributing

1. Fork repo
2. Tạo branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Mở Pull Request

## 📄 License

MIT License - Xem [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Author

**Benz** - *Free Fire Sensitivity Calculator OB54*

- GitHub: [@benz](https://github.com/benz)
- Discord: benz#1234

## 🙏 Acknowledgments

- Free Fire community Việt Nam
- Các bạn tester đã góp ý
- Vercel cho free hosting tuyệt vời
- Be Vietnam Pro font by Cadson Demak

---

⭐ **Star repo nếu hữu ích!** ⭐