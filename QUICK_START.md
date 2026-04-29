# DTCY Quick Start Guide

Get the Digital Tech-Connect Yearbook running in 5 minutes!

## Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

## Step 2: Start Development Server (10 seconds)
```bash
npm run dev
```

The app will open at: **http://localhost:5173**

## Step 3: Login with Test Account (1 minute)

Choose any test account:
```
Email:    student@dtcy.com
Password: Student@123
```

**Other test accounts:**
- Faculty: `faculty@dtcy.com` / `Faculty@123`
- Alumni: `alumni@dtcy.com` / `Alumni@123`
- Admin: `admin@dtcy.com` / `Admin@123`

## Step 4: Explore Features (3 minutes)

### As a Student
1. Go to **Dashboard** - See quick links to yearbook and alumni network
2. Go to **Yearbook** → **Add Entry** - Submit your yearbook entry
3. Go to **Alumni** - Browse alumni and send connection requests
4. Go to **Search** - Search for other users
5. Go to **Profile** - Edit your profile and upload avatar

### As Faculty
1. Go to **Dashboard** - See student overview
2. Go to **Yearbook** - View submitted entries (pending approval shown to faculty)
3. Go to **Search** - Find students in your classes

### As Alumni
1. Go to **Dashboard** - Check network activity
2. Go to **Alumni** - Browse other alumni with similar interests
3. Go to **Profile** - Update your career information

### As Admin
1. Go to **Admin Panel** - View user and yearbook statistics
2. Use **Process Graduations** tool to graduate students automatically
3. Manage content and users

## Features at a Glance

| Feature | Status |
|---------|--------|
| User Registration | ✅ Working |
| Login/Logout | ✅ Working |
| Profile Management | ✅ Working |
| Avatar Upload | ✅ Working |
| Yearbook Entries | ✅ Working |
| Alumni Directory | ✅ Working |
| Connections/Networking | ✅ Working |
| Search | ✅ Working |
| Dark Mode | ✅ Working |
| Admin Dashboard | ✅ Working |
| Responsive Design | ✅ Working |

## Troubleshooting

### App won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Styles not loading
```bash
# Rebuild Tailwind CSS
npm run dev
```

### Storage/Upload errors
The app requires two Supabase storage buckets:
1. `avatars` - for profile pictures
2. `yearbook-photos` - for yearbook photos

These are automatically configured if using the provided Supabase project.

## Next Steps

1. **Read the full README** for deployment and advanced features
2. **Create your own account** at `/register` page
3. **Try all roles** using test accounts to understand different features
4. **Deploy to production** when ready (see README.md)

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run typecheck    # Check TypeScript
```

## Need Help?

1. Check **README.md** for detailed documentation
2. Review **IMPLEMENTATION_SUMMARY.md** for architecture details
3. Check **src/** folder structure for code examples

## Keyboard Shortcuts (Planned)

Future enhancements will include:
- `Cmd/Ctrl + K` - Open search
- `Cmd/Ctrl + /` - Toggle dark mode
- `Escape` - Close modals

---

**Happy exploring! 🎓**
