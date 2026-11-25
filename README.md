# FinTrack — Portfolio & Investment Tracking Platform

A full-stack portfolio and investment management platform built with a **Laravel** REST API backend and a **Next.js** frontend.

## Live Deployment

- **Frontend Application (Vercel):** https://fintrack-finnet-beta.vercel.app
- **Backend REST API (Render):** https://fintrack-finnet.onrender.com/api
- **Interactive API Documentation:** https://fintrack-finnet.onrender.com/docs/api

> **Note:** The backend runs on Render's free tier and spins down after periods of inactivity. The very first request after an idle period may take 30–50 seconds to wake up.

### Demo Credentials

- **Email:** `analyst@finnet.co.ke`
- **Password:** `password`

---

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS (deployed on Vercel)
- **Backend:** PHP 8.4, Laravel, Laravel Sanctum, Scramble OpenAPI Docs (deployed via Docker on Render)
- **Database:** MySQL (hosted on Aiven)

---

## Project Structure

```text
fintrack/
├── backend/     # Laravel REST API, migrations, seeders, and Dockerfile
└── frontend/    # Next.js web application