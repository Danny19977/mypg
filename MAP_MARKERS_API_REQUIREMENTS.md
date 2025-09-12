# Map Markers API Requirements

This document outlines the API endpoints needed to support the map markers functionality that displays visite_data information grouped by visite_harder_uuid.

## Required Endpoints

### 1. Get Map Markers Data (Basic)

**Endpoint:** `GET /visite-data/map-markers`

**Description:** Returns map marker data with text_value, latitude, longitude, and related information grouped by visite_harder_uuid.

**Query Parameters:** None (returns all data)

**Expected Response Format:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "visite_harder_uuid": "uuid-12345-67890",
      "text_value": "Store Visit - Product Display Check",
      "latitude": -4.330819,
      "longitude": 15.344838,
      "created_at": "2024-01-15 14:30:25",
      "entry_order": 1,
      "user_uuid": "user-uuid-123",
      "user_name": "John Doe",
      "area_uuid": "area-uuid-456",
      "area_name": "Kinshasa Central",
      "province_uuid": "province-uuid-789",
      "province_name": "Kinshasa",
      "country_uuid": "country-uuid-101",
      "country_name": "DRC",
      "email": "john.doe@example.com",
      "number_value": 100
    }
  ]
}
```

### 2. Get Map Markers Data (Filtered)

**Endpoint:** `GET /visite-data/map-markers`

**Description:** Returns filtered map marker data based on query parameters.

**Query Parameters:**
- `user_uuid` (optional): Filter by specific user
- `country_uuid` (optional): Filter by country
- `province_uuid` (optional): Filter by province  
- `area_uuid` (optional): Filter by area
- `date_from` (optional): Start date filter (YYYY-MM-DD format)
- `date_to` (optional): End date filter (YYYY-MM-DD format)
- `limit` (optional): Limit number of results

**Example Request:**
```
GET /visite-data/map-markers?user_uuid=user-123&date_from=2024-01-01&date_to=2024-01-31&limit=100
```

**Expected Response:** Same format as basic endpoint, but filtered results.

## Database Requirements

### Required Fields from visite_data table:
- `id` - Entry ID
- `visite_harder_uuid` - Visit session identifier (for grouping)
- `text_value` - Main text content to display in markers
- `latitude` - GPS latitude coordinate
- `longitude` - GPS longitude coordinate
- `created_at` - Formatted as 'YYYY-MM-DD HH:MM:SS'
- `entry_order` - Order of entry within the visit
- `user_uuid` - User who created the entry
- `area_uuid` - Area reference
- `province_uuid` - Province reference
- `country_uuid` - Country reference
- `number_value` - Numeric value (optional)
- `email` - User email (optional)

### Required Joins:
- Join with `users` table for `user_name`
- Join with `areas` table for `area_name`
- Join with `provinces` table for `province_name`
- Join with `countries` table for `country_name`

### Data Requirements:
1. **Ordering:** Results must be ordered by `created_at DESC`
2. **Filtering:** Only include records where:
   - `latitude IS NOT NULL`
   - `longitude IS NOT NULL`
   - `text_value IS NOT NULL AND text_value != ''`
3. **Grouping:** Data should be logically grouped by `visite_harder_uuid`
4. **Date Formatting:** `created_at` should be formatted as 'YYYY-MM-DD HH:MM:SS'

## SQL Query Example

```sql
SELECT 
    vd.id,
    vd.visite_harder_uuid,
    vd.text_value,
    vd.latitude,
    vd.longitude,
    DATE_FORMAT(vd.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
    vd.entry_order,
    vd.user_uuid,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    vd.area_uuid,
    a.name as area_name,
    vd.province_uuid,
    p.name as province_name,
    vd.country_uuid,
    c.name as country_name,
    u.email,
    vd.number_value
FROM visite_data vd
LEFT JOIN users u ON vd.user_uuid = u.uuid
LEFT JOIN areas a ON vd.area_uuid = a.uuid
LEFT JOIN provinces p ON vd.province_uuid = p.uuid
LEFT JOIN countries c ON vd.country_uuid = c.uuid
WHERE vd.latitude IS NOT NULL 
    AND vd.longitude IS NOT NULL 
    AND vd.text_value IS NOT NULL 
    AND vd.text_value != ''
    -- Add date filters if provided
    -- AND DATE(vd.created_at) >= ? 
    -- AND DATE(vd.created_at) <= ?
ORDER BY vd.created_at DESC
-- LIMIT ? if limit parameter provided
```

## Frontend Integration

The frontend is already updated to consume these endpoints:

1. **API Service:** `visiteDataService.getMapMarkersData()` and `visiteDataService.getMapMarkersDataFiltered(filters)`
2. **Data Hook:** `useVisiteData()` hook updated to fetch map markers data
3. **Map Display:** `useGoogleMap()` hook updated to display markers grouped by visite_harder_uuid
4. **Info Windows:** Enhanced to prominently display text_value content

## Map Marker Features

1. **Grouping:** Markers are visually grouped by visite_harder_uuid with consistent colors
2. **Labels:** Markers show visit numbers (1, 2, 3...) and sub-entry numbers (1.1, 1.2...) if multiple entries per visit
3. **Info Windows:** Display text_value prominently with additional visit details
4. **Filtering:** Support date range and territory-based filtering
5. **Real-time:** Auto-refresh capability for live data updates

## Testing

Mock data is provided in the frontend for testing when the backend endpoints are not yet available. The system will automatically fall back to mock data if the API calls fail.
