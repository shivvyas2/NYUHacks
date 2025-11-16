# Authentication with Supabase

This backend uses **Supabase Authentication** for all user authentication operations. Supabase handles user management, password hashing, JWT token generation, and session management.

## How It Works

### 1. User Signup
- Uses `supabase.auth.sign_up()` to create new users
- Supabase automatically:
  - Hashes passwords securely
  - Creates user records in `auth.users` table
  - Sends verification emails (if enabled)
  - Returns user information

### 2. User Login
- Uses `supabase.auth.sign_in_with_password()` to authenticate users
- Supabase returns:
  - `access_token` - JWT token for API authentication
  - `refresh_token` - Token for refreshing the access token
  - `user` - User information (id, email, etc.)

### 3. Token Verification
- Uses `supabase.auth.get_user(token)` to verify JWT tokens
- Supabase validates:
  - Token signature
  - Token expiration
  - User existence
- Returns user information if token is valid

### 4. User Logout
- Uses `supabase.auth.sign_out()` to invalidate the session
- Clears the session on the Supabase side

## Token Flow

1. **Frontend** → User logs in → Gets `access_token` from FastAPI
2. **Frontend** → Stores token in localStorage
3. **Frontend** → Sends token in `Authorization: Bearer <token>` header
4. **FastAPI** → Verifies token with Supabase → Returns user data
5. **FastAPI** → Uses user ID for database operations

## Environment Variables

Required in `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For database operations
# OR
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key      # For auth operations
```

## Security Notes

- **Service Role Key**: Has full access, bypasses RLS. Use for admin operations.
- **Anon Key**: Respects RLS policies. Use for user-facing operations.
- **JWT Tokens**: Supabase generates secure JWT tokens that expire automatically
- **Password Hashing**: Supabase handles password hashing automatically (bcrypt)

## API Endpoints

All authentication endpoints use Supabase:

- `POST /api/auth/signup` - Creates user via Supabase
- `POST /api/auth/login` - Authenticates via Supabase, returns JWT token
- `POST /api/auth/logout` - Invalidates session via Supabase
- `GET /api/auth/me` - Verifies token via Supabase, returns user info

## Database Integration

- User IDs from Supabase Auth (`auth.users`) are used as foreign keys
- Row Level Security (RLS) policies use `auth.uid()` to filter by user
- All database operations respect the authenticated user's permissions

