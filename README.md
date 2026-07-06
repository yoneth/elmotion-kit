# El Motion Kit

**Elementor motion widgets dan GSAP-powered frontend effects untuk WordPress.**

El Motion Kit menyediakan widget animasi, slider, text effects, dan motion-ready components yang ringan dan cepat — semua didukung oleh GSAP + ScrollTrigger.

## Fitur

### Widgets
- **Animated Title** — judul animasi dengan prefix dan inline highlight
- **Animated Text** — heading dan text-editor dengan efek animasi
- **Marquee** — infinite scroll teks (GSAP linier, tanpa Swiper)
- **Text Hover Image** — gambar reveal mengikuti kursor

### Extensions
- **Text Animation** — character, word, text_move, text_reveal, text_scale, text_invert, 3D spin
- **Image Animation** — reveal, scale, stretch
- **Glassmorphism** — efek glass pada container Elementor
- **Custom CSS** — CSS custom per elemen
- **Motion Controls** — mouse move, cursor hover, horizontal scroll, parallax, pin element

### Runtime
- GSAP + ScrollTrigger + ScrollSmoother
- Zero dependency selain Elementor dan GSAP bawaan

## Persyaratan

| Requirement | Minimal |
|---|---|
| WordPress | 6.0 |
| Elementor (Free) | 4.0 |
| PHP | 7.4 |
| PHP extensions | `json`, `mbstring` |

## Instalasi

1. Upload folder `el-motionkit-main` ke `/wp-content/plugins/` (atau install ZIP melalui WordPress admin)
2. Aktifkan **El Motion Kit** dari menu Plugins
3. Buka Elementor editor — widget El Motion Kit akan muncul di kategori "El Motion Kit"

## Struktur Direktori

```
el-motionkit-main/
├── assets/
│   ├── css/          # Stylesheet plugin
│   ├── js/           # JavaScript (widgets, extensions)
│   ├── vendor/       # Pustaka pihak ketiga (GSAP, shaders)
│   └── images/       # Asset gambar
├── inc/
│   ├── extensions/   # Extension handler
│   ├── hook.php      # Action/filter hooks
│   ├── helper.php    # Fungsi bantu
│   └── trait-emk-slider.php
├── widgets/          # Widget Elementor
│   ├── animated-title.php
│   ├── animated-text.php
│   ├── text-hover-image.php
│   └── marquee.php
├── class-plugin.php  # Bootstrap plugin
├── config.php        # Konfigurasi
├── el-motionkit.php  # Plugin entry
├── languages/        # File terjemahan (.pot)
├── changelog.txt     # Riwayat perubahan
└── readme.txt        # Metadata WordPress.org
```

## Atribusi

Plugin ini merupakan turunan (fork) dari **Animation Addons for Elementor** oleh Wealcoder / Amelia Rose, yang dirilis di bawah lisensi **GPL v2**. Seluruh kode yang berasal dari versi komersial (Animation Addons Pro) telah dihapus atau ditulis ulang dari awal menggunakan Elementor 4 API publik dan dokumentasi GSAP 3. Tidak ada kode proprietary dari produk komersial yang didistribusikan dalam paket ini.

```
Original copyright (c) 2024, Wealcoder / Amelia Rose.
Modifications (c) 2025, deTheme.
```

## Lisensi

**GPL v2 or later** — lihat file `LICENSE` atau https://www.gnu.org/licenses/gpl-2.0.html
