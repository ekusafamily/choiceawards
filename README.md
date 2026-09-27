# Comrade Choice Awards 2026 (DeKUT)

An awards and recognition platform for Dedan Kimathi University of Technology (DeKUT), powered by **Node.js/Express**, **React (Vite)**, and **Supabase (PostgreSQL & Storage)** with planned M-Pesa voting integration.

## Features

- **Award Categories**: 19+ categories across Individual Achievements and Student Organizations.
- **Dynamic Leaderboards**: Real-time standings with gold/silver/bronze ranking indicators.
- **Nominee Profiles**: Dedicated profile pages featuring student details, photos, achievements, and social sharing (WhatsApp status, X, Facebook).
- **Point-Based Voting**: Configured for KSh 10 = 10 pts, with 1.1x bonus points for KSh 100+.
- **Nomination Portal**: Form with a **500KB display image upload** directly to Supabase Storage buckets.
- **DeKUT Institutional Design**: Deep university green, dark charcoal, and gold highlights, with repeating institutional background pattern.

## Architecture

- `client/`: React + Vite frontend with vanilla CSS design system.
- `server/`: Node.js Express backend with Supabase client and graceful mock fallback.
  - `src/db/schema.sql`: Full PostgreSQL schema, RLS policies, and storage bucket configuration.
  - `src/routes/upload.js`: Multer image uploader with 500KB limit and Supabase Storage integration.

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to `http://localhost:5000`.

### 3. Database & Storage Setup

Open your Supabase project's SQL Editor and execute `server/src/db/schema.sql` to create all tables, indexes, RLS policies, and the `nominee-images` storage bucket.
