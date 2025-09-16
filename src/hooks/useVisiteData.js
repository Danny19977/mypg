import { useState, useEffect, useCallback } from 'react';
import { visiteDataService } from '../services/apiServices';

export const useVisiteData = (dateRange) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching visite data from backend...");
      
      // Fetch both markers and images data in parallel
      console.log('🔄 Starting parallel data fetch...');
      const [markersResponse, imagesResponse] = await Promise.all([
        visiteDataService.getMapMarkersData(),
        visiteDataService.getMapImagesData()
      ]);
      
      console.log('✨ All data fetched:', {
        markersStatus: markersResponse?.status,
        markersCount: markersResponse?.data?.length || 0,
        sampleMarker: markersResponse?.data?.[0],
        allFields: markersResponse?.data?.[0] ? Object.keys(markersResponse.data[0]) : [],
        textValues: markersResponse?.data?.slice(0, 3).map(item => ({
          id: item.id,
          text_value: item.text_value,
          typeof_text: typeof item.text_value
        }))
      });
      
      let response = markersResponse;
      
      // Images are now directly in the response with their coordinates
      console.log('🖼️ Raw images response:', imagesResponse);
      
      // Create a map of image arrays keyed by coordinates
      const imageMap = {};
      if (imagesResponse?.status === 'success' && imagesResponse.data) {
        imagesResponse.data.forEach(img => {
          const key = `${img.latitude},${img.longitude}`;
          imageMap[key] = img.file_url; // file_url is already an array
          console.log(`📸 Mapping images for location ${key}:`, img.file_url);
        });
      }
      console.log('📍 Image location map:', imageMap);
      
      if (response.status === 'success' && response.data?.length > 0) {
        console.log(`✅ Successfully fetched ${response.data.length} map marker records from API`);
        
        console.log('🔍 Raw response data sample:', response.data.slice(0, 3));

        let validData = response.data.filter(item => {
          // Log any items that have text_value to see its structure
          if (item.text_value) {
            console.log('📝 Found item with text_value:', {
              id: item.id,
              text_value: item.text_value,
              type: typeof item.text_value,
              tableInfo: 'from visite_data table',
              otherFields: {
                visite_harder_uuid: item.visite_harder_uuid,
                form_field_id: item.form_field_id,
                form_submission_id: item.form_submission_id
              }
            });
          }
          
          return item.latitude !== null && 
                 item.longitude !== null && 
                 !isNaN(parseFloat(item.latitude)) && 
                 !isNaN(parseFloat(item.longitude)) &&
                 item.text_value && // Ensure we have text_value for marker display
                 item.latitude !== 0 && // Exclude zero coordinates
                 item.longitude !== 0;
        }).map(item => {
          console.log('� Processing item:', {
            id: item.id,
            text_value: item.text_value,
            type: typeof item.text_value,
            keys: Object.keys(item)
          });
          // Merge image URLs into marker data using coordinates as key
          const key = `${item.latitude},${item.longitude}`;
          if (imageMap[key]) {
            console.log(`🎯 Found images for marker at ${key}:`, imageMap[key]);
            return {
              ...item,
              images: imageMap[key] // Array of image URLs
            };
          }
          console.log(`❌ No images found for marker at ${key}`);
          return item;
        });

        // Apply date filtering on frontend if dateRange is provided
        if (dateRange && dateRange.startDate && dateRange.endDate) {
          const startDate = dateRange.startDate.toISOString().split('T')[0];
          const endDate = dateRange.endDate.toISOString().split('T')[0];
          
          validData = validData.filter(item => {
            if (!item.created_at) return true; // Include items without dates
            const itemDate = item.created_at.split(' ')[0]; // Extract date part from "YYYY-MM-DD HH:MM:SS"
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          console.log(`📅 Filtered to ${validData.length} records for date range: ${startDate} to ${endDate}`);
        }
        
        console.log(`📍 ${validData.length} records have valid coordinates and text_value`);
        
        // Attach images to the corresponding markers
        validData = validData.map(item => ({
          ...item,
          image_url: imageMap[item.visite_harder_uuid] || null
        }));
        
        setData(validData);
      } else {
        console.log("⚠️ No data returned from API or empty data array");
        setData([]);
      }
      
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('❌ Error fetching visite map markers data:', err);
      setError(err.message);
      console.log("❌ Setting empty data due to error");
      setData([]);
      setLastRefreshTime(new Date());
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastRefreshTime,
    refetch: fetchData
  };
};
