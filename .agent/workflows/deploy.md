---
description: How to deploy and access the Smart Hotel website
---

# Deployment Guide

Follow these steps to move your hotel management app from development to production.

## 1. Local Network Access (Easiest)
If you just want to access the app from other devices (phones/tablets) in the same office/building:
1. Ensure all devices are on the same WiFi network.
2. In your terminal, run: `npm run dev -- --host`
3. Look for the "Network" URL (e.g., `http://192.168.1.50:5173`).
4. Type that URL into the browser of any other device on the network.

## 2. Professional Cloud Deployment (Recommended)
To access the app from anywhere in the world:

### Option A: Vercel (Simplest)
1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **"Add New"** > **"Project"**.
4. Import your repository.
5. Vercel will auto-detect Vite. Click **"Deploy"**.
6. You will get a permanent `your-hotel.vercel.app` link.

### Option B: Manual Build
If you have your own server:
1. Run `npm run build`.
2. This creates a `dist` folder.
3. Upload the contents of the `dist` folder to your web host via FTP or CPanel.

> [!IMPORTANT]
> **Data Note**: Since this app uses LocalStorage for the database, data is stored locally in the browser. If you access it from Device A, you won't see the same data on Device B unless you migrate to a real backend (e.g., Firebase, Supabase, or a Node.js API).
