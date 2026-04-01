# AMS Frontend

Modern, mobile-responsive frontend for the Attendance Management System.

## 🚀 Features
- **Framework**: Next.js 14 with App Router.
- **Styling**: Tailwind CSS for a premium look & feel.
- **Icons**: Lucide Icons.
- **Scanning**: `html5-qrcode` for barcode/QR code scanning.
- **Auth**: Integrated with backend JWT-based authentication.
- **Dynamic Dashboard**: Responsive charts and lists.

## 🛠 Setup
1. Ensure Node.js 18+ is installed.
2. Run `npm install`.
3. Configure `.env.local` to point to the backend API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## 🗄 Project Structure
- `app`: Pages and layouts.
- `components`: Reusable UI components.
- `lib`: API clients, types, and utility functions.
- `hooks`: Custom React hooks for hardware scanning and more.
- `public`: Static assets (logos, icons).
