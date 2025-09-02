# User Activity Logging System

## Overview

The User Activity Logging System is a comprehensive solution for tracking and monitoring user activities across the TeamOnSite (TOS) application. This system automatically logs user actions, system events, and provides a detailed audit trail for security and compliance purposes.

## Features

### ✅ Frontend Implementation
- ✅ **Automatic Page View Logging**: Tracks when users visit different pages
- ✅ **Authentication Logging**: Logs login/logout activities
- ✅ **CRUD Operations Logging**: Tracks create, read, update, delete operations
- ✅ **Search & Filter Logging**: Records user search activities
- ✅ **Form Interaction Logging**: Monitors form submissions and validation errors
- ✅ **Error & Warning Logging**: Captures system errors and warnings

### ✅ Backend Implementation
- ✅ **Activity Logger Utility**: Server-side logging with database integration
- ✅ **Authentication Event Logging**: Tracks login attempts, successes, and failures
- ✅ **CRUD Event Logging**: Logs entity creation, updates, and deletions
- ✅ **API Call Logging**: Records API endpoint access and responses

### ✅ User Interface Improvements
- ✅ **Removed Actions Column**: Simplified table by removing the Actions column
- ✅ **Arrow-based Pagination**: Replaced traditional pagination with intuitive arrow navigation
- ✅ **Click-to-View Details**: Table rows are now clickable to view log details
- ✅ **Enhanced Styling**: Improved visual design with hover effects and smooth transitions

## Architecture

### Frontend Components

#### 1. User Activity Logger Service (`src/services/userActivityLogger.js`)
- Main logging service class
- Handles queuing and batch processing of logs
- Provides methods for different types of activities

#### 2. Activity Logging Hooks (`src/hooks/useActivityLogger.js`)
- React hooks for automatic logging integration
- Provides convenient methods for components
- Handles authentication state checking

#### 3. Updated User Logs Page (`src/views/UserLogs.js`)
- Enhanced pagination with arrow navigation
- Clickable rows for detailed view
- Automatic search logging

### Backend Components

#### 1. Activity Logger Utility (`backend/utils/activityLogger.go`)
- Server-side logging functionality
- Database integration for log storage
- Various logging methods for different event types

#### 2. Enhanced Auth Controller (`backend/controller/auth/authController.go`)
- Login/logout activity logging
- Failed attempt tracking
- Security event monitoring

## Usage Guide

### Frontend Usage

#### 1. Page View Logging
```javascript
import { usePageViewLogger } from '../hooks/useActivityLogger';

function MyComponent() {
  // Automatically logs when user visits this page
  usePageViewLogger('Dashboard', { 
    description: 'User accessed the main dashboard' 
  });
  
  return <div>...</div>;
}
```

#### 2. CRUD Operations Logging
```javascript
import { useCrudLogger } from '../hooks/useActivityLogger';

function UserManagement() {
  const { logCreate, logUpdate, logDelete } = useCrudLogger();
  
  const handleCreateUser = async (userData) => {
    const response = await userService.create(userData);
    // Log the creation
    logCreate('user', userData.fullname, response.uuid);
  };
  
  return <div>...</div>;
}
```

#### 3. Search Logging
```javascript
import { useSearchLogger } from '../hooks/useActivityLogger';

function SearchComponent() {
  const { logSearch } = useSearchLogger();
  
  const handleSearch = (searchTerm) => {
    // Perform search
    const results = performSearch(searchTerm);
    // Log the search activity
    logSearch(searchTerm, 'users', results.length);
  };
  
  return <div>...</div>;
}
```

#### 4. Form Logging
```javascript
import { useFormLogger } from '../hooks/useActivityLogger';

function UserForm() {
  const { logFormSubmit, logFormValidationError } = useFormLogger('user_creation');
  
  const handleSubmit = async (formData) => {
    try {
      await submitForm(formData);
      logFormSubmit('create', formData);
    } catch (errors) {
      logFormValidationError(errors);
    }
  };
  
  return <div>...</div>;
}
```

### Backend Usage

#### 1. Manual Activity Logging
```go
import "github.com/Danny19977/tos-api/utils"

func CreateUser(c *fiber.Ctx) error {
    // ... user creation logic ...
    
    // Log the creation
    utils.LogCreateWithDB(database.DB, c, "user", user.Fullname, user.UUID)
    
    return c.JSON(response)
}
```

#### 2. Error Logging
```go
func SomeController(c *fiber.Ctx) error {
    // ... some logic ...
    
    if err != nil {
        // Log the error
        utils.LogErrorWithDB(database.DB, c, "validation_error", err.Error(), map[string]interface{}{
            "context": "user_creation",
            "user_input": userData,
        })
        return c.Status(400).JSON(errorResponse)
    }
    
    return c.JSON(response)
}
```

## Database Schema

The user activity logs are stored in the `user_logs` table with the following structure:

```sql
CREATE TABLE user_logs (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    user_uuid VARCHAR(255),
    signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Log Types and Actions

### Action Types
- **LOGIN**: User authentication events
- **LOGOUT**: User session termination
- **CREATE**: Entity creation events
- **UPDATE**: Entity modification events
- **DELETE**: Entity deletion events
- **VIEW**: Page/resource access events
- **SEARCH**: Search operation events
- **EXPORT**: Data export events
- **IMPORT**: Data import events
- **ERROR**: System error events
- **WARNING**: System warning events
- **API_CALL**: API endpoint access events

### Log Names Convention
- `user_login`: User login event
- `user_logout`: User logout event
- `create_{entity}`: Entity creation (e.g., `create_user`, `create_country`)
- `update_{entity}`: Entity update (e.g., `update_user`, `update_province`)
- `delete_{entity}`: Entity deletion (e.g., `delete_user`, `delete_area`)
- `view_{page}`: Page view (e.g., `view_dashboard`, `view_user_management`)
- `search_{entity}`: Search operation (e.g., `search_users`, `search_provinces`)

## User Interface Features

### Enhanced User Logs Page

#### 1. Arrow-based Pagination
- **First Page**: Double left arrow (`<<`)
- **Previous Page**: Single left arrow (`<`)
- **Next Page**: Single right arrow (`>`)
- **Last Page**: Double right arrow (`>>`)
- **Current Page Display**: Shows "X / Y" format

#### 2. Clickable Table Rows
- Click any row to view detailed log information
- Hover effects for better user experience
- Smooth animations and transitions

#### 3. Improved Search
- Automatic logging of search activities
- Real-time search with backend pagination
- Enhanced search summary display

#### 4. Responsive Design
- Mobile-friendly pagination controls
- Adaptive table layout for smaller screens
- Touch-friendly interface elements

## Security Features

### 1. Signature Generation
Each log entry includes a cryptographic signature for integrity verification.

### 2. User Context Tracking
- IP address logging
- Browser/User agent tracking
- Session duration monitoring

### 3. Error Activity Logging
- Failed login attempts
- Unauthorized access attempts
- System errors and exceptions

## Performance Considerations

### 1. Async Logging
- Frontend logs are queued and processed asynchronously
- Non-blocking operation for better user experience

### 2. Batch Processing
- Multiple logs can be processed in batches
- Automatic retry mechanism for failed logs

### 3. Database Optimization
- Indexed fields for faster queries
- Pagination support for large datasets
- Efficient search capabilities

## Troubleshooting

### Common Issues

#### 1. Logs Not Appearing
- **Check Authentication**: Ensure user is logged in
- **Verify Token**: Check if JWT token is valid
- **Network Connectivity**: Ensure API endpoints are accessible

#### 2. Performance Issues
- **Log Queue Size**: Monitor queued logs in browser console
- **Database Performance**: Check database logs for slow queries
- **Network Latency**: Monitor API response times

#### 3. Frontend Integration
- **Hook Usage**: Ensure hooks are used within authenticated components
- **Context Provider**: Verify AuthProvider wraps the component tree
- **Import Statements**: Check correct import paths

## Future Enhancements

### Planned Features
1. **Real-time Notifications**: Live updates for critical events
2. **Advanced Filtering**: Date ranges, user roles, action types
3. **Export Functionality**: CSV/PDF export of log data
4. **Analytics Dashboard**: Visual charts and statistics
5. **Automated Alerts**: Email/SMS notifications for security events

### Performance Improvements
1. **Log Compression**: Compress older log entries
2. **Archive System**: Move old logs to separate storage
3. **Caching Layer**: Redis cache for frequently accessed logs
4. **Background Jobs**: Queue system for heavy logging operations

## Configuration

### Frontend Configuration
```javascript
// src/services/userActivityLogger.js
// Enable/disable logging
userActivityLogger.setEnabled(true);

// Configure queue processing
const logger = new UserActivityLogger();
logger.maxQueueSize = 50;
logger.batchSize = 10;
```

### Backend Configuration
```go
// backend/utils/activityLogger.go
// Configure log retention
const LOG_RETENTION_DAYS = 90

// Configure batch size
const BATCH_LOG_SIZE = 100
```

## Testing

### Frontend Tests
```bash
# Run frontend tests
npm test -- --testPathPattern=userActivityLogger
npm test -- --testPathPattern=useActivityLogger
```

### Backend Tests
```bash
# Run backend tests
go test ./utils -v -run TestActivityLogger
go test ./controller/auth -v -run TestLoginLogging
```

## Conclusion

The User Activity Logging System provides comprehensive tracking and monitoring capabilities for the TeamOnSite application. With its automatic logging features, enhanced user interface, and robust backend integration, it ensures complete visibility into user activities while maintaining optimal performance and security.

For additional support or feature requests, please refer to the main project documentation or contact the development team.
