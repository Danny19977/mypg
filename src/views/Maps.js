
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import AnimatedRangeCalendar from "../components/AnimatedRangeCalendar";
import { formSubmissionService, formResponseService, formService } from "../services/apiServices";



function Maps() {
  const mapRef = useRef(null);
  const [submissions, setSubmissions] = useState([]);
  const [dateRange, setDateRange] = useState();
  const [showModal, setShowModal] = useState(false);
  const [tempRange, setTempRange] = useState();
  const [userLocation, setUserLocation] = useState(null);
  
  // Advanced Search and Filter States
  const [searchText, setSearchText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    form: [],
    user: [],
    status: []
  });
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [uniqueFilterValues, setUniqueFilterValues] = useState({
    form: new Set(),
    user: new Set(),
    status: new Set()
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submissionResponses, setSubmissionResponses] = useState({});

  // Helper function to extract GPS coordinates from form responses
  const extractGPSFromResponses = (responses) => {
    let latitude = null;
    let longitude = null;
    
    if (responses && Array.isArray(responses)) {
      responses.forEach(response => {
        if (response.form_item && response.form_item.question) {
          const question = response.form_item.question.toLowerCase();
          const value = parseFloat(response.response_value);
          
          if (!isNaN(value)) {
            if (question.includes('latitude') || question.includes('lat')) {
              latitude = value;
            } else if (question.includes('longitude') || question.includes('lng') || question.includes('long')) {
              longitude = value;
            }
          }
        }
      });
    }
    
    return { latitude, longitude };
  };

  // Helper function to get display name from form responses
  const getDisplayDataFromResponses = (responses) => {
    const data = {
      name: 'Form Submission',
      location: '',
      images: [],
      details: {}
    };
    
    if (responses && Array.isArray(responses)) {
      responses.forEach(response => {
        if (response.form_item && response.form_item.question && response.response_value) {
          const question = response.form_item.question.toLowerCase();
          const value = response.response_value;
          
          // Extract name/title fields
          if (question.includes('name') || question.includes('title') || question.includes('nom')) {
            data.name = value;
          }
          
          // Extract location fields
          if (question.includes('location') || question.includes('address') || question.includes('lieu') || question.includes('adresse')) {
            data.location = value;
          }
          
          // Extract image fields
          if (question.includes('image') || question.includes('photo') || question.includes('picture')) {
            if (value && value.startsWith('http')) {
              data.images.push({
                url: value,
                type: question.includes('inside') ? 'inside' : 
                      question.includes('outside') ? 'outside' : 
                      question.includes('report') ? 'report' : 'general',
                label: response.form_item.question
              });
            }
          }
          
          // Store all other details
          data.details[response.form_item.question] = value;
        }
      });
    }
    
    return data;
  };

  // Function to calculate distance between two coordinates (Metric System)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c; // Distance in kilometers
    
    // Return distance in metric units
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return `${meters} m`; // meters
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(2)} km`; // kilometers with 2 decimal places for short distances
    } else {
      return `${distanceKm.toFixed(1)} km`; // kilometers with 1 decimal place for longer distances
    }
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log("User location obtained:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("Unable to retrieve your location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  // Advanced filtering and search logic
  useEffect(() => {
    // Extract unique values for filters
    const forms = new Set();
    const users = new Set();
    const statuses = new Set();
    
    submissions.forEach(submission => {
      if (submission.form && submission.form.title) forms.add(submission.form.title);
      if (submission.user && submission.user.name) users.add(submission.user.name);
      if (submission.status) statuses.add(submission.status);
    });
    
    setUniqueFilterValues({
      form: forms,
      user: users,
      status: statuses
    });
    
    // Apply filters and search
    const filtered = submissions.filter(submission => {
      // Get responses for this submission
      const responses = submissionResponses[submission.uuid] || [];
      const displayData = getDisplayDataFromResponses(responses);
      
      // Text search across multiple fields
      const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchableText = [
        displayData.name,
        submission.form?.title,
        submission.user?.name,
        submission.status,
        displayData.location,
        ...Object.values(displayData.details)
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => searchableText.includes(term));
      
      // Multi-select filter matching
      const matchesForm = filterOptions.form.length === 0 || 
        filterOptions.form.includes(submission.form?.title);
      const matchesUser = filterOptions.user.length === 0 || 
        filterOptions.user.includes(submission.user?.name);
      const matchesStatus = filterOptions.status.length === 0 || 
        filterOptions.status.includes(submission.status);
      
      return matchesSearch && matchesForm && matchesUser && matchesStatus;
    });
    
    setFilteredSubmissions(filtered);
    
    // Update active filters count
    const activeCount = Object.values(filterOptions).reduce((acc, arr) => acc + arr.length, 0);
    setActiveFiltersCount(activeCount);
    
    // Generate search suggestions
    if (searchText.length > 0) {
      const suggestions = new Set();
      submissions.forEach(submission => {
        const responses = submissionResponses[submission.uuid] || [];
        const displayData = getDisplayDataFromResponses(responses);
        
        [displayData.name, submission.form?.title, submission.user?.name, displayData.location]
          .filter(Boolean)
          .forEach(field => {
            if (field.toLowerCase().includes(searchText.toLowerCase()) && 
                field.toLowerCase() !== searchText.toLowerCase()) {
              suggestions.add(field);
            }
          });
      });
      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  }, [submissions, submissionResponses, searchText, filterOptions]);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        let data;
        
        // Get form submissions - use date range if specified
        if (dateRange?.start && dateRange?.end) {
          const start = dateRange.start.toString();
          const end = dateRange.end.toString();
          const response = await formSubmissionService.getByDateRange(start, end);
          if (response.status === 'success' && response.data) {
            data = response.data;
          }
        } else {
          const response = await formSubmissionService.getAll();
          if (response.status === 'success' && response.data) {
            data = response.data;
          }
        }
        
        if (!data) {
          data = [];
        }
        
        console.log("Form submissions data:", data);
        setSubmissions(data);
        
        // Load responses for each submission
        data.forEach(async (submission) => {
          try {
            const responsesData = await formResponseService.getBySubmission(submission.uuid);
            if (responsesData.status === 'success') {
              setSubmissionResponses(prev => ({
                ...prev,
                [submission.uuid]: responsesData.data
              }));
            }
          } catch (error) {
            console.error(`Error loading responses for submission ${submission.uuid}:`, error);
          }
        });
      } catch (err) {
        console.error("Error fetching form submissions:", err);
        setSubmissions([]);
      }
    }
    fetchSubmissions();
  }, [dateRange]);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;
    const google = window.google;
    let lat = "0";
    let lng = "0";
    let bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    // Store references to all markers and distance lines
    const allMarkers = [];
    let currentDistanceLine = null;
    
    // Process form submissions to extract GPS coordinates
    const submissionsWithGPS = filteredSubmissions
      .map(submission => {
        const responses = submissionResponses[submission.uuid] || [];
        const { latitude, longitude } = extractGPSFromResponses(responses);
        const displayData = getDisplayDataFromResponses(responses);
        
        return {
          ...submission,
          latitude,
          longitude,
          displayData
        };
      })
      .filter(submission => submission.latitude !== null && submission.longitude !== null);
    
    submissionsWithGPS.forEach((submission) => {
      if (submission.latitude && submission.longitude) {
        hasMarkers = true;
        bounds.extend(new google.maps.LatLng(submission.latitude, submission.longitude));
      }
    });
    
    // Default center and zoom
    if (hasMarkers) {
      lat = bounds.getCenter().lat();
      lng = bounds.getCenter().lng();
    } else if (submissionsWithGPS.length > 0 && submissionsWithGPS[0].latitude && submissionsWithGPS[0].longitude) {
      lat = submissionsWithGPS[0].latitude;
      lng = submissionsWithGPS[0].longitude;
    }
    
    const myLatlng = new google.maps.LatLng(lat, lng);
    const mapOptions = {
      zoom: 5,
      center: myLatlng,
      scrollwheel: true,
      zoomControl: true,
    };
    const map = new google.maps.Map(mapRef.current, mapOptions);
    
    // Function to find nearest marker
    const findNearestMarker = (clickedMarker, clickedSubmission) => {
      let nearestMarker = null;
      let nearestSubmission = null;
      let shortestDistance = Infinity;
      
      allMarkers.forEach(({ marker, submission }) => {
        if (marker !== clickedMarker && submission.latitude && submission.longitude) {
          const distance = calculateDistance(
            clickedSubmission.latitude,
            clickedSubmission.longitude,
            submission.latitude,
            submission.longitude
          );
          
          // Convert distance string to number for comparison
          const distanceNum = parseFloat(distance.replace(/[^\d.]/g, ''));
          
          if (distanceNum < shortestDistance) {
            shortestDistance = distanceNum;
            nearestMarker = marker;
            nearestSubmission = submission;
          }
        }
      });
      
      return { nearestMarker, nearestSubmission, distance: shortestDistance };
    };
    
    // Function to draw distance line
    const drawDistanceLine = (marker1, submission1, marker2, submission2, distance) => {
      // Remove existing distance line
      if (currentDistanceLine) {
        currentDistanceLine.setMap(null);
      }
      
      const lineCoordinates = [
        { lat: parseFloat(submission1.latitude), lng: parseFloat(submission1.longitude) },
        { lat: parseFloat(submission2.latitude), lng: parseFloat(submission2.longitude) }
      ];
      
      currentDistanceLine = new google.maps.Polyline({
        path: lineCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map
      });
      
      // Add distance label at midpoint
      const midLat = (parseFloat(submission1.latitude) + parseFloat(submission2.latitude)) / 2;
      const midLng = (parseFloat(submission1.longitude) + parseFloat(submission2.longitude)) / 2;
      
      const distanceLabel = new google.maps.InfoWindow({
        position: { lat: midLat, lng: midLng },
        content: `<div style="background: rgba(255,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${distance}</div>`,
        disableAutoPan: true
      });
      
      distanceLabel.open(map);
      
      // Store reference to clean up later
      currentDistanceLine.distanceLabel = distanceLabel;
    };
    
    // Place markers
    submissionsWithGPS.forEach((submission) => {
      if (submission.latitude && submission.longitude) {
        const markerLatLng = new google.maps.LatLng(submission.latitude, submission.longitude);
        const marker = new google.maps.Marker({
          position: markerLatLng,
          map: map,
          animation: google.maps.Animation.DROP,
          title: submission.displayData.name || "Form Submission",
        });
        
        // Store marker reference
        allMarkers.push({ marker, submission });
        
        let createdAtRaw = submission.created_at || "";
        let createdAt = "-";
        if (createdAtRaw) {
          const dateObj = new Date(createdAtRaw);
          if (!isNaN(dateObj.getTime())) {
            createdAt = dateObj.toLocaleString();
          } else if (typeof createdAtRaw === "string") {
            createdAt = createdAtRaw;
          }
        }
        
        // Debug: Log submission data to see available fields
        console.log("Submission data for marker:", submission);
        
        // Get images from form responses
        const images = submission.displayData.images || [];
        const primaryImage = images.find(img => img.type === 'inside') || images[0];
        const otherImages = images.filter(img => img !== primaryImage);
        
        // Calculate distance from user location if available
        let distanceText = "";
        if (userLocation && submission.latitude && submission.longitude) {
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            submission.latitude, 
            submission.longitude
          );
          distanceText = `<tr><td style="padding:2px 0;width:30%;"><strong>Distance:</strong></td><td>${distance}</td></tr>`;
        }
        
        // Build details table
        let detailsRows = '';
        Object.entries(submission.displayData.details).forEach(([key, value]) => {
          if (value && !key.toLowerCase().includes('latitude') && !key.toLowerCase().includes('longitude') && !key.toLowerCase().includes('image')) {
            detailsRows += `<tr><td style="padding:2px 0;width:40%;"><strong>${key}:</strong></td><td>${value}</td></tr>`;
          }
        });
        
        const infoContent = `
          <div style='min-width:280px;'>
            <div class="images-container" style="position:relative;">
              ${primaryImage ? `
                <img src='${primaryImage.url}' alt='${primaryImage.label}' class="primary-image" style='width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;' onerror="this.style.display='none'" />
                
                ${otherImages.length > 0 ? `
                  <div class="image-stack" style="position:absolute;top:5px;right:5px;display:flex;flex-direction:column;gap:4px;">
                    ${otherImages.map(img => `
                      <img src='${img.url}' alt='${img.label}' style='width:40px;height:40px;object-fit:cover;border-radius:4px;border:2px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);' 
                        onclick="document.querySelector('.primary-image').src='${img.url}'" onerror="this.style.display='none'" />
                    `).join('')}
                  </div>
                ` : ''}
              ` : `<div style='height:150px;background:#f5f5f5;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;color:#999;'>No Image Available</div>`}
            </div>
            <strong>${submission.displayData.name}</strong><br/>
            <table style="width:100%;margin:8px 0;border-collapse:collapse;">
              <tr><td style="padding:2px 0;width:30%;"><strong>Form:</strong></td><td>${submission.form?.title || "-"}</td></tr>
              <tr><td style="padding:2px 0;"><strong>User:</strong></td><td>${submission.user?.name || "-"}</td></tr>
              <tr><td style="padding:2px 0;"><strong>Status:</strong></td><td>${submission.status || "-"}</td></tr>
              ${distanceText}
              <tr><td style="padding:2px 0;"><strong>Location:</strong></td><td>${submission.displayData.location || "-"}</td></tr>
              ${detailsRows}
            </table>
            <span style='color:#888;font-size:12px;'>Created: ${createdAt}</span>
            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${submission.latitude},${submission.longitude}" 
                 target="_blank" 
                 style="display:inline-block;background:#4285F4;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 4px rgba(66,133,244,0.3);transition:all 0.2s;">
                 <span style="margin-right:6px;">🧭</span> Get Directions
              </a>
              ${userLocation ? `
                <span style="font-size:11px;color:#666;background:#f5f5f5;padding:4px 8px;border-radius:4px;">
                  📍 ${calculateDistance(userLocation.lat, userLocation.lng, submission.latitude, submission.longitude)} away
                </span>
              ` : ''}
            </div>
          </div>
        `;
        const infowindow = new google.maps.InfoWindow({ content: infoContent });
        
        marker.addListener("click", () => {
          // Find and draw line to nearest marker
          const { nearestMarker, nearestSubmission, distance } = findNearestMarker(marker, submission);
          
          if (nearestMarker && nearestSubmission) {
            const distanceStr = calculateDistance(
              submission.latitude,
              submission.longitude,
              nearestSubmission.latitude,
              nearestSubmission.longitude
            );
            drawDistanceLine(marker, submission, nearestMarker, nearestSubmission, distanceStr);
          }
          
          // Open info window
          infowindow.open(map, marker);
        });
      }
    });
    
    // Add map click listener to clear distance line
    map.addListener("click", () => {
      if (currentDistanceLine) {
        if (currentDistanceLine.distanceLabel) {
          currentDistanceLine.distanceLabel.close();
        }
        currentDistanceLine.setMap(null);
        currentDistanceLine = null;
      }
    });
    
    // Fit bounds if there are markers
    if (hasMarkers) {
      map.fitBounds(bounds);
            // Prevent zooming in too close
      const listener = google.maps.event.addListenerOnce(map, "bounds_changed", function () {
        if (map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (currentDistanceLine) {
        if (currentDistanceLine.distanceLabel) {
          currentDistanceLine.distanceLabel.close();
        }
        currentDistanceLine.setMap(null);
      }
    };
  }, [filteredSubmissions, submissionResponses, userLocation]);

  return (
    <>
      <Container fluid>
        {/* Advanced Search and Filter Panel */}
        <Row className="mb-4">
          <Col md="12">
            <Card className="border-0 shadow-sm" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
              <Card.Body className="p-4">
                {/* Search Bar with Suggestions */}
                <Row className="mb-3">
                  <Col md="8">
                    <div style={{ position: "relative" }}>
                      <div className="input-group" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                        <span className="input-group-text bg-white border-0" style={{ fontSize: "18px" }}>🔍</span>
                        <input
                          type="text"
                          className="form-control border-0"
                          placeholder="Search by name, code, shop, type, supervisor..."
                          value={searchText}
                          onChange={(e) => {
                            setSearchText(e.target.value);
                            setShowSuggestions(e.target.value.length > 0);
                          }}
                          onFocus={() => setShowSuggestions(searchText.length > 0)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          style={{ 
                            fontSize: "16px", 
                            padding: "12px 16px",
                            backgroundColor: "white"
                          }}
                        />
                        {searchText && (
                          <button 
                            className="btn btn-outline-secondary border-0"
                            onClick={() => setSearchText("")}
                            style={{ backgroundColor: "white" }}
                          >
                            ✖️
                          </button>
                        )}
                      </div>
                      
                      {/* Search Suggestions Dropdown */}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="position-absolute w-100" style={{ top: "100%", zIndex: 1000 }}>
                          <div className="bg-white border-0 shadow-lg" style={{ borderRadius: "8px", marginTop: "4px" }}>
                            {searchSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="p-2 border-bottom"
                                style={{ cursor: "pointer", fontSize: "14px" }}
                                onMouseDown={() => {
                                  setSearchText(suggestion);
                                  setShowSuggestions(false);
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                              >
                                🔍 {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                  
                  {/* Date Range Selector */}
                  <Col md="4">
                    <div className="d-flex gap-2 h-100">
                      <Button
                        variant="light"
                        className="flex-grow-1"
                        onClick={() => { setTempRange(dateRange); setShowModal(true); }}
                        style={{ 
                          borderRadius: "12px", 
                          fontWeight: "600", 
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)", 
                          padding: "12px 20px",
                          backgroundColor: "white",
                          border: "2px solid rgba(255,255,255,0.3)",
                          color: dateRange?.start && dateRange?.end ? "#667eea" : "#666",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.3s",
                          fontSize: "14px"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-2px)";
                          e.target.style.boxShadow = "0 6px 25px rgba(0,0,0,0.15)";
                          e.target.style.backgroundColor = "#f8f9ff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                          e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
                          e.target.style.backgroundColor = "white";
                        }}
                      >
                        <span style={{ marginRight: "8px", fontSize: "16px" }}>📅</span>
                        {dateRange?.start && dateRange?.end
                          ? `${dateRange.start.toString()} - ${dateRange.end.toString()}`
                          : "Select Date Range"}
                      </Button>
                      
                      {dateRange?.start && dateRange?.end && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setDateRange(null);
                            setTempRange(null);
                          }}
                          style={{ 
                            borderRadius: "12px", 
                            padding: "12px",
                            backgroundColor: "white",
                            border: "2px solid #dc3545",
                            color: "#dc3545",
                            transition: "all 0.3s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#dc3545";
                            e.target.style.color = "white";
                            e.target.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "white";
                            e.target.style.color = "#dc3545";
                            e.target.style.transform = "translateY(0)";
                          }}
                          title="Clear Date Range"
                        >
                          ✖️
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>

                {/* Filter Toggle and Stats */}
                <Row className="mb-3">
                  <Col md="8">
                    <Button
                      variant="light"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      style={{ 
                        borderRadius: "20px", 
                        fontWeight: "600",
                        backgroundColor: "rgba(255,255,255,0.9)",
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      🎛️ Advanced Filters {activeFiltersCount > 0 && (
                        <span className="badge bg-danger ms-2">{activeFiltersCount}</span>
                      )}
                    </Button>
                  </Col>
                  <Col md="4" className="text-end">
                    <span className="text-white fw-bold">
                      📍 {filteredSubmissions.length} of {submissions.length} markers
                    </span>
                  </Col>
                </Row>

                {/* Collapsible Advanced Filters */}
                {showFilters && (
                  <div className="animate__animated animate__fadeIn">
                    <Row className="g-4">
                      {/* Form Filter */}
                      <Col md="4">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            � Form
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.form.size}</span>
                          </label>
                          <div className="dropdown-container">
                            <div 
                              className="custom-dropdown"
                              style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                minHeight: "45px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                padding: "8px"
                              }}
                            >
                              {filterOptions.form.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select forms...
                                </div>
                              )}
                              {[...uniqueFilterValues.form].sort().map(form => (
                                <div 
                                  key={form}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.form.includes(form) ? "#e3f2fd" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newForms = filterOptions.form.includes(form)
                                      ? filterOptions.form.filter(f => f !== form)
                                      : [...filterOptions.form, form];
                                    setFilterOptions({...filterOptions, form: newForms});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.form.includes(form)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.form.includes(form)) {
                                      e.target.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.form.includes(form)}
                                    onChange={() => {}}
                                    style={{ 
                                      marginRight: "8px", 
                                      accentColor: "#667eea",
                                      transform: "scale(1.2)"
                                    }}
                                  />
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{form}</span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#667eea", 
                                      color: "white",
                                      fontSize: "11px",
                                      padding: "2px 6px"
                                    }}
                                  >
                                    {submissions.filter(s => s.form?.title === form).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* User Filter */}
                      <Col md="4">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            👤 User
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.user.size}</span>
                          </label>
                          <div className="dropdown-container">
                            <div 
                              className="custom-dropdown"
                              style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                minHeight: "45px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                padding: "8px"
                              }}
                            >
                              {filterOptions.user.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select users...
                                </div>
                              )}
                              {[...uniqueFilterValues.user].sort().map(user => (
                                <div 
                                  key={user}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.user.includes(user) ? "#e8f5e8" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newUsers = filterOptions.user.includes(user)
                                      ? filterOptions.user.filter(u => u !== user)
                                      : [...filterOptions.user, user];
                                    setFilterOptions({...filterOptions, user: newUsers});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.user.includes(user)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.user.includes(user)) {
                                      e.target.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.user.includes(user)}
                                    onChange={() => {}}
                                    style={{ 
                                      marginRight: "8px", 
                                      accentColor: "#4caf50",
                                      transform: "scale(1.2)"
                                    }}
                                  />
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{user}</span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#4caf50", 
                                      color: "white",
                                      fontSize: "11px",
                                      padding: "2px 6px"
                                    }}
                                  >
                                    {submissions.filter(s => s.user?.name === user).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Status Filter */}
                      <Col md="4">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            � Status
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.status.size}</span>
                          </label>
                          <div className="dropdown-container">
                            <div 
                              className="custom-dropdown"
                              style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                minHeight: "45px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                padding: "8px"
                              }}
                            >
                              {filterOptions.status.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select status...
                                </div>
                              )}
                              {[...uniqueFilterValues.status].sort().map(status => (
                                <div 
                                  key={status}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.status.includes(status) ? "#fff3e0" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newStatus = filterOptions.status.includes(status)
                                      ? filterOptions.status.filter(s => s !== status)
                                      : [...filterOptions.status, status];
                                    setFilterOptions({...filterOptions, status: newStatus});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.status.includes(status)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                      e.target.style.transform = "scale(1.02)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.status.includes(status)) {
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.transform = "scale(1)";
                                    }
                                  }}
                                >
                                  <div style={{ marginRight: "12px", fontSize: "18px" }}>
                                    {status === "completed" ? "✅" : status === "pending" ? "⏳" : "📋"}
                                  </div>
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "600" }}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#ff9800", 
                                      color: "white",
                                      fontSize: "12px",
                                      padding: "4px 8px",
                                      borderRadius: "12px"
                                    }}
                                  >
                                    {submissions.filter(s => s.status === status).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    {/* Filter Action Buttons */}
                    <Row className="mt-4">
                      <Col md="12" className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-light"
                            size="sm"
                            onClick={() => {
                              setSearchText("");
                              setFilterOptions({form: [], user: [], status: []});
                              setShowSuggestions(false);
                            }}
                            style={{ 
                              borderRadius: "25px", 
                              fontWeight: "600",
                              padding: "8px 20px",
                              border: "2px solid rgba(255,255,255,0.5)",
                              backgroundColor: "rgba(255,255,255,0.1)",
                              backdropFilter: "blur(10px)",
                              transition: "all 0.3s"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
                              e.target.style.transform = "translateY(-2px)";
                              e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                              e.target.style.transform = "translateY(0)";
                              e.target.style.boxShadow = "none";
                            }}
                          >
                            🗑️ Clear All Filters
                          </Button>
                          
                          {(activeFiltersCount > 0 || searchText) && (
                            <Button 
                              variant="light"
                              size="sm"
                              style={{ 
                                borderRadius: "25px", 
                                fontWeight: "600",
                                padding: "8px 20px",
                                backgroundColor: "rgba(255,255,255,0.95)",
                                border: "none",
                                color: "#667eea",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                                transition: "all 0.3s"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = "0 6px 25px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                              }}
                            >
                              ⚡ {filteredSubmissions.length} Results Found
                            </Button>
                          )}
                        </div>
                        
                        <Button 
                          variant="light"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          style={{ 
                            borderRadius: "25px", 
                            fontWeight: "600",
                            padding: "8px 20px",
                            backgroundColor: "rgba(255,255,255,0.95)",
                            border: "none",
                            color: "#667eea",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                            transition: "all 0.3s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#667eea";
                            e.target.style.color = "white";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 6px 25px rgba(102,126,234,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "rgba(255,255,255,0.95)";
                            e.target.style.color = "#667eea";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                          }}
                        >
                          ⬆️ Hide Advanced Filters
                        </Button>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(44,62,80,0.25)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s"
          }}>
            <div style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 24,
              boxShadow: "0 8px 32px rgba(44,62,80,0.18)",
              minWidth: 340,
              maxWidth: 480,
              width: "90vw",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "slideUp 0.4s"
            }}>
              <div style={{
                width: "100%",
                padding: "24px 32px 8px 32px",
                borderRadius: "24px 24px 0 0",
                background: "linear-gradient(90deg,#6a82fb 0%,#fc5c7d 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>
                  {tempRange?.start && tempRange?.end
                    ? `Selected: ${tempRange.start.toString()} to ${tempRange.end.toString()}`
                    : "Select Date Range"}
                </div>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: 24,
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div style={{
                width: "100%",
                padding: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <AnimatedRangeCalendar
                  value={tempRange}
                  onChange={setTempRange}
                />
              </div>
              <div style={{
                width: "100%",
                padding: "16px 32px 24px 32px",
                borderRadius: "0 0 24px 24px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 12
              }}>
                <Button
                  variant="secondary"
                  style={{ borderRadius: 16, fontWeight: 600, minWidth: 80 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  style={{
                    borderRadius: 16,
                    fontWeight: 700,
                    minWidth: 80,
                    background: "linear-gradient(90deg,#6a82fb 0%,#fc5c7d 100%)",
                    border: "none",
                    boxShadow: tempRange?.start && tempRange?.end ? "0 2px 8px rgba(44,62,80,0.10)" : "none",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  disabled={!tempRange?.start || !tempRange?.end}
                  onMouseEnter={e => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1)";
                  }}
                  onClick={() => {
                    setDateRange(tempRange);
                    setShowModal(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="map-container" style={{ height: "80vh", width: "100%" }}>
          <div id="map" ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
        </div>
      </Container>
    </>
  );
}

export default Maps;
