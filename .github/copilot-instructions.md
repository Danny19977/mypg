# TeamOnSite (TOS) AI Development Guide

This guide provides essential context for AI agents working with the TeamOnSite codebase.

## Project Overview

TeamOnSite is a React-based admin dashboard application built on Light Bootstrap Dashboard with added features for GPS tracking, map visualization, and user management. The application follows a component-based architecture with context-based state management.

## Core Architecture

### Authentication
- JWT-based auth flow implemented in `src/contexts/AuthContext.js`
- Token stored in localStorage with automatic status checking
- Protected routes wrapped with `components/ProtectedRoute` component

### API Integration
- Centralized API service in `src/services/apiServices.js`
- Base axios instance configured in `src/services/api.js`
- Error handling standardized with custom error messages

### Maps & Location Features
- Google Maps integration via `src/hooks/useGoogleMap.js`
- Custom distance calculation and marker management
- User location tracking with `useUserLocation` hook
- Map data filtering through `useMapFilters` hook

## Key Development Patterns

1. Custom Hooks Pattern:
   ```javascript
   // Example from useGoogleMap.js
   export const useGoogleMap = (containerRef, data, userLocation) => {
     // Encapsulated map logic with refs for markers
     const mapRef = useRef(null);
     const markersRef = useRef([]);
   };
   ```

2. Context-based State Management:
   ```javascript
   // Use AuthContext for user state
   const { user, isAuthenticated } = useAuth();
   ```

3. API Error Handling:
   ```javascript
   try {
     const response = await api.post('/endpoint', data);
     return response.data;
   } catch (error) {
     throw new Error(`Operation failed: ${error.response?.data?.message || error.message}`);
   }
   ```

## Common Development Tasks

### Adding New API Endpoints
1. Add service method to `apiServices.js`
2. Implement error handling using the standard pattern
3. Use the `api` instance for requests

### Map Feature Development
1. Use `useGoogleMap` hook for map operations
2. Reference `useMapFilters` for data filtering patterns
3. Update marker management through provided refs

### Activity Logging
- Use `useActivityLogger` hook for user action tracking
- Log format defined in `services/userActivityLogger.js`

## Testing & Debugging

Key debugging files:
- `debug-gps-submission.js` - GPS data testing
- `debug-map-markers-api.js` - Map marker debugging
- `test-api-endpoints.js` - API endpoint testing

## Style Guide

The project uses Bootstrap with custom SCSS:
- Core styles in `src/assets/scss/light-bootstrap-dashboard-react.scss`
- Custom component styles in component-level CSS files
- Follow BEM naming convention for custom styles