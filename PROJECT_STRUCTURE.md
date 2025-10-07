# Concierge.js - Project Structure

## Overview
Next.js 14 full-stack application migrated from Python/Streamlit.

## Directory Structure

```
concierge-js/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── expenses/
│   │   │   ├── investments/
│   │   │   ├── health/
│   │   │   ├── insurance/
│   │   │   ├── legal/
│   │   │   ├── tax/
│   │   │   ├── travel/
│   │   │   ├── messages/
│   │   │   ├── ai-agents/
│   │   │   └── settings/
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── clients/       # Client management
│   │   │   └── services/      # Service modules
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── auth/             # Auth components
│   │   ├── dashboard/        # Dashboard components
│   │   └── services/         # Service-specific components
│   │
│   ├── lib/                  # Utilities and configs
│   │   ├── api/              # API client functions
│   │   ├── db/               # Database utilities
│   │   └── utils/            # Helper functions
│   │
│   └── types/                # TypeScript type definitions
│
├── public/                   # Static assets
├── prisma/                   # Database schema (if using Prisma)
└── tests/                    # Test files

```

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context / Zustand
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Auth**: NextAuth.js
- **Database**: MongoDB / PostgreSQL (TBD)
- **ORM**: Prisma / Mongoose (TBD)

### Features to Migrate

#### Core Features
- [x] Project setup
- [ ] Authentication & Authorization
- [ ] Client intake system
- [ ] Multi-tier plans (Basic, Premium, Elite)
- [ ] Dynamic pricing logic

#### Service Modules
- [ ] Expense Management
- [ ] Investment Management
- [ ] Health/Prescription Management
- [ ] Insurance Management
- [ ] Legal Services
- [ ] Tax Management
- [ ] Travel Planning
- [ ] Messaging System
- [ ] AI Agents
- [ ] Settings & Profile

#### Admin Features
- [ ] Admin dashboard
- [ ] User management
- [ ] Analytics
- [ ] System metrics

## Migration Strategy

1. **Phase 1: Foundation**
   - Set up project structure ✅
   - Install dependencies
   - Configure database
   - Set up authentication

2. **Phase 2: Core Features**
   - Migrate data models
   - Implement client intake
   - Set up pricing logic
   - Create plan system

3. **Phase 3: Service Modules**
   - Migrate each service one by one
   - Expenses → Investments → Health → etc.

4. **Phase 4: Polish**
   - Admin dashboard
   - Testing
   - Optimization
   - Deployment

## Running the App

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Run tests
npm test
```

## Environment Variables

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# API Keys (if needed)
# Add as required
```

