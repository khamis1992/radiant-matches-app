<div align="center">

# ✨ Radiant Matches

**Premium Beauty & Makeup Booking Platform**

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🌐 Live Demo](https://radiant-matches.com) · [📖 Documentation](#documentation) · [🚀 Quick Start](#quick-start)

</div>

---

## 🎯 Overview

Radiant Matches is a modern, full-stack beauty booking platform connecting clients with top-tier makeup artists, hairstylists, and beauty professionals. Built with cutting-edge technologies for seamless user experience and powerful admin capabilities.

### ✨ Key Features

- 🎨 **Smart Booking System** - Real-time availability and instant booking confirmation
- 👥 **Artist Profiles** - Comprehensive portfolios with ratings and reviews
- 📅 **Advanced Scheduling** - Calendar integration with automated reminders
- 💳 **Secure Payments** - Multiple payment gateways including SADAD
- 🌐 **Multilingual Support** - Full Arabic & English localization
- 📱 **Responsive Design** - Optimized for mobile, tablet, and desktop
- 🎛️ **Admin Dashboard** - Complete management system for banners, users, and bookings
- 🖼️ **Dynamic Banners** - Smart promotional banner system with scheduling

---

## 🛠️ Tech Stack

### Frontend
- ⚡ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Modern UI library with hooks
- 📘 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first styling
- 🧩 **shadcn/ui** - Beautiful UI components
- 🔄 **TanStack Query** - Powerful data synchronization
- 🗺️ **React Router** - Client-side routing

### Backend & Database
- 🗄️ **Supabase** - PostgreSQL database with real-time subscriptions
- 🔐 **Supabase Auth** - Secure authentication & authorization
- 📦 **Row Level Security** - Granular data access control

### Additional Tools
- 📅 **date-fns** - Modern date manipulation
- 🎭 **Framer Motion** - Smooth animations
- 📊 **Recharts** - Interactive charts
- 🌍 **i18n** - Internationalization

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/khamis1992/radiant-matches-app.git

# 2. Navigate to project directory
cd radiant-matches-app

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 5. Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

---

## 📁 Project Structure

```
radiant-matches-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── admin/          # Admin-specific components
│   ├── contexts/           # React contexts (Auth, Language, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   ├── lib/                # Utility functions & translations
│   ├── pages/              # Route pages
│   ├── services/           # API services
│   └── types/              # TypeScript type definitions
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

---

## 🎨 Features Showcase

### For Clients
- 🔍 Browse artists by category (Makeup, Hair, Nails, etc.)
- 📸 View portfolios and customer reviews
- 📅 Book appointments with real-time availability
- 💬 In-app messaging with artists
- 🔔 Push notifications for booking updates

### For Artists
- 🎨 Create and manage professional profiles
- 📊 Analytics dashboard with insights
- 💼 Portfolio management with image upload
- ⏰ Set working hours and blocked dates
- 💰 Track earnings and payments

### For Admins
- 📊 Comprehensive analytics dashboard
- 🖼️ Dynamic banner management with drag-and-drop positioning
- 👥 User management system
- 📦 Service category management
- ⚙️ System settings and configurations

---

## 🌟 Banner Management System

Our advanced banner system allows admins to:

- 🖼️ Upload high-quality banner images
- 🎯 **Drag & drop positioning** - Move image focus point with mouse
- 📱 **Desktop/Mobile preview** - See how banners look on different devices
- 📏 **Dynamic sizing** - Adjust banner height (80px - 400px)
- 🔍 **Zoom control** - Scale images from 50% to 200%
- 🎨 **Overlay opacity** - Control text readability
- 📅 **Scheduling** - Set start and end dates for campaigns
- 🎛️ **Element visibility** - Toggle title, subtitle, and button display

---

## 📱 Mobile Responsive

Fully optimized for all devices:

- 📱 Mobile phones (375px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1440px+)

---

## 🔐 Security

- ✅ Row Level Security (RLS) on all database tables
- ✅ JWT-based authentication
- ✅ HTTPS-only cookies
- ✅ Input validation and sanitization
- ✅ Protected admin routes
- ✅ Secure file uploads

---

## 🌍 Internationalization

Full support for:
- 🇸🇦 Arabic (RTL)
- 🇺🇸 English (LTR)

Easy to add more languages via the translation files in `src/lib/translations/`

---

## 📝 Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id

# Optional: Payment Gateway
VITE_PAYMENT_API_KEY=your_payment_key
```

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run linter
npm run lint

# Run type checker
npm run typecheck
```

---

## 🚀 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway up --detach
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔃 Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## 📸 Screenshots

<div align="center">

| Home Page | Artist Profile | Booking |
|-----------|---------------|---------|
| ![Home](docs/screenshots/home.png) | ![Profile](docs/screenshots/profile.png) | ![Booking](docs/screenshots/booking.png) |

| Admin Dashboard | Banner Editor | Analytics |
|-----------------|---------------|-----------|
| ![Admin](docs/screenshots/admin.png) | ![Banner](docs/screenshots/banner.png) | ![Analytics](docs/screenshots/analytics.png) |

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- 💜 [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- 💚 [Supabase](https://supabase.com/) for backend infrastructure
- 💙 [Tailwind CSS](https://tailwindcss.com/) for styling
- ❤️ All our contributors and supporters

---

## 📞 Support

Need help? Reach out to us:

- 📧 Email: support@radiant-matches.com
- 💬 Discord: [Join our server](https://discord.gg/radiant-matches)
- 🐛 Issues: [GitHub Issues](https://github.com/khamis1992/radiant-matches-app/issues)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with 💖 by the Radiant Matches Team

</div>
