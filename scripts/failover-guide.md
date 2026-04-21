# 🔄 Webmaa Production Failover & Disaster Recovery Guide

This document outlines the standard operating procedure (SOP) to keep Webmaa online during severe Vercel outages or security breaches.

## 1. Architecture Overview
Your application flow is: `Users -> Cloudflare (Proxy & Secret Injection) -> Vercel (Edge Middleware Check) -> Firebase (DB)`.
If Vercel goes down, we redirect Cloudflare. If Firebase goes down, we rely on backups.

## 2. Setting Up The Standby Server (webmaa-backup)
You should prepare a secondary deployment environment ahead of time.

1. **Create Backup Branch:** Run `git checkout -b webmaa-backup` and push it to GitHub `git push origin webmaa-backup`.
2. **Vercel Secondary Project:** In Vercel, create a new project (e.g., `webmaa-standby`) linked to the same GitHub repo but configure it to track the `webmaa-backup` branch.
3. **Environment Sync:** Copy all environment variables from `.env.example` / `production` into this secondary project. 
4. Disable automatic deployment on this secondary branch to conserve build hours unless you are explicitly updating the backup.

## 3. During an Outage
If the main `webmaa` Vercel project halts:

1. **Log into Cloudflare Dashboard.**
2. Go to **DNS -> Records**.
3. Locate the `CNAME` or `A` record pointing to the primary Vercel deployment (`cname.vercel-dns.com` or your explicit Vercel project ID).
4. **Edit the Record:** Change the target to point to your `webmaa-standby` branch's custom URL (e.g., `webmaa-standby.vercel.app`).
5. Wait ~60 seconds. Cloudflare's proxy will instantly route incoming customer traffic to the healthy standby server.

## 4. Recovering the Database from Backup
Your system has a local `scripts/db-backup.js` script.
- Set up a daily CRON job on a secure local machine or a cheap Linux VPS to run: `node scripts/db-backup.js`.
- If Firebase experiences data-corruption (e.g., a malicious admin deletes products), you can map the generated `backup-[date].json` file and write a short loop using `admin.firestore().collection('shops').doc(id).set(data)` to restore.

## 5. Middleware Override (Emergency)
If Cloudflare itself goes down (extremely rare) and you need to direct users straight to Vercel without proxy protection:
1. Log into Vercel setting for the project.
2. Delete the `CF_SECRET_KEY` environment variable and trigger a redeploy.
3. The Middleware (`src/middleware.js`) will automatically bypass the strict proxy lock, allowing direct URL access again until you re-enable it.
