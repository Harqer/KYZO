# KYZO Frontend - GitHub Pages Deployment

## Overview
This is the frontend application for KYZO, deployed on GitHub Pages.

## Database Connection
The frontend doesn't directly connect to the database. Instead, it communicates with the backend API deployed on Vercel.

### API Configuration
- **Backend URL**: `https://api.kyzo.com` (production)
- **Development URL**: `http://localhost:5000` (local)

### Environment Variables (for frontend)
```env
NEXT_PUBLIC_API_URL=https://api.kyzo.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YXNzdXJpbmctYmVhci00MC5jbGVyay5hY2NvdW50cy5kZXY$
```

## Deployment Instructions

### Step 1: Set up GitHub Pages
1. Create repository: `harqer.github.io`
2. Set it to public
3. Enable GitHub Pages in Settings

### Step 2: Configure Environment
Create `.env.local` in the fashion-app directory:
```env
NEXT_PUBLIC_API_URL=https://api.kyzo.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YXNzdXJpbmctYmVhci00MC5jbGVyay5hY2NvdW50cy5kZXY$
```

### Step 3: Build and Deploy
```bash
cd fashion-app
npm run build
npm run export
```

Copy the `out` folder to your GitHub Pages repository.

## Architecture
```
GitHub Pages (Frontend)  <--->  Vercel (Backend API)  <--->  Neon PostgreSQL
     Static Site               Serverless Functions        Database
```

## Database URL
The actual database URL is used by the backend (Vercel), not the frontend:
```
postgresql://neondb_owner:npg_B6s0rywlRhao@ep-quiet-cell-amsnhw0l-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
