# Martins Tech - Backend (TypeScript)

## Overview
Backend in TypeScript (Node.js + Express) with:
- MongoDB Atlas
- Cloudinary image uploads (via multer + multer-storage-cloudinary)
- JWT authentication
- Admin + Employees (roles)
- Routes: /api/products, /api/stores, /api/employees, /api/auth

## Quick start
1. Copy `.env.example` to `.env` and fill values.
2. Install:
   ```
   npm install
   ```
3. Run dev:
   ```
   npm run dev
   ```
4. Seed admin:
   ```
   npm run seed
   ```

## Deploy
- Render.com: point to repo/backend, build `npm run build`, start `npm start`.
- Add env vars in Render dashboard.

## Notes for frontend integration
- Set `VITE_API_URL` in frontend to your deployed backend url.
- For uploads: use multipart/form-data to `/api/products` with up to 3 files under field `images`.
- Use Authorization header: `Bearer <token>` for protected routes.
