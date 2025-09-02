# TeamOnSite (TOS) - Token-Based Authentication Setup Guide

## Overview

This document explains the **updated** authentication system implemented for the TeamOnSite frontend that connects to the **token-based** Go Fiber backend API.

## 🔄 **MAJOR UPDATE: Cookie-Based → Token-Based Authentication**

Your backend API has been converted from cookie-based to token-based authentication using JWT tokens.

### Key Changes:
- ❌ **Before**: HTTP-only cookies with `withCredentials: true`
- ✅ **After**: JWT tokens with `Authorization: Bearer <token>` headers
- 🔐 **Token Storage**: localStorage (72-hour expiration)
- 🔗 **Login Endpoint**: `/login` (was `/auth/login`)

## Authentication Flow

### 1. Backend API Structure (Updated)
Your backend (`tos-api`) now uses:
- **JWT tokens** stored in **localStorage** (client-side)
- **Authorization Bearer headers** for all authenticated requests  
- **Email or Phone** login (identifier field)
- **Routes**: `/login`, `/auth/logout`, `/auth/user`
- **Token Expiration**: 72 hours (3 days)

### 2. Frontend Implementation (Updated)

#### Key Components:

1. **Login Page** (`src/views/Login.js`)
   - Clean, responsive login form
   - Supports email or phone login
   - **NEW**: Stores JWT token in localStorage
   - Real-time error handling

2. **Authentication Context** (`src/contexts/AuthContext.js`)
   - Global authentication state management
   - **NEW**: Token-based login/logout functions
   - **NEW**: Token validation and expiry handling
   - User data management

3. **Protected Routes** (`src/components/ProtectedRoute/ProtectedRoute.js`)
   - Prevents unauthorized access to admin pages
   - **NEW**: Checks for valid JWT token
   - Redirects to login when token is missing/expired

4. **API Configuration** (`src/services/api.js`)
   - **NEW**: Automatic `Authorization: Bearer <token>` headers
   - **REMOVED**: Cookie support (`withCredentials: false`)
   - Automatic error handling for 401 responses
   - Debug logging for development

5. **Auth Services** (`src/services/apiServices.js`)
   - **UPDATED**: `login()` now stores JWT token in localStorage
   - **UPDATED**: `logout()` removes token from localStorage
   - **UPDATED**: All API calls use Bearer token authentication

#### Key Features:

- **JWT Token Storage**: Secure client-side storage with 72-hour expiration
- **Bearer Authentication**: All API requests include `Authorization: Bearer <token>`
- **Automatic Token Validation**: Invalid/expired tokens trigger logout
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during API calls
- **Responsive Design**: Works on all device sizes

## File Structure

```
src/
├── views/
│   └── Login.js                    # Login page component
├── layouts/
│   └── Auth.js                     # Layout for auth pages
├── contexts/
│   └── AuthContext.js              # Authentication context
├── components/
│   └── ProtectedRoute/
│       └── ProtectedRoute.js       # Route protection
├── services/
│   ├── api.js                      # Axios configuration
│   └── apiServices.js              # API service functions
└── assets/
    └── css/
        └── login.css               # Login page styles
```

## How It Works

### 1. User Login Process:
```
1. User enters email/phone + password
2. Frontend sends POST to /login
3. Backend validates credentials  
4. Backend returns JWT token in response
5. Frontend stores token in localStorage
6. Frontend redirects to dashboard
```

### 2. Authentication Checking:
```
1. App loads → AuthContext checks for stored token
2. If token exists → calls /user to verify and get user data
3. All requests include Authorization: Bearer <token>
4. If token invalid → logout and redirect to login
```

### 3. Logout Process:
```
1. User clicks logout
2. Frontend removes token from localStorage
3. Frontend clears user data from context
4. Frontend redirects to login
```

### 4. Request Authentication:
```
Every API request automatically includes:
Authorization: Bearer <jwt_token>
```

## Backend Requirements

Your Go backend must:

1. **Accept this login format**:
```json
{
  "identifier": "user@example.com",  // or phone number
  "password": "userpassword"
}
```

2. **Return JWT token in response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

3. **Accept Authorization headers**:
```
Authorization: Bearer <jwt_token>
```

4. **Enable CORS**:
```go
app.Use(cors.New(cors.Config{
    AllowOrigins: []string{"http://localhost:3000"},
    AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
    AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
}))
```

5. **Middleware for protected routes**:
```go
// Verify JWT token in Authorization header
func AuthMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        token := c.Get("Authorization")
        if token == "" {
            return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
        }
        
        // Remove "Bearer " prefix
        token = strings.TrimPrefix(token, "Bearer ")
        
        // Validate JWT token
        // ... token validation logic
        
        return c.Next()
    }
}
```

## Environment Configuration

Update `.env` file:
```env
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_API_TIMEOUT=10000
REACT_APP_DEBUG_API=true
```

## Running the Application

1. **Start Backend**:
```bash
cd backend
go run main.go
# Should run on http://localhost:8080
```

2. **Start Frontend**:
```bash
npm start
# Should run on http://localhost:3000
```

3. **Test Login**:
   - Navigate to http://localhost:3000
   - Should redirect to login page
   - Enter valid credentials
   - Should redirect to dashboard

## Security Features

1. **JWT Token Storage**: Tokens stored in localStorage with 72-hour expiration
2. **Bearer Authentication**: All requests use Authorization headers
3. **Automatic Token Cleanup**: Invalid tokens are automatically removed
4. **CORS Configuration**: Proper headers for cross-origin requests
5. **Token Validation**: Frontend validates token format and existence

## Testing Your Authentication

### Test Login:
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "email": "test@example.com" }
}
```

### Test Protected Route:
```bash
curl -X GET http://localhost:8080/user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues:

1. **"Network Error"**:
   - Check if backend is running on port 8080
   - Verify CORS configuration allows frontend origin

2. **"Invalid token"**:
   - Token may be expired (72-hour limit)
   - Check token format in localStorage
   - Verify Authorization header format

3. **Login redirects to login**:
   - Check if token is stored in localStorage
   - Verify backend `/user` endpoint is working
   - Check browser console for errors

### Debug Tips:

1. **Check localStorage**:
```javascript
// In browser console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

2. **Monitor Network Tab**:
   - Check if Authorization headers are sent
   - Verify response status codes
   - Look for CORS errors

3. **Backend Logs**:
   - Enable debug logging in Go backend
   - Check JWT token validation
   - Verify middleware execution
4. **Protected Routes**: Blocks unauthorized access
5. **Input Validation**: Client-side validation before API calls

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure backend allows credentials
   - Check origin URL matches exactly

2. **Login Not Working**:
   - Check backend API endpoint
   - Verify request/response format
   - Check browser network tab

## API Integration Examples

### Frontend API Calls:

```javascript
// Login user
const response = await authService.login({
  identifier: 'user@example.com',
  password: 'password123'
});

// Get current user (requires token)
const user = await authService.getAuthUser();

// Make authenticated API call
const data = await api.get('/some-protected-endpoint');
```

### Backend Route Examples:

```go
// Public route - no auth required
app.Post("/login", loginHandler)

// Protected routes - require JWT token
protected := app.Group("/", AuthMiddleware())
protected.Get("/user", getUserHandler)
protected.Get("/dashboard", dashboardHandler)
```

## Next Steps

Consider implementing:
1. **Token Refresh** mechanism
2. **Forgot Password** functionality  
3. **Registration** page
4. **Remember Me** option
5. **Role-based access control**
6. **Session management** improvements

## Migration Summary

This authentication system has been **updated from cookie-based to token-based** authentication:

### What Changed:
- ❌ HTTP-only cookies → ✅ JWT tokens in localStorage
- ❌ `withCredentials: true` → ✅ `Authorization: Bearer <token>`
- ❌ `/auth/login` endpoint → ✅ `/login` endpoint
- ❌ Automatic cookie handling → ✅ Manual token management

### Benefits:
- ✅ Better mobile app support
- ✅ Stateless server architecture
- ✅ Easier API testing
- ✅ Cross-domain compatibility
- ✅ Explicit token control
