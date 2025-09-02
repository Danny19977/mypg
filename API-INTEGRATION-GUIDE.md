# TOS Frontend - API Integration Guide

## 📖 Overview

This guide explains how your React frontend connects to your Go backend API. The connection allows your frontend to:
- Fetch data from the backend database
- Send new data to be saved
- Update existing records
- Delete records
- Handle real-time updates

## 🏗️ API Connection Architecture

```
Frontend (React)  ←→  Backend (Go)  ←→  Database
     ↓                    ↓                ↓
- User Interface    - API Endpoints    - Data Storage
- API Calls         - Business Logic   - PostgreSQL/MySQL
- State Management  - Authentication   - Data Validation
```

## 📁 Project Structure

```
src/
├── services/           # API connection files
│   ├── api.js         # Main API configuration
│   └── apiServices.js # Specific API functions
├── hooks/             # Custom React hooks
│   └── useApi.js      # Reusable API hooks
├── views/             # Your page components
│   ├── Dashboard.js
│   ├── PresenceList.js
│   ├── Country.js
│   └── ...
└── .env               # Environment configuration
```

## 🔧 Setup Instructions

### 1. Environment Configuration

Update your `.env` file with your Go backend URL:

```env
# Change this to match your Go backend server
REACT_APP_API_BASE_URL=http://localhost:8080/api

# If your Go server runs on a different port:
# REACT_APP_API_BASE_URL=http://localhost:3001/api
# REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### 2. Start Your Go Backend

Make sure your Go backend server is running first:

```bash
# Navigate to your Go backend project
cd path/to/your/go/backend

# Run the server (adjust command as needed)
go run main.go
# or
./your-backend-executable
```

### 3. Start Your React Frontend

```bash
# In your React project directory
npm start
```

## 🔌 How API Connections Work

### Step 1: API Configuration (`src/services/api.js`)

This file sets up the basic connection to your Go backend:

```javascript
// Creates a connection to your Go server
const api = axios.create({
  baseURL: 'http://localhost:8080/api',  // Your Go server URL
  timeout: 10000,                        // 10 second timeout
  headers: {
    'Content-Type': 'application/json'   // Send/receive JSON data
  }
});
```

### Step 2: API Services (`src/services/apiServices.js`)

This file contains functions for each type of data operation:

```javascript
// Get all presences from the backend
export const presenceService = {
  getAll: async () => {
    const response = await api.get('/presences');
    return response.data;
  }
};
```

This translates to: `GET http://localhost:8080/api/presences`

### Step 3: React Hooks (`src/hooks/useApi.js`)

These make it easy to use API calls in your React components:

```javascript
// Use this hook in any component to get presence data
export const usePresences = () => {
  return useApi(presenceService.getAll);
};
```

### Step 4: Using in Components (`src/views/PresenceList.js`)

Your React components use the hooks to get and display data:

```javascript
function PresenceList() {
  // This automatically fetches data from your Go backend
  const { data: presences, loading, error } = usePresences();

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {presences?.map(presence => (
        <div key={presence.id}>{presence.name}</div>
      ))}
    </div>
  );
}
```

## 📊 Available API Services

### Presence Management
- `GET /presences` - Get all presence records
- `POST /presences` - Create new presence
- `PUT /presences/:id` - Update presence
- `DELETE /presences/:id` - Delete presence

### Territory Management
- `GET /countries` - Get all countries
- `POST /countries` - Create new country
- `GET /provinces` - Get all provinces
- `GET /areas` - Get all areas

### Activity Tracking
- `GET /activities` - Get all activities
- `GET /activities?start=date&end=date` - Get activities by date range

### Sales Management
- `GET /sales` - Get all sales records
- `POST /sales` - Create new sale

### Dashboard Data
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/recent-activities` - Get recent activities

## 🎯 Example: Adding a New Feature

Let's say you want to add a "Users" feature:

### 1. Add API Service Function

In `src/services/apiServices.js`:

```javascript
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  }
};
```

### 2. Add React Hook

In `src/hooks/useApi.js`:

```javascript
export const useUsers = () => {
  return useApi(userService.getAll);
};
```

### 3. Use in Component

```javascript
import { useUsers } from "../hooks/useApi";

function UserList() {
  const { data: users, loading, error } = useUsers();

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## 🔍 Debugging API Issues

### Check Browser Network Tab
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Reload your page
4. Look for API calls to see if they're working

### Common Issues & Solutions

**1. Connection Refused Error**
- ❌ Problem: Your Go backend is not running
- ✅ Solution: Start your Go server first

**2. 404 Not Found**
- ❌ Problem: API endpoint doesn't exist in Go backend
- ✅ Solution: Check your Go routes match the frontend calls

**3. CORS Errors**
- ❌ Problem: Cross-Origin Resource Sharing not configured
- ✅ Solution: Add CORS middleware to your Go backend

**4. Data Not Showing**
- ❌ Problem: API returns different data structure than expected
- ✅ Solution: Check console logs and adjust data mapping

## 🧪 Testing Your API Connection

### Test 1: Check API Response

Open browser console and run:

```javascript
fetch('http://localhost:8080/api/presences')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Test 2: Use Network Tab

1. Open Developer Tools → Network tab
2. Refresh your page
3. Look for API calls and their responses

## 🚀 Go Backend Requirements

Your Go backend should have these endpoints (adjust as needed):

```go
// Example Go routes (adjust to match your actual backend)
router.GET("/api/presences", getPresences)
router.POST("/api/presences", createPresence)
router.PUT("/api/presences/:id", updatePresence)
router.DELETE("/api/presences/:id", deletePresence)

router.GET("/api/countries", getCountries)
router.POST("/api/countries", createCountry)

router.GET("/api/dashboard/stats", getDashboardStats)
```

## 📝 Next Steps

1. **Start your Go backend server**
2. **Update the API URL** in `.env` if needed
3. **Test the connection** using browser Developer Tools
4. **Customize the API services** to match your actual Go backend endpoints
5. **Add authentication** if your backend requires it

## 🔐 Adding Authentication (Optional)

If your Go backend requires authentication:

1. **Store token after login:**
```javascript
localStorage.setItem('authToken', 'your-jwt-token');
```

2. **Token is automatically added** to all API calls (already configured)

3. **Handle token expiration** (already configured to clear token on 401 errors)

## 🎨 UI States Handled

Each component automatically handles:
- **Loading state**: Shows spinner while fetching data
- **Error state**: Shows error message if API fails
- **Empty state**: Shows message when no data found
- **Success state**: Shows data when available

This makes your app user-friendly and professional!

---

**Need Help?** Check the browser console for detailed error messages and API call logs.
