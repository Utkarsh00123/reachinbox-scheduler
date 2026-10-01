# 🚀 ReachInbox Full-Stack Email Job Scheduler & Outreach Dashboard

A production-grade, persistent email job scheduling platform built for **ReachInbox.ai**. It accepts email campaigns via APIs and Dashboard, schedules them with precision using **BullMQ + Redis**, enforces strict per-sender hourly rate limits, provider throttling, real-time Slack rate-limit alerts, and sends emails through **Ethereal Fake SMTP** with live preview links.

---

## 🏗 System Architecture & Design

```
                     ┌───────────────────────────┐
                     │   Next.js 15 Dashboard   │
                     │ (Tabs, Compose, Live UI) │
                     └─────────────┬─────────────┘
                                   │ REST API & JWT
                                   ▼
                     ┌───────────────────────────┐
                     │    Express.js Backend     │
                     │  (TypeScript + Prisma)    │
                     └───────┬───────────┬───────┘
                             │           │
           ┌─────────────────┴─┐       ┌─┴────────────────┐
           │                   │       │                  │
           ▼                   ▼       ▼                  ▼
    ┌─────────────┐     ┌───────────┐ ┌─────────────┐ ┌──────────────┐
    │ SQLite / DB │     │ BullMQ    │ │ Ethereal    │ │ Slack API    │
    │ (Prisma)    │     │ (Redis)   │ │ (SMTP Mail) │ │ (OAuth/Alert)│
    └─────────────┘     └─────┬─────┘ └─────────────┘ └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ BullMQ Workers  │
                     │ (Concurrency=5) │
                     └─────────────────┘
```

---

## ✨ Features Implemented

### 1. ⏱ Core Scheduler & Persistence (No Cron)
- **Zero-Cron Guarantee:** Uses **BullMQ delayed jobs** backed by Redis. No `node-cron`, `agenda`, or OS crontabs.
- **Server Restart Resilience:** When the backend restarts, `recoverScheduledJobsOnStartup()` scans the database for any pending/rate-limited emails and re-syncs them into BullMQ with their remaining delays.
- **Idempotency:** Email schedule records enforce unique Job IDs and status checks to guarantee no email is ever sent twice.

### 2. ⚡ Throughput, Throttling & Rate Limiting
- **Worker Concurrency:** BullMQ worker concurrency is configurable (`WORKER_CONCURRENCY=5`).
- **Provider Delay Throttling:** Configurable delay between each email send (`DEFAULT_MIN_DELAY_MS=2000`, 2 seconds) to mimic real-world provider limits.
- **Hourly Rate Limiter Per Sender:** 
  - Backed by atomic Redis counters (`INCR` + sliding/hour-window expiration) and synced to the database.
  - When a sender hits their hourly quota (e.g., 200 emails/hr), jobs are **not dropped**; they are automatically deferred and rescheduled to the beginning of the next hour window.
- **Slack Alert on Rate Limit Hit:** Real OAuth flow & webhook integration that posts an instant rich alert to the connected Slack channel the moment a sender exceeds their hourly limit.

### 3. 🔍 Search & Visibility
- **Elasticsearch Client & Indexing:** Full `@elastic/elasticsearch` indexing service with graceful fallback to DB text search.
- **BullMQ Live Queue Dashboard:** Mounted at `http://localhost:5001/admin/queues` via `@bull-board/express` for real-time visibility into active, delayed, waiting, and completed jobs.
- **Ethereal Live Previews:** Every email sent automatically generates and displays a clickable live Ethereal inbox preview link.

### 4. 🎨 Modern Frontend Dashboard (Next.js & Tailwind CSS)
- **Google OAuth Login / 1-Click Demo Login:** Fast evaluator access.
- **Top Header:** User avatar, name, email, Slack connection status badge, BullMQ dashboard link, and logout.
- **Tabs:** "Scheduled Emails" and "Sent Emails" with status badges, timestamps, and live search.
- **Compose Modal:** Subject, rich body, lead CSV/text file parser (with email count preview), start time picker, inter-email delay, and hourly rate limit controls.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Redis**: Running on `localhost:6379` (or specify `REDIS_URL` in `.env`)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Backend will start on: **`http://localhost:5001`**
- API Health: `http://localhost:5001/health`
- BullMQ Live Dashboard: `http://localhost:5001/admin/queues`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on: **`http://localhost:3000`**

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5001
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="reachinbox_secret_jwt_key_scheduler_2026"
WORKER_CONCURRENCY=5
DEFAULT_MIN_DELAY_MS=2000
DEFAULT_HOURLY_LIMIT=200

# Optional Elasticsearch
ELASTICSEARCH_URL=""

# Optional Google OAuth
GOOGLE_CLIENT_ID=""

# Optional Slack OAuth
SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:5001/api/slack/callback"
FRONTEND_URL="http://localhost:3000"
```

---

## 📹 Demo Flow Instructions

1. Open `http://localhost:3000` and click **"Enter Workspace (1-Click Demo)"**.
2. Click **"Compose New Email"**:
   - Upload a `.csv` or text file of leads (or paste multiple emails).
   - Set start time, 2-second delay, and hourly limit.
   - Click **"Schedule Emails"**.
3. Watch the **"Scheduled Emails"** tab:
   - Notice the delayed status.
   - Click **"BullMQ Dashboard"** in the top navbar to view the live queues and worker execution.
4. Once sent, switch to **"Sent Emails"** tab:
   - Click **"View Preview"** on any email to open the live HTML message rendered inside Ethereal Email!
5. **Restart Test:** Stop the backend server while jobs are queued, then restart it with `npm run dev`. Observe that pending emails are automatically recovered and sent on time!
