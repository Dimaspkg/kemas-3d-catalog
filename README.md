# Kemas 3D Catalog

Kemas 3D Catalog adalah aplikasi web interaktif yang memungkinkan pengguna untuk memvisualisasikan dan mengkustomisasi kemasan produk kosmetik dalam 3D secara *real-time*. Pengguna dapat mengubah material, warna, dan atribut lainnya, serta melihat hasilnya secara langsung pada model 3D.

## Fitur Utama

- **Visualisasi 3D Interaktif:** Lihat produk dari berbagai sudut, perbesar, dan putar.
- **Kustomisasi Real-time:** Ubah material, warna, dan finishing kemasan.
- **Katalog Produk:** Jelajahi berbagai jenis kemasan yang tersedia.
- **Admin Dashboard:** Panel admin untuk mengelola produk, material, dan aset lainnya.

---

## Teknologi yang Digunakan

- **Framework:** [Next.js](https://nextjs.org/) (React Framework)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Penyimpanan File:** [Supabase Storage](https://supabase.com/docs/guides/storage) (Untuk model 3D dan gambar produk)
- **Rendering 3D:** [Three.js](https://threejs.org/) / [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)

---

## Struktur Proyek

Proyek ini mengikuti struktur standar aplikasi Next.js dengan App Router:

```
.
├── src
│   ├── app
│   │   ├── (app)         # Rute utama aplikasi (untuk pengguna)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Halaman utama
│   │   │   └── products
│   │   ├── admin         # Rute untuk panel admin
│   │   ├── api           # Rute API (misal: otentikasi)
│   │   └── layout.tsx    # Layout utama
│   ├── components      # Komponen React yang dapat digunakan kembali
│   ├── lib             # Fungsi utilitas & konfigurasi (termasuk firebase.ts)
│   └── ...
├── public              # Aset statis (gambar, model 3D, dll.)
└── ...
```

---

## Panduan Memulai

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di lingkungan lokal Anda.

### 1. Prasyarat

- [Node.js](https://nodejs.org/en/) (v18.0 atau lebih baru)
- [npm](https://www.npmjs.com/) atau [yarn](https://yarnpkg.com/)

### 2. Kloning Repositori

```bash
git clone https://github.com/Dimaspkg/kemas-3d-catalog.git
cd kemas-3d-catalog
```

### 3. Instalasi Dependensi

```bash
npm install
```

### 4. Konfigurasi Environment Variables

Buat file `.env.local` di direktori utama proyek dengan meniru `.env.example`.

```bash
cp .env.example .env.local
```

Kemudian, isi file `.env.local` dengan kredensial Firebase dan Supabase Anda:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 5. Menjalankan Server Pengembangan

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

## Deployment

Aplikasi ini di-deploy menggunakan [Firebase Hosting](https://firebase.google.com/docs/hosting). Proses build akan membuat output statis di direktori `.next` yang kemudian di-deploy.

