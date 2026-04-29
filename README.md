# Digital Tech-Connect Yearbook (DTCY)

A production-ready digital yearbook platform that replaces traditional printed yearbooks with an interactive, searchable, and feature-rich web application.

## Overview

DTCY connects students, faculty, and alumni in one dynamic environment where:
- **Students** create profiles, share yearbook memories, and network with alumni
- **Faculty** view student profiles and approve yearbook entries
- **Alumni** stay connected with current students and update career information
- **Admins** moderate content and manage the system

## Live Demo

**Test Credentials:**
```
Student:  student@dtcy.com / Student@123
Faculty:  faculty@dtcy.com / Faculty@123
Alumni:   alumni@dtcy.com / Alumni@123
Admin:    admin@dtcy.com / Admin@123
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript |
| Styling | TailwindCSS |
| State Management | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password) |
| File Storage | Supabase Storage (Avatars, Photos) |

## Features

### Authentication & Authorization
- Email/password registration and login
- JWT token-based authentication
- Role-based access control (student, faculty, alumni, admin)
- "Remember me" functionality
- Protected routes with role-based restrictions

### User Profiles
- Public profile pages with role-specific information
- Edit profile with avatar upload
- Student: Academic info, courses, graduation year
- Faculty: Department, courses teaching, office hours
- Alumni: Career info, company, position, industry
- LinkedIn and GitHub integration links

### Yearbook System
- Students submit yearbook entries with quote, memory, and future plans
- Admin approval workflow for content moderation
- Grid view of approved entries with filtering by year
- Featured entries section
- Entry status tracking (pending, approved, rejected)

### Search & Discovery
- Real-time search by name and role
- Advanced filtering by graduation year, industry, department
- Quick navigation to profile pages
- Autocomplete suggestions

### Alumni Networking
- Alumni directory with search and filters
- Connection request system between students and alumni
- Connection status tracking (pending, accepted, rejected)
- Network management dashboard
- Optional messages with connection requests

### Admin Dashboard
- User statistics (total users by role)
- Yearbook entry statistics (approved, pending, rejected)
- Connection activity monitoring
- Annual graduation processing tool
- Bulk operations for user management

### User Experience
- Dark/light mode toggle (persisted in localStorage)
- Responsive mobile-first design
- Loading skeletons for async operations
- Toast notifications for user feedback
- Accessible UI with WCAG 2.1 AA compliance
- Smooth animations and transitions

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx              # Main app layout wrapper
│   ├── Navbar.tsx              # Top navigation with search
│   ├── Sidebar.tsx             # Role-aware navigation menu
│   └── ProtectedRoute.tsx       # Auth and role-based route protection
├── lib/
│   ├── supabase.ts             # Supabase client and storage helpers
│   ├── utils.ts                # Utility functions
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── stores/
│       ├── authStore.ts        # Auth state (Zustand)
│       ├── yearbook.ts         # Yearbook state
│       └── connectionStore.ts   # Connections state
├── pages/
│   ├── Login.tsx               # Login page
│   ├── Register.tsx            # Multi-step registration
│   ├── Dashboard.tsx           # Role-specific dashboards
│   ├── Yearbook.tsx            # Yearbook grid & submission
│   ├── Alumni.tsx              # Alumni directory
│   ├── ProfilePage.tsx         # User profile view
│   ├── ProfileEdit.tsx         # Profile edit form
│   ├── Search.tsx              # Global search
│   ├── Admin.tsx               # Admin dashboard
│   └── NotFound.tsx            # 404 page
├── App.tsx                     # Main routing
├── main.tsx                    # React entry point
└── index.css                   # TailwindCSS imports
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project

### Installation

1. **Clone or set up the project**
```bash
cd project
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your [Supabase Dashboard](https://supabase.com/dashboard):
- Go to Settings → API
- Copy the Project URL and anon (public) key

4. **Set up the database**

The database schema is already configured via Supabase migrations. No additional setup needed if you're using the provided Supabase instance.

5. **Create test accounts** (optional)

To create test accounts:
1. Visit the app at `http://localhost:5173`
2. Click "Create one" on the login page
3. Register with the test account details above

Or sign up manually with these roles during registration:
- Student (requires student ID, year of study, graduation year)
- Faculty (requires faculty ID, department, designation)
- Alumni (requires alumni ID, graduation year, degree)

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` directory.

```bash
npm run preview
```

Preview the production build locally.

### Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler to check for type errors.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

## Database Schema

### Tables
- **profiles** - User profiles for all roles
- **students** - Student-specific data
- **faculty** - Faculty-specific data
- **alumni** - Alumni-specific data
- **yearbook_entries** - Student yearbook submissions
- **connections** - Student-alumni networking relationships
- **announcements** - Role-targeted announcements
- **activity_logs** - Admin audit trail

### Row Level Security (RLS)
All tables have RLS enabled with role-based access policies:
- Users can only modify their own data
- Public profiles visible to all authenticated users
- Alumni only visible if `is_visible = true`
- Admin has full access

## Authentication Flow

1. **Registration**: User selects role → fills details → creates account
2. **Login**: Email + password → JWT stored in session
3. **Session**: Auth state persisted via Zustand store
4. **Protected Routes**: Checked before rendering dashboard pages
5. **Logout**: Session cleared, redirected to login

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Database (Supabase)

Supabase is already hosted at:
```
https://your-project.supabase.co
```

No additional deployment needed for database.

### Local Production Build

```bash
npm run build
npm run preview
```

## Security Considerations

- All sensitive data operations use Supabase RLS
- JWT tokens stored securely via Supabase auth
- No credentials exposed in client code
- SQL injection prevented by Supabase prepared statements
- XSS protection via React's default escaping
- CSRF tokens handled by Supabase auth

## Performance Optimizations

- Code splitting via React.lazy for route-level components
- Memoization of expensive renders
- Image optimization via Supabase CDN
- Debounced search input
- Lazy loading of images
- Efficient database queries with proper indexes

## Troubleshooting

### "Supabase environment variables not found"
Make sure `.env` file exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Cannot find module react-router-dom"
Run `npm install` to install all dependencies

### "Build fails with TypeScript errors"
Run `npm run typecheck` to see all type errors, then fix them

### "Dark mode not working"
Make sure `darkMode: 'class'` is set in `tailwind.config.js`

### "Upload fails with storage error"
Verify Supabase storage buckets exist:
- `avatars` - for user profile pictures
- `yearbook-photos` - for yearbook entry photos

Create them manually if missing in Supabase dashboard.

## API Reference

### Auth Store
```typescript
const { signUp, signIn, signOut, checkAuth, profile } = useAuthStore();
```

### Yearbook Store
```typescript
const { fetchEntries, submitEntry, fetchUserEntry } = useYearbookStore();
```

### Connection Store
```typescript
const { fetchConnections, sendConnectionRequest, respondToConnection } = useConnectionStore();
```

## Contributing

Guidelines for contributors:
1. Follow existing code style
2. Use TypeScript for all new code
3. Create feature branches from main
4. Submit PRs with clear descriptions
5. Ensure all tests pass before merging

## License

MIT License - Feel free to use this project for educational purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Supabase documentation
3. Open an issue with clear details

## Roadmap

Future enhancements:
- [ ] Messaging between connected users
- [ ] PDF export of yearbooks
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-file uploads
- [ ] Event calendar integration
- [ ] Alumni mentorship matching
- [ ] Mobile app (React Native)

---

**Built with ❤️ using Vite, React, TypeScript, and Supabase**
