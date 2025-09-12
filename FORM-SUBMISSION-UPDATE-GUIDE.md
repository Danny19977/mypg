# FormSubmissions Component Update Documentation

## Overview
This document outlines the updates made to the FormSubmissions component to work with the updated backend API structure from https://github.com/Danny19977/mypg-api.git.

## Key Changes Made

### 1. Updated Form Submission Process

#### Before (Old Structure)
- Single API call to create form submission with responses
- Used `form_submission_uuid` field name
- Limited GPS coordinate handling
- Individual response submission only

#### After (New Structure)
- Two-step submission process:
  1. Create `VisiteHarder` (form submission instance)
  2. Create multiple `VisiteData` (individual field responses)
- Uses correct backend field names: `visite_harder_uuid`
- Enhanced GPS coordinate handling with validation
- Bulk response submission support with fallback to individual submission

### 2. Updated API Field Mappings

| Frontend Field | Old Backend Field | New Backend Field | Type |
|---------------|------------------|------------------|------|
| Form Submission UUID | `form_submission_uuid` | `visite_harder_uuid` | String |
| User Name | `user?.name` | `user?.fullname` | String |
| Latitude | `latitude` | `latitude` | DECIMAL(10,8) |
| Longitude | `longitude` | `longitude` | DECIMAL(11,8) |
| Entry Label | N/A | `entry_label` | String |
| Entry Order | N/A | `entry_order` | Integer |

### 3. Enhanced GPS Coordinate Handling

#### Improved Auto-Population
- More comprehensive pattern matching for GPS fields
- Support for French language field names
- Combined coordinate field support
- Better validation and error handling

#### GPS Field Detection Patterns
```javascript
// Latitude patterns
'latitude', 'lat ', 'lat.', 'coordonnée latitude', 'coord lat',
'géolocalisation lat', 'position lat'

// Longitude patterns  
'longitude', 'lng ', 'lng.', 'long ', 'long.', 
'coordonnée longitude', 'coord lng', 'géolocalisation lng', 'position lng'

// Combined GPS patterns
'coordonnées', 'coordinates', 'géolocalisation', 'gps', 'position géographique'
```

### 4. Updated Backend Integration

#### New API Endpoints Used
- `POST /public/form-submissions` - Create form submission (VisiteHarder)
- `POST /public/form-responses/bulk` - Bulk create responses (VisiteData)
- `POST /public/form-responses` - Individual response creation (fallback)

#### Data Structure for Bulk Submission
```javascript
{
  "visite_harder_uuid": "submission-uuid",
  "responses": [
    {
      "visite_harder_uuid": "submission-uuid",
      "form_item_uuid": "field-uuid",
      "text_value": "response text",
      "number_value": 123.45,
      "boolean_value": true,
      "date_value": "2024-01-01",
      "file_url": "path/to/file",
      "entry_order": 1,
      "entry_label": "Field Label",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "user_uuid": "user-uuid",
      "country_uuid": "country-uuid",
      "province_uuid": "province-uuid", 
      "area_uuid": "area-uuid"
    }
  ]
}
```

### 5. Conditional Fields Handling

#### Enhanced Processing
- Better handling of conditional field UUIDs
- Proper mapping of parent-child relationships
- Improved entry labeling for conditional responses

#### Conditional Field ID Format
```javascript
// Original: parentUuid_selectedValue_fieldId
// Maps to: parentUuid with entry_label for identification
```

### 6. Error Handling and Fallbacks

#### Bulk Submission with Fallback
1. Attempt bulk submission via `/public/form-responses/bulk`
2. If bulk fails, fallback to individual submissions
3. Continue processing even if some responses fail
4. Detailed logging for debugging

#### GPS Coordinate Validation
- Validates latitude range: -90 to 90 degrees
- Validates longitude range: -180 to 180 degrees
- Proper type checking and NaN validation
- Graceful handling of missing GPS data

### 7. Updated API Services

#### FormSubmissionService Updates
- Added `submitBulkResponses()` method
- Updated endpoint URLs to match backend structure
- Enhanced error handling

#### FormResponseService Updates  
- Added bulk submission support
- Updated field mappings
- Better error messages

## Database Schema Alignment

### VisiteHarder Table (Form Submissions)
```sql
CREATE TABLE visite_harder (
    uuid VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    submitter_name VARCHAR(255),
    submitter_email VARCHAR(255),
    form_uuid VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255),
    country_uuid VARCHAR(255),
    province_uuid VARCHAR(255),
    area_uuid VARCHAR(255),
    signature TEXT,
    status VARCHAR(50) DEFAULT 'submitted'
);
```

### VisiteData Table (Field Responses)
```sql
CREATE TABLE visite_data (
    uuid VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    visite_harder_uuid VARCHAR(255) NOT NULL,
    form_item_uuid VARCHAR(255) NOT NULL,
    text_value TEXT,
    number_value DECIMAL(15,8),
    boolean_value BOOLEAN,
    date_value DATE,
    file_url TEXT,
    entry_order INTEGER DEFAULT 1,
    entry_label VARCHAR(255),
    sub_item_id VARCHAR(255),
    parent_entry_id VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    user_uuid VARCHAR(255),
    country_uuid VARCHAR(255),
    province_uuid VARCHAR(255),
    area_uuid VARCHAR(255),
    signature TEXT
);
```

## Testing

### Test Script
A test script `test-form-submission.js` has been created to verify the API integration:

```bash
node test-form-submission.js
```

### Manual Testing Steps
1. Load form in FormSubmissions component
2. Fill out form fields (including GPS-related fields)
3. Submit form
4. Verify submission creation in backend
5. Verify response creation in backend
6. Check GPS coordinate auto-population

## Configuration

### Environment Variables
Update `.env` file to point to correct backend API:
```properties
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### Backend Requirements
- Go backend API from https://github.com/Danny19977/mypg-api.git
- PostgreSQL database with updated schema
- CORS configuration allowing frontend origin

## Migration Notes

### For Existing Data
- No migration needed for existing form structures
- New fields are optional and backward compatible
- GPS coordinates will be auto-captured for new submissions

### For Developers
1. Update local backend to latest version from GitHub repo
2. Run database migrations if any
3. Update environment variables
4. Test form submission flow
5. Verify GPS coordinate handling

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend allows frontend origin
2. **Authentication Errors**: Verify JWT token handling
3. **GPS Not Working**: Check browser permissions and HTTPS requirements
4. **Field Mapping Errors**: Verify form item UUIDs exist in database

### Debug Mode
Enable API debugging in `.env`:
```properties
REACT_APP_DEBUG_API=true
```

This will log all API requests and responses to browser console.

## Future Enhancements

### Potential Improvements
1. Real-time form validation
2. File upload progress tracking
3. Offline form submission support
4. Form analytics and reporting
5. Multi-language support for GPS field detection

### Backend Feature Requests
1. Form template versioning
2. Conditional field rule engine
3. Advanced GPS coordinate validation
4. Bulk form import/export
5. Real-time collaboration features
