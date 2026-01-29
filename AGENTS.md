# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Signalist is an AI-powered stock market tracking application built with Next.js 16. It provides real-time stock data, personalized alerts, watchlists, and event-driven workflows powered by Inngest. The app features AI-generated market summaries and personalized user communications via Gemini AI.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4, Shadcn UI components
- **Backend**: Next.js API routes (server actions pattern with 'use server')
- **Database**: MongoDB with Mongoose ODM (cached connection pattern)
- **Authentication**: Better Auth (email/password with MongoDB adapter)
- **Event-Driven Workflows**: Inngest (background jobs, scheduled tasks, AI workflows)
- **AI Integration**: Google Gemini API (via Inngest AI SDK)
- **Email**: Nodemailer (Gmail SMTP)
- **Stock Data**: Finnhub API
- **Charts**: TradingView widgets

## Development Commands

### Running the Application
```powershell
# Start Next.js development server
npm run dev

# Start Inngest Dev Server (REQUIRED for event-driven workflows)
npx inngest-cli@latest dev
```
**IMPORTANT**: Both commands must run simultaneously. The Inngest dev server provides a local dashboard at http://localhost:8288 for viewing and triggering workflows.

### Build and Production
```powershell
# Build production bundle
npm run build

# Start production server
npm start
```

### Linting
```powershell
# Run ESLint
npm run lint
```

### Testing
```powershell
# Test MongoDB connection
npm run test:db
```

**Note**: TypeScript build errors are intentionally ignored via `next.config.ts` (`ignoreBuildErrors: true`). Be cautious when making changes.

## Architecture Overview

### Application Structure

#### Route Groups and Layouts
The app uses Next.js 15+ route groups for distinct UI layouts:
- `app/(auth)/`: Authentication pages (sign-in, sign-up) - no header
- `app/(root)/`: Main application with persistent Header component
  - `page.tsx`: Dashboard with TradingView widgets (heatmaps, market overview, timeline)
  - `stocks/[symbol]/page.tsx`: Individual stock detail pages
- `app/(test)/`: Development/testing routes

#### Server Actions Pattern
All data fetching and mutations use Next.js server actions (`'use server'` directive):
- `lib/actions/auth.actions.ts`: Sign up/in with Better Auth integration
- `lib/actions/finnhub.actions.ts`: Stock search, news fetching, market data (uses React `cache()` for deduplication)
- `lib/actions/watchlist.actions.ts`: Watchlist CRUD operations
- `lib/actions/user.actions.ts`: User profile and data management

**Key Pattern**: Actions connect to MongoDB via `connectToDatabase()` helper which implements global caching to prevent connection exhaustion in serverless environments.

#### Authentication Flow
- Better Auth is configured with MongoDB adapter in `lib/better-auth/auth.ts`
- Session is lazily initialized (singleton pattern) via `getAuth()` to ensure DB connection is ready
- Middleware (`middleware/index.ts`) protects all routes except auth pages using Better Auth session cookies
- Root layout validates session and redirects to `/sign-in` if not authenticated

#### Database Layer
- **Connection**: `database/mongoose.ts` implements global caching pattern (`global.mongooseCache`) to reuse connections across serverless function invocations
- **Models**: Mongoose schemas in `database/models/` (e.g., `watchlist.model.ts`)
- **Schema Pattern**: Models use compound unique indexes (e.g., `userId + symbol`) to prevent duplicates

### Event-Driven Architecture (Inngest)

Inngest powers asynchronous workflows and scheduled jobs. Configuration:
- **Client**: `lib/inngest/client.ts` initializes Inngest with Gemini AI integration
- **Functions**: `lib/inngest/functions.ts` defines workflow functions
- **Route Handler**: `app/api/inngest/route.ts` serves Inngest HTTP endpoint

#### Key Workflows

**1. Sign-Up Welcome Email** (`sendSignUpEmail`)
- Triggered by: `app/user.created` event
- Flow:
  1. Receives user profile (country, investment goals, risk tolerance, industry)
  2. Calls Gemini AI via `step.ai.infer()` to generate personalized welcome message
  3. Sends customized welcome email via Nodemailer

**2. Daily News Summary** (`sendDailyNewsSummary`)
- Triggered by: `app/send.daily.news` event (can be scheduled via cron)
- Flow:
  1. Fetches all users eligible for news emails
  2. For each user, retrieves watchlist symbols
  3. Fetches news articles from Finnhub (company-specific or general fallback)
  4. Summarizes news per user using Gemini AI
  5. Sends personalized email with AI-generated summary

**Triggering Events**: Use the Inngest dev server UI (http://localhost:8288) or programmatically via `inngest.send()`.

### External API Integration

#### Finnhub API (`lib/actions/finnhub.actions.ts`)
- **Rate Limiting**: Uses Next.js `fetch` cache with revalidation periods (300-3600s) to avoid hitting rate limits
- **Search**: `searchStocks()` cached with React `cache()` - searches symbols or returns popular stocks if no query
- **News**: `getNews()` fetches company-specific or general market news with round-robin article selection across symbols
- **API Keys**: Supports both `FINNHUB_API_KEY` (server-only) and `NEXT_PUBLIC_FINNHUB_API_KEY` (client-side)

### Environment Variables

Required variables (see `.env.local.template`):
```
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=http://localhost:3000

FINNHUB_API_KEY=<your_key>              # Server-side (preferred)
NEXT_PUBLIC_FINNHUB_API_KEY=<your_key>  # Client-side fallback

MONGODB_URI=<your_mongodb_connection_string>

BETTER_AUTH_SECRET=<random_string>
BETTER_AUTH_URL=http://localhost:3000

GEMINI_API_KEY=<your_gemini_key>

NODEMAILER_EMAIL=<gmail_address>
NODEMAILER_PASSWORD=<gmail_app_password>
```

**Security Note**: Gmail requires an "App Password" for Nodemailer (not regular password). Generate at https://myaccount.google.com/apppasswords

## File Organization Conventions

- `app/`: Next.js 15+ App Router structure
- `components/`: Shared React components (Header, SearchCommand, WatchlistButton, etc.)
  - `components/ui/`: Shadcn components (button, dialog, dropdown, etc.)
  - `components/forms/`: Form-specific components
- `lib/`: Core business logic and utilities
  - `lib/actions/`: Server actions for data operations
  - `lib/inngest/`: Inngest workflow functions and prompts
  - `lib/better-auth/`: Authentication configuration
  - `lib/nodemailer/`: Email sending logic and templates
  - `lib/constants.ts`: Global constants including TradingView widget configs
  - `lib/utils.ts`: Utility functions (formatting, date handling, etc.)
- `database/`: MongoDB connection and Mongoose models
- `middleware/`: Next.js middleware (authentication guard)
- `types/`: Global TypeScript type definitions (`global.d.ts`)
- `hooks/`: Custom React hooks (if any)
- `public/`: Static assets
- `scripts/`: Utility scripts (e.g., `test-db.mjs`)

## Important Patterns and Conventions

### MongoDB Connection Pattern
Always use the cached connection helper:
```typescript
import { connectToDatabase } from '@/database/mongoose';

const mongoose = await connectToDatabase();
const db = mongoose.connection.db;
```
Never create new connections directly.

### Better Auth Integration
Access authenticated user in Server Components:
```typescript
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const session = await auth.api.getSession({ headers: await headers() });
const user = session?.user;
```

### TypeScript Path Aliases
Use `@/*` for absolute imports (configured in `tsconfig.json`):
```typescript
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
```

### Server Actions Convention
All data mutations and fetches should be server actions:
- Prefix with `'use server'` directive
- Export as async functions
- Handle errors gracefully with try/catch
- Return serializable data (no class instances, functions, etc.)

### Styling with TailwindCSS
- Uses Tailwind 4 with PostCSS plugin
- Custom utility: `cn()` from `lib/utils.ts` for conditional class merging
- Dark theme via Shadcn (configured in `app/globals.css`)

## Common Development Workflows

### Adding a New Stock Feature
1. Create server action in `lib/actions/finnhub.actions.ts` or new file
2. Add TypeScript types to `types/global.d.ts` if needed
3. Create UI component in `components/`
4. Import and use in relevant page (e.g., `app/(root)/stocks/[symbol]/page.tsx`)

### Adding a New Workflow
1. Define function in `lib/inngest/functions.ts` using `inngest.createFunction()`
2. Add prompt template to `lib/inngest/prompts.ts` if using AI
3. Register function in `app/api/inngest/route.ts` `serve()` config
4. Test via Inngest dev server UI

### Adding a New Mongoose Model
1. Create schema in `database/models/<name>.model.ts`
2. Export model with hot-reload check: `models?.ModelName || model('ModelName', schema)`
3. Add compound indexes for common queries
4. Use in server actions via `connectToDatabase()`

### Debugging MongoDB Connection
Run the test script:
```powershell
npm run test:db
```
Checks `.env` variables and attempts connection with timing information.

## Known Constraints and Quirks

- **TypeScript Errors Ignored**: Build process ignores TS errors (`ignoreBuildErrors: true`). Always verify types manually.
- **Inngest Dependency**: Workflows won't execute without `npx inngest-cli@latest dev` running locally.
- **TradingView Widgets**: Require client-side rendering. Use dynamic imports with `ssr: false` if needed.
- **Finnhub Rate Limits**: Free tier is limited. Aggressive caching is implemented to mitigate.
- **Session Management**: Middleware redirects unauthenticated users to root (`/`), not `/sign-in` - ensure sign-in is accessible.
- **Email Templates**: HTML templates in `lib/nodemailer/templates.ts` use inline styles for email client compatibility.

## Testing and Quality Checks

- **Database Connectivity**: `npm run test:db`
- **Type Checking**: No explicit script; Next.js build includes type checking (but errors are ignored)
- **Linting**: `npm run lint` - uses Next.js ESLint config
- **No Unit Tests**: Project does not currently include Jest/Vitest test suite

## Key Dependencies to Be Aware Of

- `better-auth@^1.3.7`: Authentication library (framework-agnostic)
- `inngest@^3.44.3`: Event-driven workflow engine with AI SDK
- `mongoose@^8.18.0`: MongoDB ODM (connection caching is critical)
- `next@^16.1.0`: React framework with App Router
- `react@^19.2.3`: Latest React with Server Components
- `nodemailer@^7.0.9`: Email sending (Gmail SMTP)
- `cmdk@^1.1.1`: Command palette component (used in SearchCommand)
- `lucide-react@^0.542.0`: Icon library
- `@radix-ui/*`: Headless UI primitives (Shadcn foundation)

## Troubleshooting Guide

### MongoDB Connection Failures
- Verify `MONGODB_URI` in `.env`
- Check IP whitelist in MongoDB Atlas (0.0.0.0/0 for dev)
- Run `npm run test:db` to diagnose

### Inngest Workflows Not Executing
- Ensure `npx inngest-cli@latest dev` is running
- Check dev server UI at http://localhost:8288
- Verify function is registered in `app/api/inngest/route.ts`

### Email Not Sending
- Verify Gmail App Password (not regular password)
- Check `NODEMAILER_EMAIL` and `NODEMAILER_PASSWORD` in `.env`
- Gmail may block "less secure apps" - use App Passwords

### Stock Search Returns Empty
- Check `FINNHUB_API_KEY` is set
- Verify API key is valid at https://finnhub.io
- Free tier may be rate-limited - check Finnhub dashboard

### Build Errors
- Remember: TypeScript errors are ignored in build
- For runtime errors, check server logs in terminal
- Clear `.next` folder and rebuild: `rm -r .next; npm run build`
