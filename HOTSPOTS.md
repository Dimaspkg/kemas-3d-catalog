# Cara Membuat Hotspot Interaktif untuk Model 3D

Fitur hotspot memungkinkan Anda untuk menambahkan titik-titik informasi interaktif pada model 3D Anda. Ketika pengguna mengklik sebuah hotspot di kanvas, sebuah pop-up akan muncul menampilkan judul dan deskripsi yang telah Anda tentukan.

Proses ini terdiri dari dua bagian: (1) mendapatkan koordinat dari software 3D Anda, dan (2) memasukkan data tersebut ke dalam panel admin aplikasi.

---

### Bagian 1: Mendapatkan Koordinat dari Software 3D (Contoh: Blender)

Tujuan dari langkah ini adalah untuk mendapatkan posisi (koordinat X, Y, Z) di mana hotspot akan muncul pada model 3D Anda.

1.  **Buka Model Anda di Blender**
    Pastikan model utama Anda sudah siap dan berada di posisi yang benar.

2.  **Buat Objek Penanda (Empty Object)**
    - Di lokasi pada model tempat Anda ingin hotspot muncul, buatlah sebuah objek kosong (*Empty*). Objek ini tidak akan terlihat saat dirender, tetapi berfungsi sebagai penanda posisi yang akurat.
    - Untuk membuat *Empty*, tekan `Shift + A`, lalu pilih `Empty > Plain Axes` (atau jenis lainnya).
    - Pindahkan *Empty* tersebut ke posisi yang tepat pada permukaan model Anda (misalnya, di tengah tutup, di dekat logo daur ulang, dll.).

3.  **Beri Nama yang Jelas (Sangat Penting!)**
    - Pilih objek *Empty* yang baru Anda buat.
    - Di panel *Object Properties* (ikon kotak oranye), ubah namanya menjadi sesuatu yang deskriptif dan unik. Sebaiknya gunakan format `hotspot_[nama_bagian]_[info]`.
    - Contoh: `hotspot_cap_material`, `hotspot_base_info_recycle`.

4.  **Salin Koordinat Posisi**
    - Dengan objek *Empty* masih terpilih, lihat panel *Object Properties*.
    - Di bawah bagian `Transform`, Anda akan melihat nilai `Location` untuk **X, Y, dan Z**.
    - **Salin (catat) ketiga nilai ini.** Inilah koordinat yang akan Anda gunakan di panel admin.

     <!-- Anda bisa mengganti URL ini dengan screenshot jika perlu -->

Ulangi langkah 2-4 untuk setiap hotspot yang ingin Anda tambahkan pada model.

---

### Bagian 2: Memasukkan Data Hotspot di Panel Admin

Setelah Anda memiliki semua koordinat, langkah selanjutnya adalah memasukkannya ke dalam aplikasi.

1.  **Buka Halaman Edit Produk**
    - Login ke panel admin.
    - Navigasi ke `Products`.
    - Klik ikon pensil (Edit) pada produk yang sesuai dengan model 3D Anda.

2.  **Temukan Kolom "Hotspots"**
    - Gulir ke bawah pada formulir edit produk hingga Anda menemukan `Textarea` dengan label "Hotspots".

3.  **Masukkan Data dalam Format JSON**
    - Di dalam kolom ini, Anda akan memasukkan sebuah array JSON. Formatnya harus berupa `[` diikuti oleh satu atau lebih objek hotspot `{}`, dan diakhiri dengan `]`.

    **Struktur untuk satu objek hotspot:**
    ```json
    {
      "id": "string",          // ID unik untuk hotspot, contoh: "cap_info"
      "name": "string",        // Nama objek Empty dari Blender, contoh: "hotspot_cap_material"
      "title": "string",       // Judul yang akan ditampilkan di pop-up
      "description": "string", // Teks informasi yang akan ditampilkan
      "position": {
        "x": number,           // Koordinat X dari Blender
        "y": number,           // Koordinat Y dari Blender
        "z": number            // Koordinat Z dari Blender
      }
    }
    ```

#### Contoh Lengkap untuk Dua Hotspot:

Salin dan tempelkan struktur di bawah ini ke dalam `Textarea` "Hotspots", lalu sesuaikan nilainya dengan data yang telah Anda kumpulkan.

```json
[
  {
    "id": "hotspot1",
    "name": "hotspot_cap_material",
    "title": "Material Tutup",
    "description": "Tutup ini terbuat dari aluminium yang dapat didaur ulang sepenuhnya. Harap pisahkan dari badan botol sebelum didaur ulang.",
    "position": {
      "x": 0.0,
      "y": 8.5,
      "z": 0.0
    }
  },
  {
    "id": "hotspot2",
    "name": "hotspot_base_recycle",
    "title": "Simbol Daur Ulang",
    "description": "Produk ini memenuhi standar ramah lingkungan dan menggunakan bahan yang dapat diperbarui. Kunjungi situs kami untuk informasi lebih lanjut.",
    "position": {
      "x": 1.2,
      "y": -3.0,
      "z": 1.2
    }
  }
]
```

4.  **Simpan Perubahan**
    - Setelah selesai memasukkan semua data hotspot, klik tombol "Save Changes".
    - Buka halaman kanvas untuk produk tersebut dan klik pada model di lokasi hotspot untuk menguji apakah pop-up informasi muncul dengan benar.

Selamat! Anda telah berhasil menambahkan hotspot interaktif ke model 3D Anda.
