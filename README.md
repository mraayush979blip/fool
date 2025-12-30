# Phase-Based Learning Platform

A comprehensive learning management portal with distinct admin and student panels, featuring time-tracking, video completion checks, and assignment versioning.

## Features

### Admin Panel
- **Dashboard**: KPI cards showing total students, active/revoked counts, and live phases
- **Phase Management**: Create, edit, pause/resume, and delete learning phases
- **Student Management**: View, search, revoke/activate students
- **CSV Import**: Bulk student registration
- **Analytics**: Retention pie charts and phase completion statistics

### Student Portal
- **Phase Dashboard**: View all phases with progress tracking
- **Video Player**: YouTube integration with progress tracking (≥90% completion)
- **Assignment Submission**: GitHub URL or file upload with version history
- **Motivation Stats**: Class completion percentages
- **Time Tracking**: Automatic heartbeat tracking with idle detection

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **File Storage**: Supabase Storage
- **State Management**: Zustand + React Query
- **Video Player**: react-youtube
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aprilfool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Go to Project Settings → API
   - Copy your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp env.template .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

5. **Set up the database**
   - Open Supabase SQL Editor
   - Run the SQL script from `supabase/schema.sql`
   - This will create all tables, indexes, and RLS policies

6. **Create an admin user**
   - In Supabase, go to Authentication → Users
   - Create a new user with email/password
   - Go to Table Editor → users
   - Find the user and set `role` to `'admin'`

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**
   - Navigate to http://localhost:3000
   - Log in with your admin credentials

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── student/           # Student portal pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # React components
│   └── ProtectedRoute.tsx # Role-based access control
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript types
    └── database.ts        # Database interfaces

supabase/
└── schema.sql             # Database schema
```

## Database Schema

The platform uses 7 main tables:

1. **users**: Student and admin accounts
2. **phases**: Learning phases with videos and assignments
3. **submissions**: Current submissions (one per student per phase)
4. **submission_history**: Version history of all submissions
5. **student_phase_activity**: Time tracking and video progress
6. **activity_logs**: Immutable activity event log
7. **csv_imports**: CSV import history

See `supabase/schema.sql` for complete schema details.

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Key Features Implementation

### Time Tracking
- Heartbeat every 30 seconds when page is visible
- Idle detection after 90 seconds of inactivity
- Aggregated per phase and total

### Video Completion
- Tracks watch progress via YouTube IFrame API
- Marks complete at ≥90% watched
- Updates `student_phase_activity` table

### Submission Versioning
- Every edit creates a new version in `submission_history`
- Current submission in `submissions` table
- Full audit trail with timestamps

### Auto-Revocation
- Students without valid submissions after deadline are revoked
- Can be implemented via Supabase Edge Functions or cron jobs

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
