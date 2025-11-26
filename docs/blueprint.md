# **App Name**: Cosmetic Canvas

## Core Features:

- 3D Model Display: Menampilkan model 3D kemasan kosmetik (`.glb`) menggunakan **React Three Fiber**, dengan detail mesh yang merepresentasikan bagian utama (cap, body, pump).
- Interactive Controls: Memungkinkan pengguna melakukan **orbit, pan, dan zoom** pada model menggunakan **OrbitControls**, sehingga produk bisa dilihat dari berbagai sudut.
- Color Customization: Pengguna dapat mengganti warna tiap bagian kemasan (cap, body, pump) melalui **color picker**. Warna ter-update secara real-time di model 3D.
- Material Selection: Menyediakan opsi material untuk tiap bagian kemasan melalui **dropdown selector**: - Matte - Glossy - Metallic - Rubber - Metal (Polished) Efek visual diatur menggunakan **PBR helper function** untuk mengontrol `roughness` dan `metalness`.
- Environment Lighting: Menggunakan **@react-three/drei/Environment** dengan preset “studio” atau HDRI khusus, agar material glossy/metal tampil lebih realistis.
- Background Color Adjustment: Tersedia kontrol untuk mengganti **background canvas 3D**, sehingga bisa disesuaikan dengan branding atau mood presentasi.

## Style Guidelines:

- **Primary Color**: Soft Lavender `#E6E6FA` → menonjolkan kesan keindahan dan sofistikasi, selaras dengan dunia kosmetik.
- **Background Color**: Very Light Gray `#F5F5F5` → netral, menjaga fokus tetap pada produk.
- **Accent Color**: Black → digunakan untuk elemen interaktif & highlight, memberikan nuansa mewah.
- **Typography**: Gunakan font **Alegreya** (humanist serif) untuk body dan headline, menghadirkan kesan elegan, intelektual, dan kontemporer.
- **Layout**: Dua kolom → kiri untuk **3D canvas**, kanan untuk **kontrol kustomisasi**, dibangun dengan **Tailwind CSS** agar responsif.
- **Micro-Interactions**: Transisi halus saat mengganti warna atau material, menciptakan pengalaman pengguna yang mulus dan premium.