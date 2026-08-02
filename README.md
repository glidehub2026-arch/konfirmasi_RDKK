# Aplikasi Konfirmasi eRDKK (Frontend + Google Apps Script)

Aplikasi ini merupakan sistem pendataan dan konfirmasi Elektronik Rencana Definitif Kebutuhan Kelompok (eRDKK) Pupuk Bersubsidi yang dibangun menggunakan **Vite + Alpine.js** di sisi _Frontend_ dan **Google Apps Script (Spreadsheet)** sebagai _Backend_ / Basis Data.

Berikut adalah panduan lengkap cara melakukan instalasi, mengonfigurasi basis data, hingga melakukan _deployment_ ke Cloudflare Pages.

---

## Bagian 1: Instalasi Backend (Google Apps Script)

Aplikasi ini menggunakan Google Spreadsheet murni sebagai Basis Datanya. Ikuti langkah berikut untuk menyiapkannya:

1. **Buat Google Spreadsheet Baru**
   - Buka Google Drive Anda dan buat satu Google Spreadsheet kosong.
   - Beri nama (misal: "Database eRDKK Koperasi").

2. **Buka Editor Apps Script**
   - Pada menu Spreadsheet, klik **Ekstensi** > **Apps Script**.
   - Hapus semua kode bawaan yang ada di editor tersebut.

3. **Salin Kode Backend**
   - Buka berkas `backend/Code.gs` yang ada pada repositori ini.
   - Salin (Copy) seluruh isinya dan Tempel (Paste) ke editor Apps Script Anda.
   - Simpan proyek (klik ikon Disket atau tekan `Ctrl + S`).

4. **Inisialisasi Database (Wajib dilakukan pertama kali)**
   - Di bagian atas editor Apps Script, cari menu _dropdown_ fungsi (sebelah tombol "Jalankan" / "Run") dan pilih fungsi `setupSpreadsheet`.
   - Klik tombol **Jalankan (Run)**.
   - Google akan meminta otorisasi (Izin Akses). Klik _Review Permissions_, pilih akun Google Anda, klik _Advanced_, dan lanjutkan (Go to project).
   - Setelah selesai, kembali ke Spreadsheet Anda. Anda akan melihat banyak _sheet_ (tab) baru yang sudah dibuat otomatis berserta data contoh (Admin, Pupuk, dll).

5. **Deploy sebagai Web App**
   - Di pojok kanan atas Apps Script, klik tombol **Terapkan (Deploy)** > **Deployment baru (New deployment)**.
   - Klik ikon gerigi (⚙️) di sebelah "Pilih jenis", lalu centang **Aplikasi Web (Web App)**.
   - Isi deskripsi (bebas).
   - Pastikan **Jalankan sebagai (Execute as)** diatur ke: **Berdasarkan saya (Me)**.
   - Pastikan **Siapa yang memiliki akses (Who has access)** diatur ke: **Semua orang (Anyone)**.
   - Klik **Terapkan (Deploy)**.
   - **SALIN URL Web App** (diakhiri dengan `/exec`) yang muncul di layar Anda.

---

## Bagian 2: Konfigurasi Frontend

Setelah memiliki URL Web App dari langkah sebelumnya, saatnya menghubungkannya dengan antarmuka web.

1. Buka folder `frontend/src/` di teks editor aplikasi Anda.
2. Edit file **`main.js`**:
   ```javascript
   const GAS_URL = 'PASTE_URL_APPS_SCRIPT_ANDA_DI_SINI';
   const USE_MOCK = false; // Pastikan nilainya false
   const WA_ADMIN = '6281234567890'; // Ganti dengan nomor WhatsApp Admin
   ```
3. Edit file **`admin.js`**:
   ```javascript
   const GAS_URL = 'PASTE_URL_APPS_SCRIPT_ANDA_DI_SINI';
   const USE_MOCK = false; // Pastikan nilainya false
   ```
4. **Opsional:** Untuk mengaktifkan fitur Bot CS (Asisten Admin PUD), buka `main.js` dan cari atribut `apiKey` di dalam state `chatBot`, lalu masukkan API Key Gemini Google Anda di sana.
5. (Lokal Tes): Anda dapat mengujinya di komputer lokal dengan menjalankan `npm run dev` (atau menjalankan command Vite `build`) pada terminal di dalam folder `frontend`.

---

## Bagian 3: Deployment ke Cloudflare Pages

Langkah terakhir adalah mempublikasikan (hosting) _Frontend_ aplikasi ke publik secara gratis menggunakan **Cloudflare Pages**.

### A. Siapkan Repositori GitHub (Cara Upload ke GitHub)
1. **Buat Repositori di GitHub**
   - Buka github.com dan login.
   - Klik tombol **New** untuk membuat repositori baru. Beri nama (misal `koperasi-erdkk`), biarkan kosong tanpa menambahkan file *README/gitignore* awal, lalu klik **Create repository**.
2. **Jalankan Git di Komputer Anda**
   - Buka Terminal / Command Prompt (CMD) di dalam folder proyek Anda (folder `konfirmasi_rdkk`).
   - Jalankan perintah berikut secara berurutan:
     ```bash
     git init
     git add .
     git commit -m "Initial commit aplikasi konfirmasi eRDKK"
     git branch -M main
     git remote add origin https://github.com/USERNAME_ANDA/koperasi-erdkk.git
     git push -u origin main
     ```
   - *(Pastikan Anda mengganti `USERNAME_ANDA` dengan username GitHub Anda, atau Anda bisa langsung menyalin perintah yang diberikan oleh GitHub di layar Anda setelah menekan Create Repository)*.
3. Refresh halaman GitHub Anda, dan seluruh file aplikasi kini sudah berhasil terunggah ke internet.

> **TIPS: Cara Upload Manual (Tanpa Command Line)**
> Jika Anda kesulitan dengan kode di atas, Anda bisa upload secara manual:
> 1. Setelah menekan tombol **Create repository**, perhatikan bagian tengah layar GitHub Anda.
> 2. Klik tulisan biru berbunyi: **"uploading an existing file"**.
> 3. Buka folder `konfirmasi_rdkk` di komputer Anda, _block_ semua file/folder di dalamnya (terutama folder `frontend`), lalu _drag and drop_ (Tarik & Lepas) ke layar GitHub tersebut.
> 4. Tunggu proses _upload_ selesai, ketik pesan (misal "Upload manual"), lalu klik **Commit changes**.

### B. Hubungkan ke Cloudflare (Cara Otomatis via GitHub)
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Di bilah menu sebelah kiri, masuk ke menu **Workers & Pages**.
3. Klik tombol **Create application**, lalu pilih tab **Pages**.
4. Pilih metode **Connect to Git** dan klik tombol _Connect to GitHub_.
5. Beri izin Cloudflare, lalu pilih Repositori GitHub yang baru saja Anda buat.
6. Klik **Begin setup**.

### C. Konfigurasi Build Pages
Pada halaman konfigurasi (*Set up builds and deployments*), atur parameter berikut dengan teliti:

- **Project name:** (Bebas, ini akan jadi subdomain web Anda)
- **Production branch:** `main` (atau sesuai branch GitHub Anda)
- **Framework preset:** `Vite` (Sistem Cloudflare biasanya mendeteksi otomatis)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory / Base directory:** Jika file `package.json` dan `index.html` Anda berada di dalam folder khusus bernama `frontend` (seperti struktur Anda saat ini), maka ketikkan `/frontend` (atau `frontend`) pada kolom Root directory. (Jika file-file itu ada di folder terluar repositori, biarkan kosong).

### D. Deploy
1. Klik tombol **Save and Deploy**.
2. Cloudflare akan mulai menarik (*clone*) kode Anda dan menjalankan kompilasi (*build*).
3. Tunggu 1-2 menit. Jika sukses, Cloudflare akan memberikan URL publik untuk mengakses aplikasi Anda (contoh: `https://koperasi-erdkk.pages.dev`).

---

## ⚡ ALTERNATIF SUPER MUDAH: Direct Upload ke Cloudflare (Tanpa GitHub)
Jika cara dengan GitHub dirasa terlalu rumit, Anda bisa langsung mengunggah aplikasi web Anda ke Cloudflare tanpa GitHub!

1. Buka terminal di VS Code (atau CMD) di dalam folder proyek Anda.
2. Ketikkan perintah: `cd frontend` lalu tekan enter.
3. Ketikkan perintah: `npm run build` dan tunggu hingga selesai (1-3 detik). Ini akan menciptakan folder baru bernama **`dist`** (di dalam folder frontend).
4. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/), masuk ke menu **Workers & Pages**.
5. Klik **Create application**, pilih **Pages**, lalu pilih opsi **Upload assets** (Direct Upload).
6. Beri nama proyek Anda, klik **Create project**.
7. Anda akan melihat kotak untuk mengunggah file. Buka File Explorer Anda, cari folder **`dist`** hasil _build_ tadi, dan **tarik & lepas (drag & drop)** *seluruh isi* folder tersebut ke kotak unggahan Cloudflare (atau tekan Select Folder lalu pilih foldernya).
8. Klik **Deploy site**. Selesai! Web Anda langsung tayang!

---

### Informasi Penting
- Saat ini, _login_ Admin dilakukan melalui halaman `/admin.html`. 
- Kredensial super admin bawaan pertama kali jika Anda menginisialisasi ulang database adalah:
  - Username: `admin`
  - Password: `123456`
  (Anda bisa melihat dan mengubahnya melalui tabel `Users` di dalam Google Spreadsheet).
