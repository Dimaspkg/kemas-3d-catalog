# Panduan Kebijakan Penyimpanan Supabase (Row Level Security)

Gunakan perintah SQL di bawah ini untuk mengamankan bucket penyimpanan Supabase Anda. Kebijakan ini memastikan bahwa file dapat dibaca oleh publik (agar muncul di situs Anda) tetapi hanya dapat diubah oleh pengguna yang telah login (admin).

Jalankan perintah ini di **SQL Editor** pada dasbor Supabase Anda.

---

## 1. Kebijakan untuk Bucket: `assets`

Bucket ini digunakan untuk menyimpan logo situs.

```sql
-- 1. Aktifkan Row Level Security untuk objects di storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Buat kebijakan untuk akses BACA publik
-- Kebijakan ini mengizinkan siapa saja untuk melihat file di bucket 'assets'.
CREATE POLICY "Public Read Access for Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'assets' );

-- 3. Buat kebijakan untuk akses TULIS, PERBARUI, HAPUS oleh pengguna terotentikasi
-- Kebijakan ini hanya mengizinkan pengguna yang sudah login untuk mengunggah, mengubah, atau menghapus file.
CREATE POLICY "Authenticated Write Access for Assets"
ON storage.objects FOR ALL
USING ( bucket_id = 'assets' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'assets' AND auth.role() = 'authenticated' );

```

---

## 2. Kebijakan untuk Bucket: `product-images`

Bucket ini digunakan untuk menyimpan gambar-gambar produk.

```sql
-- 1. Buat kebijakan untuk akses BACA publik
CREATE POLICY "Public Read Access for Product Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Buat kebijakan untuk akses TULIS, PERBARUI, HAPUS oleh pengguna terotentikasi
CREATE POLICY "Authenticated Write Access for Product Images"
ON storage.objects FOR ALL
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
```

---

## 3. Kebijakan untuk Bucket: `product-models`

Bucket ini digunakan untuk menyimpan file model 3D (.glb).

```sql
-- 1. Buat kebijakan untuk akses BACA publik
CREATE POLICY "Public Read Access for Product Models"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-models' );

-- 2. Buat kebijakan untuk akses TULIS, PERBARUI, HAPUS oleh pengguna terotentikasi
CREATE POLICY "Authenticated Write Access for Product Models"
ON storage.objects FOR ALL
USING ( bucket_id = 'product-models' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'product-models' AND auth.role() = 'authenticated' );
```

---

## 4. Kebijakan untuk Bucket: `environment-maps`

Bucket ini digunakan untuk menyimpan file environment 3D (.hdr).

```sql
-- 1. Buat kebijakan untuk akses BACA publik
CREATE POLICY "Public Read Access for Environment Maps"
ON storage.objects FOR SELECT
USING ( bucket_id = 'environment-maps' );

-- 2. Buat kebijakan untuk akses TULIS, PERBARUI, HAPUS oleh pengguna terotentikasi
CREATE POLICY "Authenticated Write Access for Environment Maps"
ON storage.objects FOR ALL
USING ( bucket_id = 'environment-maps' AND auth.role() = 'authenticated' )
WITH CHECK ( bucket_id = 'environment-maps' AND auth.role() = 'authenticated' );
```

### Cara Menggunakan:

1.  Buka Dasbor Supabase proyek Anda.
2.  Di menu sebelah kiri, navigasi ke **SQL Editor**.
3.  Klik **New query**.
4.  Salin dan tempel kode SQL dari atas untuk setiap bucket yang relevan.
5.  Klik **RUN** untuk menerapkan kebijakan.

Ulangi untuk setiap set kebijakan bucket yang Anda perlukan. Anda hanya perlu menjalankan `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` satu kali.
