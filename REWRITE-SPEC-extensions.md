# El MotionKit — Clean-Room Rewrite Spec: 3 Extensions

**Target files yang harus ditulis ulang dari nol:**

- `inc/extensions/emk-glassmorphism.php`
- `inc/extensions/emk-image-animation-effects.php`
- `inc/extensions/emk-text-animation-effects.php`

Dokumen ini adalah **satu-satunya sumber** untuk implementasi. Tujuannya menghasilkan kode yang
ditulis sendiri (independent creation), bukan turunan dari kode AAE / AAE Pro mana pun.

---

## 0. Aturan Clean-Room (WAJIB — non-negotiable)

Untuk agent yang mengerjakan:

1. **JANGAN** membuka, membaca, mengintip, atau mencari file sumber apa pun dari
   `animation-addons-for-elementor`, `animation-addons-for-elementor-pro`, atau plugin "AAE"/"WCF" lainnya.
   Implementasi **hanya** boleh bersumber dari:
   - dokumen ini,
   - dokumentasi resmi Elementor Developers (`developers.elementor.com`),
   - dokumentasi resmi GSAP (`gsap.com/docs`).
2. **Tidak boleh** ada string `wcf`, `aae`, `animation-addons`, `wealcoder`, `amelia` di mana pun
   (kode, komentar, nama variabel, CSS class, nama event JS, key kontrol). Termasuk **tidak ada**
   pembacaan backward-compat seperti `get('wcf_text_animation')`.
3. **Pilih sendiri** semua identifier (key kontrol, class CSS, nama event JS, nilai enum opsi).
   Jangan menyalin "selection & arrangement" dari sumber lama. Lihat §2 untuk konvensi.
4. Setiap file ekstensi hanya berisi **method yang relevan dengan satu fitur file itu**. Tidak ada
   method nyangkut (mis. parallax/scroll-smoother di dalam file glassmorphism).
5. Setiap kelas berdiri sendiri. Tidak ada logika lisensi/upsell/"pro-lock".

> Definisi sukses legal: kalau dua programmer berbeda diberi spec ini, hasilnya boleh beda-beda di
> detail tapi sama-sama benar. Itu tanda kode lahir dari spec, bukan dari sumber lama.

---

## 1. Arsitektur Bersama (ketiga ekstensi)

### 1.1 Pola PHP ekstensi Elementor

Setiap ekstensi adalah satu kelas statik di namespace `EMK\Extensions`, dengan `init()` yang:

- **Inject control section** ke elemen target lewat hook `after_section_end` di tab **Advanced**:
  - Container: `elementor/element/container/section_layout/after_section_end`
  - Common (semua widget): `elementor/element/common/_section_style/after_section_end`
  - Widget spesifik (mis. heading): `elementor/element/heading/section_title/after_section_end`
- **Ekspos setting ke frontend** dengan salah satu dari:
  - `'frontend_available' => true` pada kontrol (dibaca handler via `this.getElementSettings()`), dan/atau
  - menambah render attribute `data-emk-...` di hook `elementor/frontend/before_render`.
- Pakai prefix section ID dan key yang konsisten (lihat §2).

Kerangka minimal:

```php
<?php
namespace EMK\Extensions;

use Elementor\Controls_Manager;

defined( 'ABSPATH' ) || die();

class EMK_Glassmorphism {
    public static function init() {
        add_action( 'elementor/element/container/section_layout/after_section_end',
            [ __CLASS__, 'register_controls' ], 10, 2 );
        add_action( 'elementor/element/common/_section_style/after_section_end',
            [ __CLASS__, 'register_controls' ], 10, 2 );
    }

    public static function register_controls( $element, $args = null ) {
        $element->start_controls_section( /* ... */ );
        // add_control(...) sesuai §3
        $element->end_controls_section();
    }
}
EMK_Glassmorphism::init();
```

### 1.2 Pola frontend handler (untuk yang butuh JS: image & text animation)

Gunakan handler resmi Elementor, bukan binding manual ke `elementor/frontend/init` saja
(itu rawan race condition). Pola yang dipakai:

```js
// emk-motion-fx.js  (file BARU; jangan dempet ke emk-motion.js milik clean-motion-controls)
( function () {
  'use strict';
  var hasGsap = function () { return window.gsap && typeof window.gsap.timeline === 'function'; };

  function ImageFxHandler( $scope ) { /* baca settings, jalankan GSAP, simpan utk cleanup */ }
  function TextFxHandler( $scope )  { /* split + GSAP + ScrollTrigger */ }

  window.addEventListener( 'elementor/frontend/init', function () {
    if ( ! hasGsap() ) return;
    var add = function ( name, fn ) {
      elementorFrontend.hooks.addAction(
        'frontend/element_ready/global', // 'global' = semua elemen; atau spesifik per widget
        function ( $scope ) { fn( $scope ); }
      );
    };
    add( 'emk-image-fx', ImageFxHandler );
    add( 'emk-text-fx',  TextFxHandler );
  } );
} )();
```

Catatan teknis penting (semua dari dokumentasi publik, bukan kode AAE):

- **Idempotency:** beri penanda mis. `$scope.data('emkFxBound')` lalu `return` kalau sudah, supaya
  hook yang re-fire tidak menumpuk animasi ganda.
- **Cleanup:** simpan instance `gsap.timeline`, `ScrollTrigger`, dan `SplitText` di elemen. Saat
  re-render (editor) panggil `.kill()` / `SplitText.revert()` untuk cegah memory leak.
- **Graceful degradation:** kalau `gsap`/`ScrollTrigger`/`SplitText` tidak ada, jangan crash —
  biarkan konten tampil normal (no-op).
- **Register plugin GSAP:** `gsap.registerPlugin(ScrollTrigger, SplitText)` sekali di awal handler.

### 1.3 Enqueue

Daftarkan GSAP core + ScrollTrigger + SplitText sebagai dependency dari `emk-motion-fx`. Reuse
mekanisme enqueue yang sudah ada di `class-plugin.php`. Gunakan `filemtime()` untuk cache-bust
(konsisten dengan konvensi project).

---

## 2. Konvensi Penamaan (pilih milikmu sendiri, JANGAN cermin sumber lama)

Gunakan prefix `emk_` tapi **rancang nama baru**. Hindari nama yang identik-setelah-rename dengan
key lama. Contoh tabel (boleh kamu ganti lagi, yang penting konsisten & orisinal):

| Konsep | ❌ Jangan (cerminan lama) | ✅ Pakai (contoh baru) |
|---|---|---|
| Toggle text anim | `emk_text_animation` | `emk_txt_fx_enable` + `emk_txt_fx_type` |
| Toggle image anim | `emk_image_animation` | `emk_img_fx_enable` + `emk_img_fx_type` |
| Event preview editor | `emk:editor:play_animation` | `emk/fx/preview` (custom event) |
| Translate X/Y | `text_translate_x` / `_y` | `emk_txt_fx_x` / `emk_txt_fx_y` |
| Opsi efek image | `reveal` / `scale` / `stretch` | `wipe` / `zoom` / `elastic` |
| Opsi efek text | `text_move` / `text_reveal` | `tilt3d` / `mask-up` / `pop` |
| CSS class wrapper | (class `wcf` apa pun) | `emk-fx` / `emk-fx--text` |

Aturan: nilai enum, nama event, dan key adalah pilihan desain — buat yang **berbeda** dari produk lama.

---

## 3. Ekstensi 1 — Glassmorphism (paling mudah; 100% CSS, tanpa JS)

**Konsep:** efek "frosted glass" pada container/widget. Murni CSS via `selectors` Elementor.
Tidak perlu GSAP, tidak perlu handler JS, tidak perlu ScrollTrigger.

### Target
- Container (`elementor/element/container/...`)
- Common widgets (`elementor/element/common/...`)

### Section
- Tab: `Controls_Manager::TAB_ADVANCED`
- Section ID: `emk_section_glass` (label mis. "EMK Glassmorphism").

### Kontrol
| Key | Tipe | Fungsi → CSS |
|---|---|---|
| `emk_glass_enable` | SWITCHER (`yes`) | gate semua kontrol lain via `condition` |
| `emk_glass_blur` | SLIDER px (0–30, default 10) | `backdrop-filter: blur(); -webkit-backdrop-filter: blur();` |
| `emk_glass_saturate` | SLIDER % (100–200, default 120) | gabung ke `backdrop-filter: ... saturate(%)` |
| `emk_glass_tint` | COLOR (rgba, default `rgba(255,255,255,0.15)`) | `background-color` |
| `emk_glass_border` | COLOR (opsional) | `border: 1px solid <color>` (atau group border control) |
| `emk_glass_radius` | SLIDER px (opsional) | `border-radius` |

### Catatan implementasi
- `backdrop-filter` dan `-webkit-backdrop-filter` **harus** keduanya di-output (Safari).
- Gabungkan blur + saturate dalam **satu** properti `backdrop-filter` agar tidak saling menimpa.
  Cara aman: pakai CSS variable, mis. selector menulis `--emk-glass-blur` & `--emk-glass-sat`, lalu
  satu aturan `backdrop-filter: blur(var(--emk-glass-blur,0)) saturate(var(--emk-glass-sat,1))`.
- Beri RAW_HTML note kecil bahwa efek butuh elemen yang punya latar di belakangnya.
- **Buang total** semua konsep parallax, scroll-smoother, `data-speed`, `data-lag`,
  `remove_transition_from_container`, `*_attributes` — itu BUKAN bagian glassmorphism.

### Definition of done
- File hanya berisi `init()` + `register_controls()`.
- Nol baris JavaScript. Nol referensi GSAP.

---

## 4. Ekstensi 2 — Image Animation Effects (GSAP + ScrollTrigger)

**Konsep:** animasikan gambar saat masuk viewport. 3 efek inti. Sekali jalan (default) atau scrub.

### Target
- Widget Image (`elementor/element/image/section_image/after_section_end`)
- (opsional) Common, agar bisa dipasang pada widget lain yang berisi `<img>`.

### Efek (rancang nama enum sendiri — contoh)
1. **`wipe` (reveal):** gambar tampil lewat `clip-path: inset()` beranimasi dari tertutup → terbuka.
   - Arah opsional: dari kiri/kanan/atas/bawah → atur sisi `inset()` yang dianimasikan.
   - From: `clip-path: inset(0 100% 0 0)` (contoh kiri→kanan) → To: `inset(0 0 0 0)`.
2. **`zoom` (scale settle):** wrapper `overflow:hidden`; `<img>` dari `scale(1.25)` + `opacity:0` →
   `scale(1)` + `opacity:1`. Easing halus (mis. `power2.out`).
3. **`elastic` (stretch):** mulai `scaleY(0.6) scaleX(1.1)` (atau skew ringan) → `scale(1)`, kesan
   memantul. Boleh pakai ease `elastic.out` / `back.out`.

### Kontrol
| Key | Tipe | Default | Catatan |
|---|---|---|---|
| `emk_img_fx_enable` | SWITCHER `yes` | — | gate; `frontend_available => true` |
| `emk_img_fx_type` | SELECT (`none/wipe/zoom/elastic`) | `none` | `frontend_available => true` |
| `emk_img_fx_dir` | SELECT (kiri/kanan/atas/bawah) | kiri | hanya `condition` saat `wipe` |
| `emk_img_fx_duration` | NUMBER (detik, step 0.1) | 1.0 | |
| `emk_img_fx_delay` | NUMBER | 0 | |
| `emk_img_fx_ease` | SELECT (power1–4 / back / elastic / none) | `power2.out` | |
| `emk_img_fx_start` | TEXT/SELECT posisi ScrollTrigger | `top 85%` | beri preset ramah + opsi custom |
| `emk_img_fx_scrub` | SWITCHER | `no` | kalau `yes`, animasi mengikuti scroll (bukan sekali jalan) |

### Logic frontend (pseudocode, dari API publik)
```js
function ImageFxHandler( $scope ) {
  if ( $scope.data('emkImgFx') ) return;
  var s = settingsOf($scope);                 // getElementSettings / data-settings fallback
  if ( s.emk_img_fx_enable !== 'yes' || s.emk_img_fx_type === 'none' ) return;
  var img = $scope.find('img').get(0); if (!img) return;
  $scope.data('emkImgFx', true);

  var fromVars = buildFrom(s.emk_img_fx_type, s.emk_img_fx_dir); // object {clipPath|scale|opacity...}
  var toVars   = buildTo(s.emk_img_fx_type);
  toVars.duration = s.emk_img_fx_duration || 1;
  toVars.delay    = s.emk_img_fx_delay || 0;
  toVars.ease     = s.emk_img_fx_ease || 'power2.out';
  toVars.scrollTrigger = {
    trigger: $scope.get(0),
    start: s.emk_img_fx_start || 'top 85%',
    once: s.emk_img_fx_scrub !== 'yes',
    scrub: s.emk_img_fx_scrub === 'yes' ? true : false
  };
  gsap.fromTo(img, fromVars, toVars);
}
```
- Untuk `wipe`, set `overflow:hidden` di wrapper bila perlu agar clip rapi.
- Simpan tween utk cleanup; `kill()` saat re-render editor.

### Editor preview
Lihat §6.

---

## 5. Ekstensi 3 — Text Animation Effects (GSAP SplitText + ScrollTrigger)

**Konsep:** pecah teks per char/word/line lalu animasikan dengan stagger saat masuk viewport.
Ini fitur paling kompleks; rancang bersih.

### Target
- Heading (`elementor/element/heading/section_title/after_section_end`)
- Text Editor (`elementor/element/text-editor/section_editor/after_section_end`)
- Widget bawaan plugin (animated-text / animated-title) — bila ingin kontrol seragam.

### Efek (nama enum bebas — contoh)
1. **`fade-up`:** tiap unit dari `y: 40, opacity: 0` → `y:0, opacity:1`, stagger.
2. **`tilt3d`:** per **line**, set `perspective` di parent; tiap line `rotationX: -90` →`0`
   (transform-origin atas), kesan papan berputar. Aktifkan `force3D: true`.
3. **`mask-up`:** per **line** dibungkus mask `overflow:hidden`; line dari `yPercent: 110` → `0`.
4. **`pop`:** per **char** dari `scale: 0` → `1` dengan ease `back.out(1.7)`, stagger kecil.

### Kontrol
| Key | Tipe | Default | Catatan |
|---|---|---|---|
| `emk_txt_fx_enable` | SWITCHER `yes` | — | gate; `frontend_available => true` |
| `emk_txt_fx_type` | SELECT (`none/fade-up/tilt3d/mask-up/pop`) | `none` | `frontend_available => true` |
| `emk_txt_fx_split` | SELECT (`chars/words/lines`) | tergantung type | sebagian efek paksa `lines` |
| `emk_txt_fx_duration` | NUMBER | 0.8 | |
| `emk_txt_fx_delay` | NUMBER | 0 | |
| `emk_txt_fx_stagger` | NUMBER (step 0.01) | 0.05 | jeda antar unit |
| `emk_txt_fx_x` / `emk_txt_fx_y` | NUMBER | 0 / 40 | offset awal |
| `emk_txt_fx_rotate` | NUMBER + axis (X/Y/Z) | — | utk efek 3D |
| `emk_txt_fx_origin` | TEXT (transform-origin) | `50% 50%` | |
| `emk_txt_fx_ease` | SELECT | `power3.out` | |
| `emk_txt_fx_trigger` | SELECT (`on-load` / `on-scroll`) | `on-scroll` | |
| `emk_txt_fx_start` | TEXT/SELECT | `top 85%` | ScrollTrigger start |
| `emk_txt_fx_scrub` | SWITCHER | `no` | |

### Logic frontend (pseudocode)
```js
function TextFxHandler( $scope ) {
  var s = settingsOf($scope);
  if ( s.emk_txt_fx_enable !== 'yes' || s.emk_txt_fx_type === 'none' ) return;
  var target = $scope.find('.emk-fx--text, .elementor-heading-title, p').get(0);
  if (!target) return;

  // cleanup lama bila ada (penting di editor)
  if ($scope.data('emkSplit')) { $scope.data('emkSplit').revert(); }

  var split = new SplitText(target, { type: s.emk_txt_fx_split || 'lines, words, chars',
                                      linesClass: 'emk-fx-line' });
  $scope.data('emkSplit', split);
  var units = pickUnits(split, s.emk_txt_fx_split); // split.chars / .words / .lines

  if (s.emk_txt_fx_type === 'mask-up') wrapLinesWithMask(split.lines); // overflow:hidden per line
  if (s.emk_txt_fx_type === 'tilt3d')  target.style.perspective = '800px';

  var tl = gsap.timeline({
    scrollTrigger: s.emk_txt_fx_trigger === 'on-scroll' ? {
      trigger: $scope.get(0), start: s.emk_txt_fx_start || 'top 85%',
      once: s.emk_txt_fx_scrub !== 'yes', scrub: s.emk_txt_fx_scrub === 'yes'
    } : undefined
  });
  tl.from( units, buildFromVars(s) /* y,x,rotation,scale,opacity,transformOrigin,force3D */
         , { duration: s.emk_txt_fx_duration, ease: s.emk_txt_fx_ease,
             stagger: s.emk_txt_fx_stagger, delay: s.emk_txt_fx_delay } );
  $scope.data('emkTl', tl);
}
```

### Catatan teknis (semua dari isu publik GSAP/Elementor)
- **SplitText 3.13** menolak memecah node yang sudah "disentuh" Elementor editor (punya marker
  internal), mengembalikan 0 unit. Solusi umum: untuk **preview editor**, kloning konten ke `<div>`
  bersih lalu split kloning itu (lihat §6). Ini teknik publik, bukan dari sumber lama.
- Selalu `split.revert()` saat re-render / sebelum split ulang → cegah penumpukan & leak.
- `mask-up` perlu tiap line dibungkus elemen `overflow:hidden`.
- Hormati `prefers-reduced-motion`: bila aktif, tampilkan teks final tanpa animasi.

---

## 6. Editor Preview (image & text)

Tujuan: tombol/preview di editor menjalankan animasi yang **identik** dengan frontend, memakai
**runner yang sama**.

- Ekspos satu fungsi shared, mis. `window.EMKFx.run(target, settings, type)` yang dipakai baik
  frontend handler maupun editor.
- Editor mendengar event custom milikmu sendiri (mis. `emk/fx/preview`) atau klik tombol kontrol
  `Button` Elementor, lalu memanggil runner dengan `immediate: true` (jalan sekali, tanpa ScrollTrigger).
- Untuk text: pakai `editorClone: true` → runner membuat `<div>` baru dengan konten sama untuk
  di-split (workaround SplitText editor di atas).
- Jangan pakai nama event/`data-event` yang mencerminkan produk lama (lihat §2).

---

## 7. Keamanan & kualitas (berlaku semua file)

- Semua output PHP di-escape (`esc_html__`, `esc_attr`, `wp_kses_post` untuk RAW_HTML).
- Tidak ada output `$_GET/$_POST` mentah; ekstensi ini tidak butuh AJAX/nonce (murni render-side).
- JS: bungkus dalam IIFE, `'use strict'`, no global bocor selain namespace `EMKFx` yang disengaja.
- Tidak menambah dependency baru selain GSAP yang sudah dibundel.

---

## 8. Checklist "Definition of Done" (acceptance)

Jalankan sebelum dianggap selesai:

- [ ] `grep -rniE 'wcf|aae|animation-addons|wealcoder|amelia' inc/ assets/` → **0 hasil**.
- [ ] Tidak ada pembacaan key lama (`*wcf_*`) sebagai fallback di JS.
- [ ] `emk-glassmorphism.php`: nol JS, nol GSAP, hanya kontrol glassmorphism; tidak ada method
      parallax/scroll-smoother/attributes nyangkut.
- [ ] Key kontrol, nilai enum, CSS class, dan nama event JS **dipilih baru** (tidak sekadar
      prefix-swap dari istilah lama).
- [ ] Animasi degrade mulus tanpa GSAP/ScrollTrigger/SplitText (no error di console).
- [ ] SplitText selalu `.revert()` pada cleanup; tidak ada animasi/ScrollTrigger menumpuk saat
      hook re-fire (cek dengan penanda idempotency).
- [ ] `prefers-reduced-motion` dihormati pada text & image FX.
- [ ] Editor preview memakai runner yang sama dengan frontend.
- [ ] Semua output PHP ter-escape.

---

## 9. Ringkas alur kerja untuk agent

1. Baca dokumen ini sepenuhnya. **Jangan** sentuh sumber AAE/Pro.
2. Tetapkan dulu tabel penamaanmu sendiri (§2) — tulis di komentar atas tiap file.
3. Implement `emk-glassmorphism.php` (termudah, pure CSS) → verifikasi DoD.
4. Buat `assets/js/emk-motion-fx.js` (handler bersama image+text) + enqueue.
5. Implement `emk-image-animation-effects.php` + cabang efek di JS → verifikasi.
6. Implement `emk-text-animation-effects.php` + SplitText path + editor preview → verifikasi.
7. Jalankan checklist §8.
