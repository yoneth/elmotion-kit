# El MotionKit — Finishing & Hardening Spec (post-2.5.0)

Untuk: coding agent.
Konteks: rilis **2.5.0** sudah berhasil menulis ulang 3 ekstensi (Glassmorphism, Image FX, Text FX)
secara independen. Masalah hukum inti (kode turunan AAE **Pro** yang proprietary) **sudah selesai**.
Dokumen ini menutup sisa finishing: kejujuran dokumentasi, pembersihan jejak `wcf`, perbaikan
dead-code, dan 2 hardening keamanan.

---

## 0. Ground rules (WAJIB)

1. **JANGAN sentuh / regress** file yang sudah benar di 2.5.0:
   `inc/extensions/emk-glassmorphism.php`, `inc/extensions/emk-image-animation-effects.php`,
   `inc/extensions/emk-text-animation-effects.php`, `assets/js/emk-motion-fx.js`. (Kecuali Task 5
   yang menyentuh 3 baris di image-fx — lihat di bawah.)
2. **Disiplin clean-room tetap berlaku:** jangan membuka sumber AAE/AAE Pro untuk apa pun.
3. **Setiap file yang punya versi `.min`** (CSS/JS) harus diperbarui di **dua-duanya** — file sumber
   DAN file `.min` — atau di-rebuild lewat `build-installer.py`. Jangan tinggalkan `.min` basi.
4. Setelah selesai, naikkan versi ke **2.5.1** (header `el-motionkit.php`, `EMK_VERSION`,
   `readme.txt` Stable tag) dan tambahkan satu blok changelog `= 2.5.1 =` yang jujur.
5. Jangan menambah dependency baru.

---

## Task 1 — Hentikan klaim "clean-room rewrite" yang salah di changelog

### Why
"**Clean-room rewrite**" adalah istilah hukum spesifik: mengimplementasi ulang **tanpa** mengakses
kode sumber asli. Itu pertahanan terkuat melawan tuduhan turunan. Tapi `changelog.txt` masih memakai
istilah itu untuk pekerjaan yang sebenarnya **rename** (`wcf`→`emk`) atas kode AAE **Free**. Rename
= *derivative work* (legal di bawah GPL, tapi BUKAN clean-room). Menyebut rename sebagai "clean-room"
itu:
- **kontradiktif** ("clean-room ... prefixes renamed" mustahil sekaligus benar), dan
- jadi **bukti yang memberatkan** — kalimat itu paling gampang dikutip lawan untuk menunjukkan kamu
  memang menyalin lalu mengganti nama.

Catatan: header `el-motionkit.php` dan `readme.txt` baris ~17 **sudah akurat** (menyatakan bagian
dari Free tetap GPL, bagian dari Pro ditulis ulang/ dibuang). **Jangan ubah itu.** Masalahnya hanya
di baris-baris changelog legacy.

### Files
- `changelog.txt`

### Exact changes
Cari & ganti (verbatim) di `changelog.txt`:

| Baris (kira-kira) | ❌ Sekarang | ✅ Ganti jadi |
|---|---|---|
| ~47 | `* Major: Clean-room rewrite — all WCF/AAE prefixes renamed to EMK` | `* Major: Forked from Animation Addons for Elementor Free (GPL v2); residual WCF/AAE identifiers renamed to the EMK namespace.` |
| ~58 (`= 2.3.7 =`) | `* Clean-room rewrite for all advanced motion controls` | `* Reworked advanced motion controls under the EMK namespace.` |
| ~60 (`= 2.3.6 =`) | `* Initial clean-room release` | `* Initial release.` |

- Aturan umum: pakai frasa "**clean-room rewrite**" **hanya** untuk komponen yang benar-benar ditulis
  dari spec tanpa melihat sumber asli — yaitu **3 ekstensi 2.5.0** saja. Blok `= 2.5.0 =` boleh tetap
  memakai "Full clean-room rewrite of 3 extensions" karena **di sana itu benar**.
- Jangan menambah klaim baru yang tidak bisa kamu buktikan.

### Acceptance
- [ ] `grep -niE 'clean-room' changelog.txt` hanya muncul di blok `= 2.5.0 =`.
- [ ] Tidak ada lagi kalimat yang menggabungkan "clean-room" dengan "renamed/prefix".
- [ ] Header `el-motionkit.php` & `readme.txt` baris ~17 tidak berubah.

---

## Task 2 — Hapus AJAX handler `live_search` (dead + tidak aman)

### Why
`inc/ajax-handler.php` mendaftarkan `wp_ajax_nopriv_live_search` (publik) **tanpa nonce** dan dengan
nama action generik `live_search` (rawan tabrakan plugin lain). Selain itu **file ini dead code**:
- tidak ada pemanggil JS untuk action `live_search` di seluruh plugin, dan
- class `Ajax_Handler` tidak pernah di-`include`/di-referensikan dari file mana pun.

Karena tidak dipakai fitur apa pun (plugin ini tidak punya widget search), solusi paling aman &
bersih adalah **menghapusnya**, bukan menambal nonce ke kode mati.

### Steps
1. **Verifikasi** sekali lagi ia benar-benar tidak dimuat:
   `grep -rniE "ajax-handler|Ajax_Handler|live_search" . --include='*.php' --include='*.js'`
   → harus hanya menunjuk ke `inc/ajax-handler.php` sendiri.
2. Hapus file `inc/ajax-handler.php`.
3. Jika ada `include/require` ke file itu (seharusnya tidak ada), hapus baris include-nya.

### Acceptance
- [ ] File `inc/ajax-handler.php` tidak ada lagi.
- [ ] `grep -rniE 'live_search|Ajax_Handler' .` → 0 hasil.
- [ ] Plugin tetap aktif tanpa fatal error (cek `php -l` semua file + load test).

> Jika kamu yakin fitur live-search akan dipakai nanti: jangan hapus, tapi (a) rename action jadi
> `emk_live_search`, (b) tambah `check_ajax_referer('emk-frontend', 'nonce')` reuse nonce yang sudah
> ada, (c) update pemanggil JS-nya. Default rekomendasi tetap: **hapus**.

---

## Task 3 — Hapus SVG upload tanpa sanitasi

### Why
`inc/hook.php` punya `emk_allow_svg_uploads()` yang di-`add_filter('upload_mimes', …)` mengizinkan
upload `.svg`/`.svgz` **tanpa sanitasi apa pun**. SVG bisa memuat `<script>`, atribut `onload`, atau
`<foreignObject>` → **stored XSS** yang tereksekusi di konteks admin saat membuka Media Library.
Fitur ini **tidak dipakai** fitur mana pun di plugin (tidak ada custom-fonts/custom-icons di build
5-widget ini). Risiko > manfaat → buang.

### Steps
1. Di `inc/hook.php`, hapus fungsi `emk_allow_svg_uploads()` **dan** baris
   `add_filter('upload_mimes', 'emk_allow_svg_uploads');`.

### Acceptance
- [ ] `grep -rniE "upload_mimes|emk_allow_svg|image/svg" inc/` → 0 hasil.
- [ ] Media Library tidak lagi menerima `.svg` dari plugin ini.

> Kalau SVG memang dibutuhkan ke depan: aktifkan kembali HANYA dengan (a) sanitizer
> (mis. `enshrined/svg-sanitizer`) di hook `wp_handle_upload_prefilter`, dan (b) batasi ke
> `current_user_can('manage_options')`. Jangan izinkan SVG mentah untuk role rendah.

---

## Task 4 — Bersihkan sisa identifier `wcf` (fingerprint, bagian GPL-Free)

### Why
Sisa string `wcf` adalah **fingerprint** bahwa kode berasal dari AAE (mempermudah pihak lain
membuktikan asal-usul) dan terlihat tidak profesional untuk produk komersial. Ini di bagian
GPL-Free (risiko hukum rendah), tapi tetap harus bersih sebelum publish. Semua perubahan di bawah
**murni rename/penghapusan kosmetik** — tidak mengubah perilaku.

### 4a. Badge logo: class `wcf` → `emk-badge`
`get_icon()` di 4 widget mengembalikan string berakhiran ` wcf`; class `.wcf` itu dipakai sebagai
**selector badge logo** di `editor.css`/`editor.min.css`. Rename keduanya agar konsisten.

- **PHP** (ubah ` wcf` → ` emk-badge` pada return `get_icon()`):
  - `widgets/marquee.php:52` → `return 'eicon-carousel emk-badge';`
  - `widgets/animated-title.php:60` → `return 'eicon-t-letter emk-badge';`
  - `widgets/text-hover-image.php:58` → `return 'eicon-image-rollover emk-badge';`
  - `widgets/animated-text.php:59` → `return 'eicon-animation-text emk-badge';`
    dan perbarui komentar baris 58 → `// The emk-badge class triggers the EMK logo badge overlay in editor.min.css.`
- **CSS** (`assets/css/editor.css` baris ~3 & ~17, DAN `assets/css/editor.min.css`):
  ganti selektor `.elementor-panel .elementor-element .icon .wcf::after` dan
  `… .icon .wcf::after` (hover) → `.icon .emk-badge::after`.

### 4b. Dead CSS upsell `.wcfaddon-pro-notice`
Di `editor.css` (baris ~52–69) dan `editor.min.css` ada aturan `.wcfaddon-pro-notice*`. Tidak ada
PHP yang meng-output class itu (dead). **Hapus** semua aturan `.wcfaddon-pro-notice*` dari kedua file.

### 4c. Variabel JS `WcfSliderWidgets`
`assets/js/widgets/slider.js:92,106` (dan `slider.min.js`): rename variabel `WcfSliderWidgets` →
`emkSliderWidgets` (2 occurrence). Filter-nya sudah `emk/widgets/slider` — biarkan.
*(Opsional, lebih dalam: daftar widget di dalamnya — `testimonial`, `a-portfolio`, dst — adalah
nama widget AAE yang tidak ada di plugin ini. Boleh dipangkas jadi hanya widget nyata setelah
memastikan marquee tidak bergantung padanya. Kalau ragu, biarkan; cukup rename variabelnya.)*

### 4d. Komentar & screen-ID sisa
- `el-motionkit.php:247`: hapus/ubah komentar `//wcf plugin loaded` → `// EMK plugins loaded`.
- `inc/hook.php:78`: hapus entri screen-ID mati `'animation-addon_page_wcf-cpt-builder',` dari array
  `$pages_to_hide_notices` (tidak ada CPT builder di plugin ini).

### Acceptance (Task 4)
- [ ] `grep -rniE '\bwcf|wcfaddon|WcfSlider' . --include='*.php' --include='*.js' --include='*.css' | grep -vi 'assets/lib/'` → **0 hasil**.
- [ ] Badge logo masih tampil di panel Elementor (selector `.emk-badge::after` aktif di kedua CSS).
- [ ] `editor.css` dan `editor.min.css` konsisten (selector sama).
- [ ] Tidak ada perubahan perilaku widget.

---

## Task 5 — Buang target widget mati di Image FX

### Why
`inc/extensions/emk-image-animation-effects.php` mendaftarkan hook untuk widget `emk--image`,
`emk--image-box`, dan `emk--timeline`. **Tidak satupun ada** di plugin ini (widget nyata:
`emk--text`, `emk--title`, `emk--t-h-image`, marquee, plus Image core Elementor). Hook ke widget
yang tidak ada = dead config yang menyesatkan (seolah ada fitur yang sebenarnya tidak ada). Image FX
secara nyata hanya menempel di widget **Image core Elementor** (`'image'`).

### Steps
Di `bootstrap()`:
- Pada array `self::$targets`, **pertahankan** entri `[ 'name' => 'image', 'section' => 'section_image' ]`.
  Hapus `[ 'name' => 'emk--image', 'section' => 'section_content' ]` **kecuali** widget `emk--image`
  benar-benar terdaftar (verifikasi via `get_name()` di folder `widgets/`).
- Pada array `self::$reveal_only`, hapus `emk--image-box` dan `emk--timeline` (tidak ada widgetnya).
  Jika setelah penghapusan `self::$reveal_only` jadi kosong, hapus juga loop `foreach` reveal-only
  dan method `register_reveal_controls()` agar tidak ada dead method.

> Verifikasi nama widget dulu: `grep -rnE "function get_name" widgets/ -A2`. Hanya target yang
> namanya cocok dengan widget terdaftar (atau widget core Elementor) yang boleh tinggal.

### Acceptance
- [ ] Tiap entri di `$targets`/`$reveal_only` merujuk widget yang benar-benar ada (cek `get_name()`).
- [ ] Tidak ada method yang tak terpakai tersisa.
- [ ] `php -l inc/extensions/emk-image-animation-effects.php` bersih.
- [ ] Image FX masih muncul & berfungsi pada widget Image core Elementor.

---

## Verifikasi akhir (jalankan semua sebelum dianggap selesai)

```bash
# 1. Tidak ada fingerprint AAE/WCF tersisa di kode (kecuali GSAP libs & atribusi lisensi yang memang sengaja)
grep -rniE '\bwcf|wcfaddon|WcfSlider|wealcoder|amelia|live_search|Ajax_Handler' . \
  --include='*.php' --include='*.js' --include='*.css' | grep -vi 'assets/lib/' \
  | grep -viE 'GPL|original|fork|derived|copyright|proprietary|commercial'
# → harus KOSONG

# 2. "clean-room" hanya di blok 2.5.0
grep -niE 'clean-room' changelog.txt

# 3. SVG upload & dead ajax sudah hilang
grep -rniE 'upload_mimes|emk_allow_svg|image/svg' inc/
ls inc/ajax-handler.php 2>/dev/null   # → No such file

# 4. PHP lint semua file
find . -name '*.php' -not -path './vendor/*' -exec php -l {} \; | grep -v 'No syntax errors'
# → tidak ada output (artinya semua bersih)

# 5. File .min sinkron dengan sumber (tidak ada wcf di min)
grep -rniE '\bwcf' assets/css/*.min.css assets/js/**/*.min.js | grep -vi 'assets/lib/'
# → KOSONG
```

### Definition of Done global
- [ ] Task 1–5 selesai + semua acceptance per-task tercentang.
- [ ] 5 perintah verifikasi akhir di atas semuanya bersih.
- [ ] Versi dinaikkan ke 2.5.1 (header + `EMK_VERSION` + readme Stable tag) dengan blok changelog
      `= 2.5.1 =` yang jujur (mis. "Removed dead/insecure AJAX search endpoint; removed unsanitized
      SVG upload; purged residual WCF identifiers; trimmed dead Image FX targets; corrected changelog
      wording.").
- [ ] Plugin aktif tanpa error, badge logo tampil, ketiga ekstensi 2.5.0 tetap berfungsi (tidak
      ter-regress).
- [ ] File `.min` di-rebuild/diselaraskan; zip rilis baru dibuat lewat `build-installer.py`.

---

## Catatan yang SENGAJA tidak dimasukkan ke scope ini

- Widget GPL-Free (mis. `widgets/text-hover-image.php` yang ~99% identik dengan AAE Free) **tidak**
  diminta diubah di sini. Itu legal di bawah GPL. Tapi sadari: itu bagian yang masih akan menimbulkan
  gesekan dengan author AAE. Kalau nanti mau mengurangi risiko bisnis, modifikasi widget-widget itu
  lebih substansial (bukan rebrand 1:1) — itu pekerjaan terpisah, bukan bagian finishing ini.
