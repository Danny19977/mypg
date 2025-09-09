import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Alert,
  Input,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import { 
  formService,
  formItemService,
  formSubmissionService,
  formResponseService
} from '../services/apiServices';
import { useAuth } from '../contexts/AuthContext';

const FormSubmissions = () => {
  const { user } = useAuth(); // Get authenticated user
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formItems, setFormItems] = useState([]);
  const [responses, setResponses] = useState({});
  const [conditionallyVisibleFields, setConditionallyVisibleFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [gpsCoordinates, setGpsCoordinates] = useState({ latitude: null, longitude: null });
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle', 'requesting', 'success', 'error'
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [currentCameraItemUuid, setCurrentCameraItemUuid] = useState(null);

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  // Load form items when a form is selected
  useEffect(() => {
    if (selectedForm) {
      loadFormData();
    }
  }, [selectedForm]);

  // Initialize conditional field visibility when form items change
  useEffect(() => {
    if (formItems.length > 0) {
      initializeConditionalFieldVisibility();
      
      // Auto-populate GPS fields if coordinates are already available
      if (gpsStatus === 'success' && gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null) {
        autoPopulateGPSFields(gpsCoordinates.latitude, gpsCoordinates.longitude);
      }
    }
  }, [formItems, gpsStatus, gpsCoordinates]);

  // Request GPS coordinates when form is loaded
  useEffect(() => {
    if (selectedForm && formItems.length > 0) {
      requestGPSCoordinates();
    }
  }, [selectedForm, formItems]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const requestGPSCoordinates = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setGpsStatus('requesting');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('🌍 Raw GPS coordinates:', { latitude, longitude });
        setGpsCoordinates({
          latitude: latitude,
          longitude: longitude
        });
        setGpsStatus('success');
        console.log('🌍 GPS coordinates stored:', { 
          latitude: latitude, 
          longitude: longitude 
        });
        
        // Auto-populate any existing latitude/longitude form fields
        if (formItems.length > 0) {
          autoPopulateGPSFields(latitude, longitude);
        }
      },
      (error) => {
        setGpsStatus('error');
        console.warn('Error getting GPS coordinates:', error.message);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.warn('User denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            console.warn('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            console.warn('The request to get user location timed out.');
            break;
          default:
            console.warn('An unknown error occurred.');
            break;
        }
      },
      options
    );
  };

  const initializeConditionalFieldVisibility = () => {
    const initialVisibility = {};
    
    formItems.forEach(item => {
      if (item.item_type === 'select' && item.conditional_fields) {
        try {
          const conditionalFields = JSON.parse(item.conditional_fields || '{}');
          Object.keys(conditionalFields).forEach(optionValue => {
            if (conditionalFields[optionValue]) {
              conditionalFields[optionValue].forEach(field => {
                initialVisibility[`${item.uuid}_${optionValue}_${field.id}`] = false;
              });
            }
          });
        } catch (error) {
          console.warn('Error initializing conditional fields for item:', item.uuid, error);
        }
      }
    });
    
    setConditionallyVisibleFields(initialVisibility);
  };

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
        // Auto-select "Visite" form if it exists
        const visiteForm = response.data.find(form => 
          form.title && form.title.toLowerCase().includes('visite')
        );
        if (visiteForm) {
          setSelectedForm(visiteForm);
        } else if (response.data.length > 0) {
          setSelectedForm(response.data[0]);
        }
      }
    } catch (error) {
      setError('Failed to load forms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    if (!selectedForm) return;
    
    try {
      setLoading(true);
      
      // Load form items
      const itemsResponse = await formItemService.getByForm(selectedForm.uuid);
      
      if (itemsResponse.status === 'success') {
        const items = itemsResponse.data.sort((a, b) => a.sort_order - b.sort_order);
        setFormItems(items);
        
        // Log conditional fields for debugging
        console.log('📋 Loaded form items with conditional fields:', items.map(item => ({
          uuid: item.uuid,
          question: item.question,
          type: item.item_type,
          hasConditionalFields: !!item.conditional_fields,
          conditionalFieldsLength: item.conditional_fields ? Object.keys(JSON.parse(item.conditional_fields || '{}')).length : 0
        })));
        
        // Initialize responses and conditional fields
        setResponses({});
        setConditionallyVisibleFields({});
        setValidationErrors({});
      }
    } catch (error) {
      setError('Failed to load form items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (itemUuid, value, valueType = 'text') => {
    setResponses(prev => ({
      ...prev,
      [itemUuid]: {
        value,
        valueType,
        form_item_uuid: itemUuid
      }
    }));

    // Clear validation error for this field
    if (validationErrors[itemUuid]) {
      setValidationErrors(prev => ({
        ...prev,
        [itemUuid]: null
      }));
    }

    // Update conditional field visibility for dropdown fields
    const item = formItems.find(item => item.uuid === itemUuid);
    if (item && item.item_type === 'select' && item.conditional_fields) {
      updateConditionalFieldVisibility(item, value);
    }
  };

  // Auto-populate GPS coordinate fields in the form
  const autoPopulateGPSFields = (latitude, longitude) => {
    console.log('🌍 Auto-populating GPS fields with:', { latitude, longitude });
    
    formItems.forEach(item => {
      if (item.question) {
        const question = item.question.toLowerCase();
        
        // Check for latitude fields
        if (question.includes('latitude') || question.includes('lat') || 
            question.includes('coordonnée latitude') || question.includes('coord lat')) {
          console.log(`📍 Found latitude field: ${item.question} (${item.uuid})`);
          handleInputChange(item.uuid, latitude, 'number');
        }
        
        // Check for longitude fields  
        if (question.includes('longitude') || question.includes('lng') || 
            question.includes('long') || question.includes('coordonnée longitude') || 
            question.includes('coord lng')) {
          console.log(`📍 Found longitude field: ${item.question} (${item.uuid})`);
          handleInputChange(item.uuid, longitude, 'number');
        }
      }
    });
  };

  const updateConditionalFieldVisibility = (item, selectedValue) => {
    console.log('🔍 Updating conditional field visibility:', {
      itemUuid: item.uuid,
      selectedValue,
      conditionalFields: item.conditional_fields
    });
    
    try {
      const conditionalFields = JSON.parse(item.conditional_fields || '{}');
      console.log('📝 Parsed conditional fields:', conditionalFields);
      
      setConditionallyVisibleFields(prev => {
        const newVisibleFields = { ...prev };
        
        // Hide all conditional fields for this item first
        Object.keys(conditionalFields).forEach(optionValue => {
          if (conditionalFields[optionValue]) {
            conditionalFields[optionValue].forEach(field => {
              const fieldKey = `${item.uuid}_${optionValue}_${field.id}`;
              newVisibleFields[fieldKey] = false;
              console.log(`🙈 Hiding field: ${fieldKey}`);
            });
          }
        });
        
        // Show conditional fields for the selected value
        if (selectedValue && conditionalFields[selectedValue]) {
          conditionalFields[selectedValue].forEach(field => {
            const fieldKey = `${item.uuid}_${selectedValue}_${field.id}`;
            newVisibleFields[fieldKey] = true;
            console.log(`👁️ Showing field: ${fieldKey}`, field);
          });
        }
        
        console.log('🎯 Final visible fields state:', newVisibleFields);
        return newVisibleFields;
      });
    } catch (error) {
      console.warn('Error processing conditional fields:', error);
    }
  };

  // Camera handling functions
  const handleCameraCapture = (itemUuid) => {
    setCurrentCameraItemUuid(itemUuid);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera for form submissions
        audio: false 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Error accessing camera. Please allow camera access or check that your camera is working.');
    }
  };

  const capturePhoto = () => {
    if (cameraStream && currentCameraItemUuid) {
      const video = document.getElementById('camera-video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        // Create a unique filename for the captured image
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `camera_${timestamp}.jpg`;
        
        // For camera type, we store the file URL in file_url column
        handleInputChange(currentCameraItemUuid, filename, 'file_url');
        
        // In a real application, you would upload the blob to a server here
        console.log('Camera photo captured:', {
          blob,
          filename,
          itemUuid: currentCameraItemUuid,
          size: blob.size,
          type: blob.type
        });
        
        // You could also create a preview URL if needed
        // const previewUrl = URL.createObjectURL(blob);
        // console.log('Preview URL:', previewUrl);
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCurrentCameraItemUuid(null);
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate main form items
    formItems.forEach(item => {
      if (item.required) {
        const response = responses[item.uuid];
        if (!response || !response.value || response.value.toString().trim() === '') {
          errors[item.uuid] = 'This field is required';
        }
      }
    });

    // Validate conditional fields that are currently visible
    formItems.forEach(item => {
      if (item.item_type === 'select' && item.conditional_fields) {
        try {
          const conditionalFields = JSON.parse(item.conditional_fields || '{}');
          const selectedValue = responses[item.uuid]?.value;
          
          if (selectedValue && conditionalFields[selectedValue]) {
            conditionalFields[selectedValue].forEach(field => {
              const fieldKey = `${item.uuid}_${selectedValue}_${field.id}`;
              const isVisible = conditionallyVisibleFields[fieldKey];
              const response = responses[fieldKey];
              
              if (isVisible && field.required && (!response || !response.value || response.value.toString().trim() === '')) {
                errors[fieldKey] = 'This field is required';
              }
            });
          }
        } catch (error) {
          console.warn('Error validating conditional fields:', error);
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Debug GPS coordinates
      console.log('🌍 GPS Coordinates before submission:', gpsCoordinates);
      console.log('🌍 GPS Status:', gpsStatus);
      
      // Create submission with all required UUIDs and GPS coordinates
      const submissionData = {
        form_uuid: selectedForm.uuid,
        submitter_name: user?.name || 'Form Viewer',
        submitter_email: user?.email || 'user@example.com',
        status: 'submitted',
        // Include user information if available
        ...(user?.uuid && { user_uuid: user.uuid }),
        ...(user?.country_uuid && { country_uuid: user.country_uuid }),
        ...(user?.province_uuid && { province_uuid: user.province_uuid }),
        ...(user?.area_uuid && { area_uuid: user.area_uuid }),
        // Add GPS coordinates if available
        ...(gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && 
            typeof gpsCoordinates.latitude === 'number' && typeof gpsCoordinates.longitude === 'number' && 
            !isNaN(gpsCoordinates.latitude) && !isNaN(gpsCoordinates.longitude) && {
          latitude: gpsCoordinates.latitude,
          longitude: gpsCoordinates.longitude
        })
      };

      console.log('📝 Submitting form with data:', submissionData);
      console.log('🌍 GPS included in submission:', {
        hasLatitude: !!submissionData.latitude,
        hasLongitude: !!submissionData.longitude,
        latitude: submissionData.latitude,
        longitude: submissionData.longitude
      });

      const submissionResponse = await formSubmissionService.create(submissionData);
      console.log('📝 Form submission response:', submissionResponse);
      
      if (submissionResponse.status === 'success') {
        const submissionUuid = submissionResponse.data.uuid;
        
        // Create responses for both main fields and conditional fields
        for (const [itemUuid, responseData] of Object.entries(responses)) {
          if (responseData.value !== null && responseData.value !== undefined && responseData.value.toString().trim() !== '') {
            const responsePayload = {
              form_submission_uuid: submissionUuid
            };

            // Handle conditional fields vs regular fields
            if (itemUuid.includes('_')) {
              // This is a conditional field - extract the parent item UUID
              const parts = itemUuid.split('_');
              if (parts.length >= 3) {
                // Format: parentUuid_selectedValue_fieldId
                const parentUuid = parts[0];
                const fieldId = parts[parts.length - 1];
                
                // For conditional fields, we create a virtual form_item_uuid
                // The backend should handle this appropriately
                responsePayload.form_item_uuid = `${parentUuid}_conditional_${fieldId}`;
                console.log('🔗 Conditional field mapping:', {
                  originalKey: itemUuid,
                  parentUuid,
                  fieldId,
                  mappedUuid: responsePayload.form_item_uuid
                });
              } else {
                responsePayload.form_item_uuid = itemUuid;
              }
            } else {
              // Regular form item
              responsePayload.form_item_uuid = itemUuid;
            }

            // Set the appropriate value field based on type with proper type conversion
            const value = responseData.value;
            switch (responseData.valueType) {
              case 'number':
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  responsePayload.number_value = numValue;
                } else {
                  console.warn(`Invalid number value for ${itemUuid}:`, value);
                  responsePayload.text_value = value.toString();
                }
                break;
              case 'boolean':
                // Handle various boolean representations
                if (typeof value === 'boolean') {
                  responsePayload.boolean_value = value;
                } else if (typeof value === 'string') {
                  responsePayload.boolean_value = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
                } else {
                  responsePayload.boolean_value = Boolean(value);
                }
                break;
              case 'date':
                // Ensure proper date format
                if (value instanceof Date) {
                  responsePayload.date_value = value.toISOString().split('T')[0];
                } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                  responsePayload.date_value = value;
                } else {
                  console.warn(`Invalid date value for ${itemUuid}:`, value);
                  responsePayload.text_value = value.toString();
                }
                break;
              case 'file_url':
                // For camera and file uploads, store in file_url column
                responsePayload.file_url = value.toString();
                break;
              default:
                responsePayload.text_value = value.toString();
            }

            console.log('💾 Saving response:', {
              itemUuid,
              responsePayload,
              originalValue: value,
              valueType: responseData.valueType
            });

            try {
              const responseResult = await formResponseService.create(responsePayload);
              console.log('✅ Response saved successfully:', responseResult);
            } catch (error) {
              console.error(`❌ Failed to save response for ${itemUuid}:`, error);
              // Continue with other responses even if one fails
            }
          }
        }

        // Auto-submit GPS coordinates as form responses if available
        if (gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && 
            typeof gpsCoordinates.latitude === 'number' && typeof gpsCoordinates.longitude === 'number' && 
            !isNaN(gpsCoordinates.latitude) && !isNaN(gpsCoordinates.longitude)) {
          
          console.log('🌍 Adding GPS coordinates as automatic form responses');
          console.log('🌍 Current GPS coordinates:', gpsCoordinates);
          console.log('🌍 Available form items:', formItems.map(item => ({ uuid: item.uuid, question: item.question })));
          
          // Check if there are existing latitude/longitude form items
          const latitudeItem = formItems.find(item => 
            item.question && (
              item.question.toLowerCase().includes('latitude') || 
              item.question.toLowerCase().includes('lat') ||
              item.question.toLowerCase().includes('coordonnée latitude') ||
              item.question.toLowerCase().includes('coord lat')
            )
          );
          
          const longitudeItem = formItems.find(item => 
            item.question && (
              item.question.toLowerCase().includes('longitude') || 
              item.question.toLowerCase().includes('lng') ||
              item.question.toLowerCase().includes('long') ||
              item.question.toLowerCase().includes('coordonnée longitude') ||
              item.question.toLowerCase().includes('coord lng')
            )
          );

          console.log('🌍 Found latitude item:', latitudeItem);
          console.log('🌍 Found longitude item:', longitudeItem);

          // Only create responses for existing form fields to avoid database errors
          // Create latitude response if field exists
          if (latitudeItem) {
            try {
              const latitudeResponse = {
                form_submission_uuid: submissionUuid,
                form_item_uuid: latitudeItem.uuid,
                number_value: gpsCoordinates.latitude,
                submission_order: latitudeItem.sort_order || 9998
              };
              console.log('🌍 About to save latitude response:', latitudeResponse);
              const latitudeResult = await formResponseService.create(latitudeResponse);
              console.log('✅ Latitude response saved successfully:', {
                value: gpsCoordinates.latitude,
                itemType: 'existing_item',
                itemUuid: latitudeResponse.form_item_uuid,
                result: latitudeResult
              });
            } catch (error) {
              console.error('❌ Failed to save latitude response:', error);
              console.error('❌ Error details:', error.message);
              console.error('❌ Error response:', error.response?.data);
            }
          } else {
            console.log('📍 No latitude form field found, skipping latitude response creation');
          }

          // Create longitude response if field exists
          if (longitudeItem) {
            try {
              const longitudeResponse = {
                form_submission_uuid: submissionUuid,
                form_item_uuid: longitudeItem.uuid,
                number_value: gpsCoordinates.longitude,
                submission_order: longitudeItem.sort_order || 9999
              };
              console.log('🌍 About to save longitude response:', longitudeResponse);
              const longitudeResult = await formResponseService.create(longitudeResponse);
              console.log('✅ Longitude response saved successfully:', {
                value: gpsCoordinates.longitude,
                itemType: 'existing_item',
                itemUuid: longitudeResponse.form_item_uuid,
                result: longitudeResult
              });
            } catch (error) {
              console.error('❌ Failed to save longitude response:', error);
              console.error('❌ Error details:', error.message);
              console.error('❌ Error response:', error.response?.data);
            }
          } else {
            console.log('📍 No longitude form field found, skipping longitude response creation');
          }

          // If no GPS fields were found, try creating special GPS metadata responses
          if (!latitudeItem && !longitudeItem) {
            console.log('🌍 No GPS form fields found, attempting to save GPS as metadata responses');
            
            try {
              // Try to save GPS coordinates as special metadata responses
              const gpsMetadataResponse = {
                form_submission_uuid: submissionUuid,
                form_item_uuid: `gps_coordinates_${submissionUuid}`, // Unique identifier
                text_value: `lat:${gpsCoordinates.latitude},lng:${gpsCoordinates.longitude}`,
                submission_order: 9999
              };
              console.log('🌍 Attempting to save GPS metadata:', gpsMetadataResponse);
              const gpsResult = await formResponseService.create(gpsMetadataResponse);
              console.log('✅ GPS metadata saved successfully:', gpsResult);
            } catch (error) {
              console.error('❌ Failed to save GPS metadata:', error);
              console.error('❌ This suggests the backend requires valid form_item_uuid values');
            }
          }
        } else {
          console.log('🌍 GPS coordinates not available for auto-submission:', {
            latitude: gpsCoordinates.latitude,
            longitude: gpsCoordinates.longitude,
            latitudeType: typeof gpsCoordinates.latitude,
            longitudeType: typeof gpsCoordinates.longitude,
            latitudeIsNaN: isNaN(gpsCoordinates.latitude),
            longitudeIsNaN: isNaN(gpsCoordinates.longitude)
          });
        }

        setSuccess('Form submitted successfully!');
        setResponses({});
        setConditionallyVisibleFields({});
        setValidationErrors({});
        
        // Reset GPS coordinates for next submission
        setGpsCoordinates({ latitude: null, longitude: null });
        setGpsStatus('idle');
        
        // Re-request GPS for next submission
        setTimeout(() => {
          requestGPSCoordinates();
        }, 1000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('Failed to submit form: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldOptions = (item) => {
    if (!item.options || !['select', 'radio', 'checkbox'].includes(item.item_type)) {
      return [];
    }
    return item.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
  };

  const renderFormField = (item) => {
    const options = getFieldOptions(item);
    const response = responses[item.uuid];
    const value = response?.value || '';
    const hasError = validationErrors[item.uuid];

    switch (item.item_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );

      case 'textarea':
        return (
          <Input
            type="textarea"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
            rows="3"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'number')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'date')}
            invalid={!!hasError}
          />
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleInputChange(item.uuid, file.name, 'file_url');
                // Note: In a real application, you'd want to handle file upload properly
                console.log('File selected:', file);
              }
            }}
            invalid={!!hasError}
            accept="*/*"
          />
        );

      case 'select':
        return (
          <div>
            <Input
              type="select"
              value={value}
              onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
              invalid={!!hasError}
            >
              <option value="">Select an option</option>
              {options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </Input>
            
            {/* Render conditional fields if they exist and an option is selected */}
            {value && item.conditional_fields && renderConditionalFields(item, value)}
          </div>
        );

      case 'radio':
        return (
          <div>
            {options.map((option, index) => (
              <FormGroup check key={index} className="mb-2">
                <Label check>
                  <Input
                    type="radio"
                    name={item.uuid}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
                  />
                  <span className="ms-2">{option}</span>
                </Label>
              </FormGroup>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            {options.map((option, index) => {
              const currentValues = value ? value.split(',').map(v => v.trim()) : [];
              return (
                <FormGroup check key={index} className="mb-2">
                  <Label check>
                    <Input
                      type="checkbox"
                      value={option}
                      checked={currentValues.includes(option)}
                      onChange={(e) => {
                        let newValues;
                        
                        if (e.target.checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter(v => v !== option);
                        }
                        
                        handleInputChange(item.uuid, newValues.join(','), 'text');
                      }}
                    />
                    <span className="ms-2">{option}</span>
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );

      case 'boolean':
        return (
          <div>
            <FormGroup check className="mb-2">
              <Label check>
                <Input
                  type="radio"
                  name={item.uuid}
                  value="true"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleInputChange(item.uuid, true, 'boolean')}
                />
                <span className="ms-2">Yes</span>
              </Label>
            </FormGroup>
            <FormGroup check className="mb-2">
              <Label check>
                <Input
                  type="radio"
                  name={item.uuid}
                  value="false"
                  checked={value === 'false' || value === false}
                  onChange={(e) => handleInputChange(item.uuid, false, 'boolean')}
                />
                <span className="ms-2">No</span>
              </Label>
            </FormGroup>
          </div>
        );

      case 'camera':
        return (
          <div>
            <Button
              color="primary"
              onClick={() => handleCameraCapture(item.uuid)}
              className="mb-2 me-2"
            >
              📷 Take Photo
            </Button>
            {value && (
              <div className="mt-2">
                <small className="text-success">Photo captured: {value}</small>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );
    }
  };

  const renderConditionalFields = (parentItem, selectedValue) => {
    try {
      const conditionalFields = JSON.parse(parentItem.conditional_fields || '{}');
      
      console.log('🎭 Rendering conditional fields for:', {
        parentItemUuid: parentItem.uuid,
        selectedValue,
        availableOptions: Object.keys(conditionalFields),
        fieldsForValue: conditionalFields[selectedValue]
      });
      
      if (!conditionalFields[selectedValue] || !Array.isArray(conditionalFields[selectedValue])) {
        console.log('❌ No conditional fields found for value:', selectedValue);
        return null;
      }

      const fieldsToShow = conditionalFields[selectedValue];
      if (fieldsToShow.length === 0) {
        console.log('📭 Empty conditional fields array for value:', selectedValue);
        return null;
      }

      return (
        <div className="mt-3 p-3 border rounded bg-light">
          <h6 className="mb-3 text-primary">
            <i className="fa fa-plus-circle me-2"></i>
            Additional Questions for "{selectedValue}"
            <small className="text-muted ms-2">({fieldsToShow.length} field{fieldsToShow.length !== 1 ? 's' : ''})</small>
          </h6>
          {fieldsToShow.map((field) => {
            const fieldKey = `${parentItem.uuid}_${selectedValue}_${field.id}`;
            const isVisible = conditionallyVisibleFields[fieldKey];
            const response = responses[fieldKey];
            const value = response?.value || '';
            const hasError = validationErrors[fieldKey];

            console.log('🎨 Rendering conditional field:', {
              fieldKey,
              field,
              isVisible,
              hasValue: !!value
            });

            if (!isVisible) {
              console.log('🙈 Field not visible:', fieldKey);
              return null;
            }

            return (
              <div key={fieldKey} className="mb-3">
                <Label className="fw-bold">
                  {field.label}
                  {field.required && <span className="text-danger"> *</span>}
                  <small className="text-muted ms-2">({field.type})</small>
                </Label>
                
                {renderConditionalField(field, fieldKey, value, hasError)}
                
                {hasError && (
                  <div className="text-danger mt-1">
                    <small>{hasError}</small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.warn('Error rendering conditional fields:', error);
      return (
        <div className="mt-3 p-3 border rounded bg-warning">
          <small className="text-dark">
            <i className="fa fa-exclamation-triangle me-2"></i>
            Error loading conditional fields: {error.message}
          </small>
        </div>
      );
    }
  };

  const renderConditionalField = (field, fieldKey, value, hasError) => {
    const handleConditionalFieldChange = (newValue, valueType = 'text') => {
      setResponses(prev => ({
        ...prev,
        [fieldKey]: {
          value: newValue,
          valueType,
          // For conditional fields, we store the field key but the actual form_item_uuid 
          // will be processed during submission
          form_item_uuid: fieldKey
        }
      }));

      // Clear validation error
      if (validationErrors[fieldKey]) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldKey]: null
        }));
      }
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'textarea':
        return (
          <Input
            type="textarea"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows="3"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'number')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'date')}
            invalid={!!hasError}
          />
        );

      case 'radio':
        return (
          <div>
            {field.options && field.options.map((option, index) => (
              <FormGroup check key={index} className="mb-2">
                <Label check>
                  <Input
                    type="radio"
                    name={fieldKey}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
                  />
                  <span className="ms-2">{option}</span>
                </Label>
              </FormGroup>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            {field.options && field.options.map((option, index) => {
              const currentValues = value ? value.split(',').map(v => v.trim()) : [];
              return (
                <FormGroup check key={index} className="mb-2">
                  <Label check>
                    <Input
                      type="checkbox"
                      value={option}
                      checked={currentValues.includes(option)}
                      onChange={(e) => {
                        let newValues;
                        
                        if (e.target.checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter(v => v !== option);
                        }
                        
                        handleConditionalFieldChange(newValues.join(','), 'text');
                      }}
                    />
                    <span className="ms-2">{option}</span>
                  </Label>
                </FormGroup>
              );
            })}
          </div>
        );

      case 'boolean':
        return (
          <div>
            <FormGroup check className="mb-2">
              <Label check>
                <Input
                  type="radio"
                  name={fieldKey}
                  value="true"
                  checked={value === 'true' || value === true}
                  onChange={(e) => handleConditionalFieldChange(true, 'boolean')}
                />
                <span className="ms-2">Yes</span>
              </Label>
            </FormGroup>
            <FormGroup check className="mb-2">
              <Label check>
                <Input
                  type="radio"
                  name={fieldKey}
                  value="false"
                  checked={value === 'false' || value === false}
                  onChange={(e) => handleConditionalFieldChange(false, 'boolean')}
                />
                <span className="ms-2">No</span>
              </Label>
            </FormGroup>
          </div>
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleConditionalFieldChange(e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <CardTitle tag="h4">
                  {selectedForm ? selectedForm.title : 'Form Submissions'}
                </CardTitle>
                {forms.length > 1 && (
                  <div style={{ width: '300px' }}>
                    <Input
                      type="select"
                      value={selectedForm?.uuid || ''}
                      onChange={(e) => {
                        const form = forms.find(f => f.uuid === e.target.value);
                        setSelectedForm(form);
                        setResponses({});
                        setConditionallyVisibleFields({});
                        setValidationErrors({});
                        setError(null);
                        setSuccess(null);
                        // Reset GPS coordinates when switching forms
                        setGpsCoordinates({ latitude: null, longitude: null });
                        setGpsStatus('idle');
                      }}
                    >
                      <option value="">Select a form</option>
                      {forms.map((form) => (
                        <option key={form.uuid} value={form.uuid}>
                          {form.title}
                        </option>
                      ))}
                    </Input>
                  </div>
                )}
              </div>
              {selectedForm && selectedForm.description && (
                <div className="mt-2">
                  <small className="text-muted">{selectedForm.description}</small>
                </div>
              )}
              {/* GPS Status Indicator */}
              <div className="mt-2 d-flex align-items-center">
                {gpsStatus === 'requesting' && (
                  <small className="text-info">
                    📍 Requesting location access...
                  </small>
                )}
                {gpsStatus === 'success' && gpsCoordinates.latitude !== null && gpsCoordinates.longitude !== null && (
                  <small className="text-success">
                    📍 Location captured: Lat: {gpsCoordinates.latitude.toFixed(6)}, 
                    Lng: {gpsCoordinates.longitude.toFixed(6)}
                    {formItems.some(item => 
                      item.question && (
                        item.question.toLowerCase().includes('latitude') || 
                        item.question.toLowerCase().includes('longitude') ||
                        item.question.toLowerCase().includes('lat') ||
                        item.question.toLowerCase().includes('lng')
                      )
                    ) && ' (Auto-filled in form fields)'}
                  </small>
                )}
                {gpsStatus === 'error' && (
                  <small className="text-warning">
                    ⚠️ Location access denied or unavailable
                  </small>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {error && (
                <Alert color="danger" toggle={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert color="success" toggle={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {loading && !selectedForm ? (
                <div className="text-center">
                  <p>Loading forms...</p>
                </div>
              ) : !selectedForm ? (
                <div className="text-center">
                  <p>No forms available. Please create a form in the Form Builder first.</p>
                </div>
              ) : loading ? (
                <div className="text-center">
                  <p>Loading form questions...</p>
                </div>
              ) : formItems.length === 0 ? (
                <div className="text-center">
                  <p>This form has no questions. Please add questions in the Form Builder.</p>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  {/* GPS Coordinates Status */}
                  <div className="mb-4 p-3 border rounded">
                    <h6 className="mb-2">
                      <i className="fa fa-map-marker me-2"></i>
                      Location Information
                    </h6>
                    
                    {gpsStatus === 'requesting' && (
                      <div className="text-info">
                        <i className="fa fa-spinner fa-spin me-2"></i>
                        Requesting GPS coordinates...
                      </div>
                    )}
                    
                    {gpsStatus === 'success' && gpsCoordinates.latitude && gpsCoordinates.longitude && (
                      <div className="text-success">
                        <i className="fa fa-check-circle me-2"></i>
                        Location captured successfully
                        <div className="mt-1">
                          <small className="text-muted">
                            Lat: {parseFloat(gpsCoordinates.latitude).toFixed(6)}, 
                            Lng: {parseFloat(gpsCoordinates.longitude).toFixed(6)}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    {gpsStatus === 'error' && (
                      <div className="text-warning">
                        <i className="fa fa-exclamation-triangle me-2"></i>
                        Unable to get location (will submit without GPS coordinates)
                        <div className="mt-2">
                          <Button 
                            color="outline-primary" 
                            size="sm"
                            onClick={requestGPSCoordinates}
                            disabled={gpsStatus === 'requesting'}
                          >
                            <i className="fa fa-refresh me-1"></i>
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {gpsStatus === 'idle' && (
                      <div className="text-muted">
                        <i className="fa fa-info-circle me-2"></i>
                        GPS coordinates will be captured automatically
                      </div>
                    )}
                  </div>

                  {formItems.map((item, index) => (
                    <div key={item.uuid} className="mb-4 p-3 border rounded">
                      <div className="mb-3">
                        <h6 className="mb-1">
                          {index + 1}. {item.question}
                          {item.required && <span className="text-danger"> *</span>}
                        </h6>
                        <div className="d-flex gap-2 mb-2">
                          <small className="badge bg-secondary">
                            Type: {item.item_type}
                          </small>
                          {item.required && (
                            <small className="badge bg-warning text-dark">
                              Required
                            </small>
                          )}
                          {item.item_type === 'select' && item.conditional_fields && (
                            <small className="badge bg-info text-dark">
                              Has Conditional Fields
                            </small>
                          )}
                          {responses[item.uuid] && (
                            <small className="badge bg-success">
                              Value Type: {responses[item.uuid].valueType}
                            </small>
                          )}
                        </div>
                      </div>
                      
                      <FormGroup>
                        {renderFormField(item)}
                        {validationErrors[item.uuid] && (
                          <div className="text-danger mt-1">
                            <small>{validationErrors[item.uuid]}</small>
                          </div>
                        )}
                      </FormGroup>
                    </div>
                  ))}

                  {/* Debug Information - Show what will be submitted */}
                  {Object.keys(responses).length > 0 && (
                    <div className="mb-4 p-3 border rounded bg-light">
                      <h6 className="mb-3">
                        <i className="fa fa-bug me-2"></i>
                        Debug: Data to be submitted
                      </h6>
                      <div className="small">
                        <strong>User Info:</strong>
                        <ul className="mb-2">
                          <li>User UUID: {user?.uuid || 'Not available'}</li>
                          <li>Country UUID: {user?.country_uuid || 'Not available'}</li>
                          <li>Province UUID: {user?.province_uuid || 'Not available'}</li>
                          <li>Area UUID: {user?.area_uuid || 'Not available'}</li>
                        </ul>
                        <strong>GPS Coordinates:</strong>
                        <ul className="mb-2">
                          <li>Latitude: {gpsCoordinates.latitude || 'Not captured'}</li>
                          <li>Longitude: {gpsCoordinates.longitude || 'Not captured'}</li>
                        </ul>
                        <strong>Form Responses:</strong>
                        <ul>
                          {Object.entries(responses).map(([key, data]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {JSON.stringify(data.value)} 
                              <span className="text-muted"> ({data.valueType})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <Button 
                      type="submit" 
                      color="primary" 
                      size="lg"
                      disabled={submitting || formItems.length === 0}
                    >
                      {submitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  </div>
                </Form>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Camera Modal */}
      <Modal 
        isOpen={showCamera} 
        toggle={stopCamera}
        size="lg"
        backdrop="static"
        centered
      >
        <ModalHeader toggle={stopCamera}>
          📷 Take Photo
        </ModalHeader>
        <ModalBody>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <video
              id="camera-video"
              ref={(video) => {
                if (video && cameraStream) {
                  video.srcObject = cameraStream;
                  video.play();
                }
              }}
              style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                borderRadius: '8px'
              }}
              autoPlay
              playsInline
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={stopCamera}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={capturePhoto}
          >
            📷 Capture Photo
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormSubmissions;
