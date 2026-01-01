# 💰 Cashpath

**Cashpath** adalah platform manajemen dan simulasi keuangan pribadi modern yang dibangun dengan Next.js 16. Dirancang untuk membantu pengguna melacak pengeluaran, menetapkan target tabungan, mengelola transaksi berulang, dan mensimulasikan masa depan keuangan dengan insight berbasis AI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green?style=flat-square)
![tRPC](https://img.shields.io/badge/tRPC-11-blue?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Variabel Environment](#-variabel-environment)
- [Setup Database](#-setup-database)
- [Setup Inngest (Background Jobs)](#-setup-inngest-background-jobs)
- [Setup Cloudflare R2 Storage](#-setup-cloudflare-r2-storage)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Proyek](#-struktur-proyek)
- [Script yang Tersedia](#-script-yang-tersedia)
- [Referensi API](#-referensi-api)
- [Deployment](#-deployment)
- [Lisensi](#-lisensi)

---

## ✨ Fitur

### 📊 Dashboard

- Ringkasan keuangan real-time dengan statistik pemasukan/pengeluaran
- Transaksi terbaru dalam sekejap
- Visualisasi tren bulanan (6 bulan terakhir)
- Akses cepat ke semua fitur platform

### 💳 Manajemen Transaksi

- Riwayat transaksi lengkap dengan filter canggih
- Filter berdasarkan kategori, dompet, rentang tanggal, dan jenis transaksi
- **Pemindaian struk berbasis AI** menggunakan Google Gemini
- Dukungan transaksi berulang (harian/mingguan/bulanan/tahunan)
- Operasi CRUD lengkap untuk transaksi

### 🎯 Target Tabungan

- Buat dan lacak target tabungan dengan jumlah target dan tenggat waktu
- **Milestone yang dihasilkan AI** dengan saran personal
- Pelacakan progres visual
- Kontribusi dana dari dompet ke target
- Regenerasi milestone dengan kecepatan berbeda (agresif/moderat/santai)

### 🔮 Time Machine (Simulasi Keuangan)

- Buat skenario keuangan "bagaimana jika"
- Tambahkan item pemasukan dan pengeluaran proyeksi
- Hitung proyeksi keuangan 1 tahun dan 5 tahun
- Simpan dan bandingkan beberapa skenario

### ⚙️ Pengaturan & Konfigurasi

- Kelola kategori transaksi (pemasukan/pengeluaran/keduanya)
- Kelola dompet (rekening bank, e-wallet, tunai)
- Lihat statistik penggunaan kategori dan dompet

### 🔐 Autentikasi

- Registrasi email & password
- Integrasi Google OAuth
- Autentikasi berbasis session yang aman

---

## 🛠 Tech Stack

| Kategori               | Teknologi                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| **Framework**          | [Next.js 16](https://nextjs.org/) dengan App Router                         |
| **Bahasa**             | [TypeScript 5](https://www.typescriptlang.org/)                             |
| **Database**           | [Neon PostgreSQL](https://neon.tech/) (Serverless)                          |
| **ORM**                | [Drizzle ORM](https://orm.drizzle.team/)                                    |
| **Autentikasi**        | [better-auth](https://www.better-auth.com/)                                 |
| **API Layer**          | [tRPC 11](https://trpc.io/)                                                 |
| **State Management**   | [TanStack React Query](https://tanstack.com/query)                          |
| **Background Jobs**    | [Inngest](https://www.inngest.com/)                                         |
| **AI**                 | [Google Generative AI (Gemini)](https://ai.google.dev/)                     |
| **Storage**            | [Cloudflare R2](https://www.cloudflare.com/products/r2/)                    |
| **UI Components**      | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Styling**            | [Tailwind CSS 4](https://tailwindcss.com/)                                  |
| **Forms**              | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)   |
| **Linting/Formatting** | [Biome](https://biomejs.dev/)                                               |

---

## 📦 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

- **Node.js 20+** atau **Bun** (direkomendasikan)
- **Database Neon PostgreSQL** - [Buat database gratis](https://neon.tech/)
- **Proyek Google Cloud Console** - Untuk OAuth dan Gemini AI API
- **Bucket Cloudflare R2** - Untuk penyimpanan gambar struk
- **Akun Inngest** (opsional untuk dev lokal) - Untuk manajemen background job

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/forenoo/cashpath.git
cd cashpath
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# Menggunakan bun (direkomendasikan)
bun install

# Menggunakan pnpm
pnpm install
```

### 3. Setup Variabel Environment

Buat file `.env.local` di direktori root:

```bash
cp .env.example .env.local
```

Kemudian isi semua variabel environment yang diperlukan (lihat bagian [Variabel Environment](#-variabel-environment)).

### 4. Setup Database

```bash
# Push schema ke database (development)
npm run db:push

# Atau generate dan jalankan migrations (production)
npm run db:generate
npm run db:migrate
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

---

## 🔑 Variabel Environment

Buat file `.env.local` dengan variabel berikut:

### Variabel Wajib

| Variabel               | Deskripsi                             | Contoh                                                           |
| ---------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`         | URL koneksi Neon PostgreSQL           | `postgresql://user:pass@host.neon.tech/cashpath?sslmode=require` |
| `BETTER_AUTH_SECRET`   | Secret key untuk enkripsi better-auth | `your-32-character-secret-key`                                   |
| `BETTER_AUTH_URL`      | Base URL untuk callback better-auth   | `http://localhost:3000`                                          |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                | `xxxxx.apps.googleusercontent.com`                               |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret            | `GOCSPX-xxxxx`                                                   |
| `GEMINI_API_KEY`       | API Key Google Gemini AI              | `AIzaSyxxxxx`                                                    |
| `R2_ACCOUNT_ID`        | Cloudflare R2 Account ID              | `xxxxx`                                                          |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 Access Key ID           | `xxxxx`                                                          |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Access Key       | `xxxxx`                                                          |
| `R2_BUCKET_NAME`       | Nama Bucket Cloudflare R2             | `cashpath-receipts`                                              |
| `R2_PUBLIC_URL`        | URL publik untuk bucket R2            | `https://r2.yourdomain.com`                                      |

### Variabel Opsional

| Variabel               | Deskripsi                   | Default                             |
| ---------------------- | --------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_BASE_URL` | Base URL untuk SEO/metadata | Fallback ke `http://localhost:3000` |

### Contoh File `.env.local`

```env
# ============================================
# DATABASE (Neon PostgreSQL)
# ============================================
# Dapatkan connection string dari https://neon.tech
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/cashpath?sslmode=require

# ============================================
# AUTENTIKASI (better-auth)
# ============================================
# Generate random 32+ karakter secret key untuk enkripsi session
# Anda bisa generate dengan: openssl rand -base64 32
BETTER_AUTH_SECRET=your-32-character-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# ============================================
# GOOGLE OAuth
# ============================================
# Buat credentials di https://console.cloud.google.com/apis/credentials
# Tambahkan authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ============================================
# AI (Google Gemini)
# ============================================
# Dapatkan API key dari https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key

# ============================================
# STORAGE (Cloudflare R2)
# ============================================
# Buat R2 bucket dan API tokens di https://dash.cloudflare.com
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=cashpath-receipts
R2_PUBLIC_URL=https://your-r2-public-url.com
```

---

## 🗄 Setup Database

Cashpath menggunakan **Neon PostgreSQL** dengan **Drizzle ORM** untuk manajemen database.

### Membuat Database Neon

1. Kunjungi [neon.tech](https://neon.tech/) dan buat akun gratis
2. Buat proyek dan database baru
3. Salin connection string dan tambahkan ke `.env.local` sebagai `DATABASE_URL`

### Skema Database

Database mencakup tabel-tabel berikut:

| Tabel              | Deskripsi                                           |
| ------------------ | --------------------------------------------------- |
| `user`             | Akun pengguna dengan informasi profil               |
| `session`          | Session pengguna untuk autentikasi                  |
| `account`          | Akun provider OAuth (Google)                        |
| `verification`     | Token verifikasi email                              |
| `category`         | Kategori transaksi (pemasukan/pengeluaran/keduanya) |
| `wallet`           | Dompet pengguna dengan saldo                        |
| `transaction`      | Transaksi keuangan dengan dukungan berulang         |
| `goal`             | Target tabungan dengan target dan tenggat waktu     |
| `goal_milestone`   | Milestone yang dihasilkan AI untuk target           |
| `goal_transaction` | Kontribusi ke target dari dompet                    |
| `scenario`         | Skenario simulasi Time Machine                      |

### Perintah Database

```bash
# Push perubahan schema langsung ke database (development)
npm run db:push

# Generate file SQL migration
npm run db:generate

# Jalankan migration yang pending (production)
npm run db:migrate

# Buka Drizzle Studio untuk melihat/edit data
npm run db:studio
```

### Melihat Database Anda

Jalankan Drizzle Studio untuk melihat database secara visual:

```bash
npm run db:studio
```

Ini membuka antarmuka web di `https://local.drizzle.studio` di mana Anda dapat melihat dan mengedit data.

---

## ⚡ Setup Inngest (Background Jobs)

Cashpath menggunakan **Inngest** untuk memproses transaksi berulang secara otomatis.

### Fungsi Background

| Fungsi                                | Jadwal               | Deskripsi                                              |
| ------------------------------------- | -------------------- | ------------------------------------------------------ |
| `scan-recurring-transactions`         | Harian jam 00:05 UTC | Memindai transaksi berulang yang harus diproses        |
| `process-recurring-transaction`       | Dipicu event         | Memproses transaksi berulang individual                |
| `process-user-recurring-transactions` | Dipicu event         | Memproses semua transaksi berulang untuk satu pengguna |

### Setup Development Lokal

1. **Install Inngest CLI** (opsional tapi direkomendasikan):

```bash
npm install -g inngest-cli
```

2. **Jalankan Inngest Dev Server**:

```bash
npx inngest-cli@latest dev
```

3. Dev server akan tersedia di `http://localhost:8288`

4. Endpoint Inngest aplikasi Anda otomatis terdaftar di `/api/inngest`

### Setup Production

1. Buat akun di [inngest.com](https://www.inngest.com/)
2. Buat app baru dan dapatkan **Event Key** dan **Signing Key**
3. Tambahkan berikut ke environment production Anda:

```env
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

4. Deploy aplikasi Anda dan Inngest akan otomatis menyinkronkan fungsi-fungsi Anda

### Cara Kerja Transaksi Berulang

1. Fungsi `scan-recurring-transactions` berjalan setiap hari jam 00:05 UTC
2. Mencari semua transaksi berulang di mana `next_occurrence` sudah jatuh tempo
3. Untuk setiap transaksi, dispatch event `process-recurring-transaction`
4. Processor membuat transaksi baru dan menghitung tanggal kejadian berikutnya
5. Frekuensi yang didukung: `daily`, `weekly`, `monthly`, `yearly`

---

## 📁 Setup Cloudflare R2 Storage

Cashpath menggunakan **Cloudflare R2** untuk menyimpan gambar struk yang digunakan dalam pemindaian AI.

### Menyiapkan R2

1. **Buat Akun Cloudflare**: Kunjungi [cloudflare.com](https://www.cloudflare.com/) dan daftar

2. **Buat Bucket R2**:

   - Navigasi ke R2 di dashboard Cloudflare Anda
   - Klik "Create bucket"
   - Beri nama (misalnya, `cashpath-receipts`)

3. **Buat API Tokens**:

   - Pergi ke R2 > Manage R2 API Tokens
   - Buat token dengan izin **Read** dan **Write**
   - Salin `Access Key ID` dan `Secret Access Key`

4. **Konfigurasi Public Access** (untuk melihat struk):

   - Di pengaturan bucket, aktifkan public access
   - Setup custom domain atau gunakan subdomain R2.dev
   - Salin URL publik untuk `R2_PUBLIC_URL`

5. **Konfigurasi CORS** (untuk upload dari browser):
   - Di pengaturan bucket, tambahkan aturan CORS:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

### Cara Kerja Pemindaian Struk

1. Pengguna mengupload gambar struk
2. Aplikasi menghasilkan presigned URL untuk upload langsung ke R2
3. Gambar diupload ke penyimpanan R2
4. Google Gemini AI menganalisis gambar
5. Data yang diekstrak (jumlah, tanggal, deskripsi) dikembalikan
6. Pengguna dapat mengedit dan menyimpan transaksi

---

## 🏃 Menjalankan Aplikasi

### Mode Development

```bash
# Jalankan development server Next.js
npm run dev

# Di terminal terpisah, jalankan Inngest dev server (opsional)
npx inngest-cli@latest dev
```

Aplikasi akan tersedia di:

- **Aplikasi**: http://localhost:3000
- **Dashboard Inngest**: http://localhost:8288

### Mode Production

```bash
# Build aplikasi
npm run build

# Jalankan production server
npm run start
```

---

## 📂 Struktur Proyek

```
cashpath/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route autentikasi
│   │   ├── login/               # Halaman login
│   │   └── register/            # Halaman registrasi
│   ├── (root)/                   # Route terproteksi (dengan navbar)
│   │   ├── layout.tsx           # Layout root dengan navbar
│   │   ├── dashboard/           # Dashboard utama
│   │   ├── transactions/        # Manajemen transaksi
│   │   ├── goals/               # Target tabungan
│   │   ├── time-machine/        # Simulasi keuangan
│   │   └── settings/            # Kategori & dompet
│   ├── api/                      # Route API
│   │   ├── auth/[...all]/       # Endpoint better-auth
│   │   ├── inngest/             # Handler webhook Inngest
│   │   └── trpc/[trpc]/         # Endpoint tRPC
│   ├── globals.css              # Style global
│   ├── layout.tsx               # Layout root
│   └── page.tsx                 # Halaman landing
│
├── components/                   # Komponen React
│   ├── ui/                      # Komponen shadcn/ui
│   ├── navbar.tsx               # Navigation bar
│   ├── add-transaction-sheet.tsx
│   ├── add-goal-sheet.tsx
│   └── ...                      # Komponen spesifik fitur
│
├── db/                           # Database
│   ├── index.ts                 # Inisialisasi client database
│   ├── schema.ts                # Definisi schema Drizzle
│   └── migrations/              # File SQL migration
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts            # Hook deteksi mobile
│   ├── use-receipt-scanner.ts   # Hook pemindaian struk
│   └── use-receipt-upload.ts    # Hook upload struk
│
├── lib/                          # Utilitas dan konfigurasi
│   ├── utils.ts                 # Utilitas umum (cn, dll.)
│   ├── auth/                    # Autentikasi
│   │   ├── auth.ts              # Konfigurasi auth server-side
│   │   └── auth-client.ts       # Hooks auth client-side
│   ├── inngest/                 # Background jobs
│   │   ├── client.ts            # Client Inngest
│   │   └── functions/           # Definisi fungsi Inngest
│   ├── storage/                 # Penyimpanan file
│   │   ├── index.ts             # Utilitas storage
│   │   └── r2-client.ts         # Client Cloudflare R2
│   └── validations/             # Schema validasi Zod
│       ├── category.ts
│       ├── goal.ts
│       ├── transaction.ts
│       └── ...
│
├── trpc/                         # Konfigurasi tRPC
│   ├── client/                  # Setup tRPC client-side
│   └── server/                  # tRPC server-side
│       ├── index.ts             # Inisialisasi tRPC
│       ├── trpc.ts              # Context & procedures tRPC
│       └── routers/             # Router API
│           ├── category.ts
│           ├── wallet.ts
│           ├── transaction.ts
│           ├── goal.ts
│           ├── receipt.ts
│           ├── scenario.ts
│           └── storage.ts
│
├── public/                       # Aset statis
├── biome.json                   # Konfigurasi Biome linter
├── components.json              # Konfigurasi shadcn/ui
├── drizzle.config.ts            # Konfigurasi Drizzle ORM
├── next.config.ts               # Konfigurasi Next.js
├── package.json                 # Dependencies & scripts
├── postcss.config.mjs           # Konfigurasi PostCSS
├── tailwind.config.ts           # Konfigurasi Tailwind CSS
└── tsconfig.json                # Konfigurasi TypeScript
```

---

## 📜 Script yang Tersedia

| Script        | Perintah                    | Deskripsi                                    |
| ------------- | --------------------------- | -------------------------------------------- |
| `dev`         | `next dev --turbopack`      | Jalankan development server dengan Turbopack |
| `build`       | `next build`                | Build untuk production                       |
| `start`       | `next start`                | Jalankan production server                   |
| `lint`        | `biome check`               | Jalankan Biome linter                        |
| `format`      | `biome format --write`      | Format kode dengan Biome                     |
| `db:push`     | `bunx drizzle-kit push`     | Push schema ke database                      |
| `db:studio`   | `bunx drizzle-kit studio`   | Buka Drizzle Studio                          |
| `db:generate` | `bunx drizzle-kit generate` | Generate migrations                          |
| `db:migrate`  | `bunx drizzle-kit migrate`  | Jalankan migrations                          |

---

## 🔌 Referensi API

Cashpath menggunakan **tRPC** untuk komunikasi API yang type-safe.

### Router yang Tersedia

| Router        | Deskripsi           | Prosedur Utama                                        |
| ------------- | ------------------- | ----------------------------------------------------- |
| `category`    | Kategori transaksi  | `create`, `getAll`, `update`, `delete`                |
| `wallet`      | Manajemen dompet    | `create`, `getAll`, `getById`, `update`, `delete`     |
| `transaction` | Transaksi           | `create`, `getAll`, `getStats`, `update`, `delete`    |
| `goal`        | Target tabungan     | `create`, `getAll`, `addAmount`, `generateMilestones` |
| `receipt`     | Pemindaian struk AI | `scanReceipt`                                         |
| `scenario`    | Time Machine        | `create`, `getAll`, `calculate`, `delete`             |
| `storage`     | Upload file         | `getPresignedUrl`                                     |
| `user`        | Profil pengguna     | `getProfile`, `updateProfile`                         |

### Jenis Prosedur

- **Public Procedures**: Tidak memerlukan autentikasi
- **Protected Procedures**: Memerlukan session terautentikasi

### Contoh Penggunaan (Client-side)

```typescript
import { trpc } from "@/trpc/client";

// Contoh query
const { data: transactions } = trpc.transaction.getAll.useQuery({
  limit: 10,
  offset: 0,
});

// Contoh mutation
const createTransaction = trpc.transaction.create.useMutation();

await createTransaction.mutateAsync({
  amount: 50000,
  type: "expense",
  categoryId: "xxx",
  walletId: "xxx",
  description: "Belanja groceries",
});
```

---

## 🚀 Deployment

### Vercel (Direkomendasikan)

1. Push kode Anda ke GitHub
2. Import repository Anda di [Vercel](https://vercel.com)
3. Tambahkan semua variabel environment di Project Settings
4. Deploy!

### Platform Lain

Cashpath dapat di-deploy ke platform manapun yang mendukung Next.js:

- **Railway**
- **Render**
- **AWS Amplify**
- **Docker** (self-hosted)

### Checklist Production

- [ ] Set semua variabel environment
- [ ] Jalankan database migrations (`npm run db:migrate`)
- [ ] Konfigurasi Inngest untuk production (tambahkan event/signing keys)
- [ ] Setup CORS Cloudflare R2 untuk domain production Anda
- [ ] Update URI redirect Google OAuth yang diizinkan
- [ ] Aktifkan HTTPS

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail.

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan ajukan Pull Request.

1. Fork repository
2. Buat branch fitur Anda (`git checkout -b feature/FiturKeren`)
3. Commit perubahan Anda (`git commit -m 'Tambah FiturKeren'`)
4. Push ke branch (`git push origin feature/FiturKeren`)
5. Buka Pull Request

---

## 📧 Dukungan

Jika Anda memiliki pertanyaan atau butuh bantuan, silakan buka issue di GitHub.

---

<p align="center">Dibuat dengan ❤️ oleh <a href="https://github.com/forenoo">forenoo</a></p>
