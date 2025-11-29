# Authentication System Setup

## Overview

The authentication system allows users to register, log in, and maintain persistent sessions across the Game Hub. User data (username, email, avatar) is saved and automatically loaded when joining games.

## Visual Layout

### HubLayout Sidebar (Authenticated User)

When a user is logged in, the sidebar displays:

```
┌─────────────────────────────────┐
│ Game Hub                        │
├─────────────────────────────────┤
│ All Games                       │
│ Trivia Blitz                    │
│ Canva                           │
│ ...                             │
├─────────────────────────────────┤
│ [Avatar] Username               │ ← User Profile Dropdown
│           user@email.com        │
└─────────────────────────────────┘
```

**User Profile Dropdown Menu:**
- **My Account** (header)
- **Customize Avatar** - Opens avatar customizer
- **Logout** - Signs out the user

### HubLayout Sidebar (Not Authenticated)

When no user is logged in:

```
┌─────────────────────────────────┐
│ Game Hub                        │
├─────────────────────────────────┤
│ All Games                       │
│ Trivia Blitz                    │
│ ...                             │
├─────────────────────────────────┤
│ [Sign In Button]                │ ← Login button
│                                 │
│ [Avatar] Guest Name             │ ← Guest avatar customizer
│           Customize avatar      │
└─────────────────────────────────┘
```

## Pages

### Login Page (`/login`)

**Layout:**
```
┌─────────────────────────────┐
│     Welcome Back            │
│  Sign in to your account    │
├─────────────────────────────┤
│ 📧 Email                    │
│ [________________]          │
│                             │
│ 🔒 Password                 │
│ [________________]          │
│                             │
│ [Sign In Button]            │
│                             │
│ Don't have an account?      │
│ Sign up                     │
└─────────────────────────────┘
```

### Register Page (`/register`)

**Layout:**
```
┌─────────────────────────────┐
│   Create Account            │
│ Sign up to start playing    │
├─────────────────────────────┤
│ 📧 Email                    │
│ [________________]          │
│                             │
│ 👤 Username                 │
│ [________________]          │
│                             │
│ 🔒 Password                 │
│ [________________]          │
│                             │
│ 🔒 Confirm Password         │
│ [________________]          │
│                             │
│ [Sign Up Button]            │
│                             │
│ Already have an account?    │
│ Sign in                     │
└─────────────────────────────┘
```

## Integration with Games

### Game Lobbies

When authenticated, game lobbies automatically:

1. **Auto-fill Username** - The player name field is pre-filled with the user's username
2. **Load Avatar** - The user's saved avatar configuration is automatically loaded

**Example (Trivia Blitz Lobby):**
```
┌─────────────────────────────┐
│ Trivia Blitz                 │
├─────────────────────────────┤
│ Your Name                    │
│ [username (pre-filled)]     │ ← Auto-filled from account
│                             │
│ [Create/Join Room]           │
└─────────────────────────────┘
```

## Architecture

### Backend

**Database Schema:**
- `User` model in Prisma with:
  - `id` (UUID)
  - `email` (unique)
  - `username` (unique)
  - `password` (hashed with bcrypt)
  - `avatarConfig` (JSON string, optional)
  - `createdAt`, `updatedAt`

**API Endpoints:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Sign out

**Security:**
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for session management
- Token stored in localStorage
- Protected routes use Bearer token authentication

### Frontend

**Components:**
- `AuthContext` (`src/contexts/AuthContext.tsx`) - Manages auth state
- `Login` page (`src/pages/Login.tsx`) - Login form
- `Register` page (`src/pages/Register.tsx`) - Registration form
- `HubLayout` - Shows user profile when authenticated

**State Management:**
- React Query for data fetching and caching
- Token persisted in localStorage
- User data cached for 5 minutes
- Automatic token refresh on page load

## Routing Behavior

### Root Route (`/`)

The root route automatically redirects users based on authentication status:

- **Unauthenticated users** → Redirected to `/login`
- **Authenticated users** → Redirected to `/hub` (Game Hub)

This ensures that unregistered users always see the login page upon landing, while registered users are taken directly to the game hub.

### Protected Routes

All game hub routes (`/hub/*`) are protected and require authentication. Users attempting to access these routes without being logged in will be redirected to `/login`.

### Public Routes

- `/login` - Login page (redirects to `/hub` if already authenticated)
- `/register` - Registration page (redirects to `/hub` if already authenticated)

## User Flow

### Registration Flow

```
1. User clicks "Sign In" → Navigate to /login
2. User clicks "Sign up" → Navigate to /register
3. User fills form (email, username, password)
4. On submit → POST /api/auth/register
5. Server creates user, returns JWT token
6. Token saved to localStorage
7. User data loaded and displayed in sidebar
8. Redirect to game hub (/hub)
```

### Login Flow

```
1. User lands on site → Redirected to /login (if not authenticated)
2. User enters email and password
3. On submit → POST /api/auth/login
4. Server validates credentials, returns JWT token
5. Token saved to localStorage
6. User data loaded and displayed in sidebar
7. Redirect to game hub (/hub)
```

### Root Route Behavior

```
1. User visits "/" (root)
2. System checks authentication status
3. If authenticated → Redirect to /hub (Game Hub)
4. If not authenticated → Redirect to /login
```

### Game Integration Flow

```
1. User navigates to game lobby (e.g., Trivia Blitz)
2. Lobby checks if user is authenticated
3. If authenticated:
   - Username field auto-filled
   - Avatar config loaded from user account
4. User can still modify name/avatar if desired
5. User creates/joins room with their data
```

## File Structure

### Backend Files

```
backend/
├── prisma/
│   └── schema.prisma          # User model definition
├── src/
│   ├── auth/
│   │   ├── routes.js          # API endpoints
│   │   ├── utils.js           # Password hashing, JWT
│   │   └── logger.js          # Logging utility
│   └── db/
│       └── prisma.js          # Prisma client instance
└── package.json               # Dependencies: bcryptjs, jsonwebtoken
```

### Frontend Files

```
src/
├── contexts/
│   └── AuthContext.tsx        # Auth state management
├── pages/
│   ├── Login.tsx              # Login page
│   └── Register.tsx           # Registration page
├── components/
│   ├── HubLayout.tsx          # User profile in sidebar
│   └── ProtectedRoute.tsx     # Route protection wrapper
└── config/
    └── api.ts                 # API base URL configuration
```

## Environment Variables

### Backend

```env
# Optional - defaults provided
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
DATABASE_URL=file:./data/rooms.db
```

### Frontend

```env
# Optional - defaults to http://localhost:3001
VITE_API_BASE_URL=http://localhost:3001
```

## Setup Instructions

### 1. Database Setup

```bash
cd backend
npm run prisma:generate    # Generate Prisma client
npm run prisma:db:push     # Create/update database schema
```

### 2. Install Dependencies

```bash
# Backend dependencies already installed:
# - bcryptjs
# - jsonwebtoken

# Frontend dependencies already included:
# - @tanstack/react-query
# - react-router-dom
```

### 3. Start Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

## Features

✅ **User Registration** - Create account with email, username, password  
✅ **User Login** - Sign in with email and password  
✅ **Session Persistence** - Token saved in localStorage  
✅ **Auto-fill Game Data** - Username and avatar loaded in game lobbies  
✅ **Avatar Persistence** - Avatar config saved to user account  
✅ **Protected Routes** - Optional route protection component  
✅ **Error Handling** - Graceful handling of network errors  
✅ **Token Refresh** - Automatic user data refresh on page load  

## Troubleshooting

### User Profile Disappears

**Issue:** User profile shows briefly then disappears when server connects.

**Solution:** The authentication system now:
- Keeps cached user data even if API call fails
- Only clears user data on explicit 401 Unauthorized
- Doesn't refetch on socket connection
- Shows loading state during initial fetch

### API Connection Errors

**Issue:** Cannot connect to authentication API.

**Check:**
1. Backend server is running on correct port (default: 3001)
2. `VITE_API_BASE_URL` matches backend URL
3. CORS is configured correctly in backend
4. Database migration has been run

### Database Errors

**Issue:** User registration/login fails with database error.

**Solution:**
```bash
cd backend
npm run prisma:generate
npm run prisma:db:push
```

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Social login (Google, GitHub)
- [ ] User profile page
- [ ] Account settings
- [ ] Password change
- [ ] Avatar sync across devices

