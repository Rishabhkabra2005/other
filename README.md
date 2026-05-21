# CareConnect Health — Digital Healthcare Platform

Secure, multi-user healthcare platform built with **Next.js 14** (App Router), **Supabase PostgreSQL**, **Prisma**, **NextAuth.js**, and **Tailwind CSS**.

## Features

- **Patient**: Registration with OTP activation, family profiles, doctor discovery, on-site / phone / video booking
- **Doctor**: Schedule management, fee updates, patient history, digital prescriptions
- **Admin**: Analytics, doctor verification queue, moderation overview
- **Security**: bcrypt password hashing, JWT sessions, RBAC on all protected APIs

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (PostgreSQL)

### 2. Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — Supabase **connection pooling** URL (Transaction mode, port 6543)
- `DIRECT_URL` — Supabase **direct** URL (Session mode, port 5432; used by Prisma migrations)
- `NEXTAUTH_SECRET` — random secret (32+ chars)
- `NEXTAUTH_URL` — `http://localhost:3000`

Find both URLs in Supabase → **Project Settings** → **Database**.

### 3. Install & database

```bash
npm install
npm run db:setup
```

`db:setup` runs `prisma db push` and seeds demo data.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role    | Email                     | Password       |
|---------|---------------------------|----------------|
| Patient | patient@healthcare.com    | Password123!   |
| Doctor  | dr.sharma@healthcare.com  | Password123!   |
| Admin   | admin@healthcare.com      | Password123!   |

**OTP (new registrations):** `123456`

## Project Structure

```
prisma/schema.prisma     # Database models
prisma/seed.ts           # Demo data
src/app/api/             # REST API routes
src/app/(auth)/          # Login, register, OTP
src/app/patient/         # Patient dashboards & booking
src/app/doctor/          # Doctor dashboards
src/app/admin/           # Admin dashboards
src/components/          # UI components
src/lib/                 # Prisma, auth, utilities
```

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run db:seed` | Seed database         |
| `npm run db:push` | Sync schema to DB    |
