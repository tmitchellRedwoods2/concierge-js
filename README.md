# Concierge.js

A modern concierge service management platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

Concierge.js is a full-stack web application migrated from Python/Streamlit, providing comprehensive service management for clients including expense tracking, investment management, health services, and more.

## Features

- 🔐 **Authentication & Authorization** - Secure user authentication with NextAuth.js
- 👥 **Multi-tier Plans** - Basic, Premium, and Elite subscription plans
- 💰 **Expense Management** - Track and categorize expenses
- 📈 **Investment Tracking** - Portfolio management and broker integration
- 🏥 **Health Management** - Prescription tracking and pharmacy integration
- 🛡️ **Insurance Management** - Policy tracking and claims
- ⚖️ **Legal Services** - Case management and document tracking
- 📊 **Tax Management** - Tax document organization and provider integration
- ✈️ **Travel Planning** - Trip management and service integration
- 💬 **Messaging System** - Multi-channel communication
- 🤖 **AI Agents** - Automated assistance and insights
- 👨‍💼 **Admin Dashboard** - User management and analytics

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js
- **Database**: MongoDB/Mongoose
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local or cloud)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=mongodb://localhost:27017/concierge
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## Project Structure

```
concierge-js/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and configs
│   └── types/            # TypeScript types
├── public/               # Static assets
└── tests/                # Test files
```

## Development

```bash
# Run dev server with Turbopack
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Migration from Python

This project is being migrated from a Python/Streamlit application. See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for details on the migration strategy.

## License

Private - All rights reserved

## Original Python Project

The original Python/Streamlit version is maintained separately at `/Users/timmitchell/my-new-project` and is deployed on Streamlit Cloud.
# CI/CD Pipeline Test
# Deployment trigger
# Force deployment trigger Mon Oct 13 12:03:50 PDT 2025
# Force another build Mon Oct 13 12:47:38 PDT 2025
# Trigger staging deployment from develop branch
# Force redeploy
# Build trigger Mon Oct 20 14:32:10 PDT 2025
# Build test Tue Oct 21 11:11:15 PDT 2025
