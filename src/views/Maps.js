
import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Container, Row, Col } from "react-bootstrap";
import AnimatedRangeCalendar from "../components/AnimatedRangeCalendar";



function Maps() {
  const mapRef = useRef(null);
  const [presents, setPresents] = useState([]);
  const [dateRange, setDateRange] = useState();
  const [showModal, setShowModal] = useState(false);
  const [tempRange, setTempRange] = useState();
  const [userLocation, setUserLocation] = useState(null);
  
  // Advanced Search and Filter States
  const [searchText, setSearchText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    code: [],
    shop: [],
    type: [],
    moved: []
  });
  const [filteredPresents, setFilteredPresents] = useState([]);
  const [uniqueFilterValues, setUniqueFilterValues] = useState({
    code: new Set(),
    shop: new Set(),
    type: new Set(),
    moved: new Set()
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    const codes = new Set();
    const shops = new Set();
    const types = new Set();
    const movedOptions = new Set();
    
    presents.forEach(present => {
      if (present.code) codes.add(present.code);
      if (present.shop) shops.add(present.shop);
      if (present.type) types.add(present.type);
      if (present.moved !== undefined) movedOptions.add(present.moved.toString());
    });
    
    setUniqueFilterValues({
      code: codes,
      shop: shops,
      type: types,
      moved: movedOptions
    });
    
    // Apply filters and search
    const filtered = presents.filter(present => {
      // Text search across multiple fields
      const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
      const searchableText = [
        present.name,
        present.code,
        present.shop,
        present.type,
        present.sup,
        present.location
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerms.length === 0 || 
        searchTerms.every(term => searchableText.includes(term));
      
      // Multi-select filter matching
      const matchesCode = filterOptions.code.length === 0 || 
        filterOptions.code.includes(present.code);
      const matchesShop = filterOptions.shop.length === 0 || 
        filterOptions.shop.includes(present.shop);
      const matchesType = filterOptions.type.length === 0 || 
        filterOptions.type.includes(present.type);
      const matchesMoved = filterOptions.moved.length === 0 || 
        filterOptions.moved.includes(present.moved?.toString());
      
      return matchesSearch && matchesCode && matchesShop && matchesType && matchesMoved;
    });
    
    setFilteredPresents(filtered);
    
    // Update active filters count
    const activeCount = Object.values(filterOptions).reduce((acc, arr) => acc + arr.length, 0);
    setActiveFiltersCount(activeCount);
    
    // Generate search suggestions
    if (searchText.length > 0) {
      const suggestions = new Set();
      presents.forEach(present => {
        [present.name, present.code, present.shop, present.type, present.sup]
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
  }, [presents, searchText, filterOptions]);

  useEffect(() => {
    async function fetchPresents() {
      try {
        let data;
        if (dateRange?.start && dateRange?.end) {
          const start = dateRange.start.toString();
          const end = dateRange.end.toString();
          data = await window.visiteService.getByDateRange(start, end);
        } else {
          data = await window.visiteService.getAll();
        }
        if (!Array.isArray(data) && Array.isArray(data?.data)) {
          data = data.data;
        }
        if (!Array.isArray(data)) data = [];
        console.log("Presents data:", data); // Debug log to see data structure
        setPresents(data);
      } catch (err) {
        console.error("Error fetching presents:", err);
        setPresents([]);
      }
    }
    fetchPresents();
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
    
    filteredPresents.forEach((present) => {
      if (present.latitude && present.longitude) {
        hasMarkers = true;
        bounds.extend(new google.maps.LatLng(present.latitude, present.longitude));
      }
    });
    
    // Default center and zoom
    if (hasMarkers) {
      lat = bounds.getCenter().lat();
      lng = bounds.getCenter().lng();
    } else if (presents.length > 0 && presents[0].latitude && presents[0].longitude) {
      lat = presents[0].latitude;
      lng = presents[0].longitude;
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
    const findNearestMarker = (clickedMarker, clickedPresent) => {
      let nearestMarker = null;
      let nearestPresent = null;
      let shortestDistance = Infinity;
      
      allMarkers.forEach(({ marker, present }) => {
        if (marker !== clickedMarker && present.latitude && present.longitude) {
          const distance = calculateDistance(
            clickedPresent.latitude,
            clickedPresent.longitude,
            present.latitude,
            present.longitude
          );
          
          // Convert distance string to number for comparison
          const distanceNum = parseFloat(distance.replace(/[^\d.]/g, ''));
          
          if (distanceNum < shortestDistance) {
            shortestDistance = distanceNum;
            nearestMarker = marker;
            nearestPresent = present;
          }
        }
      });
      
      return { nearestMarker, nearestPresent, distance: shortestDistance };
    };
    
    // Function to draw distance line
    const drawDistanceLine = (marker1, present1, marker2, present2, distance) => {
      // Remove existing distance line
      if (currentDistanceLine) {
        currentDistanceLine.setMap(null);
      }
      
      const lineCoordinates = [
        { lat: parseFloat(present1.latitude), lng: parseFloat(present1.longitude) },
        { lat: parseFloat(present2.latitude), lng: parseFloat(present2.longitude) }
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
      const midLat = (parseFloat(present1.latitude) + parseFloat(present2.latitude)) / 2;
      const midLng = (parseFloat(present1.longitude) + parseFloat(present2.longitude)) / 2;
      
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
    filteredPresents.forEach((present) => {
      if (present.latitude && present.longitude) {
        const markerLatLng = new google.maps.LatLng(present.latitude, present.longitude);
        const marker = new google.maps.Marker({
          position: markerLatLng,
          map: map,
          animation: google.maps.Animation.DROP,
          title: present.name || "Present",
        });
        
        // Store marker reference
        allMarkers.push({ marker, present });
        
        let createdAtRaw = present.created_at || present.createdAt || present.CreatedAt || present.created || "";
        let createdAt = "-";
        if (createdAtRaw) {
          const dateObj = new Date(createdAtRaw);
          if (!isNaN(dateObj.getTime())) {
            createdAt = dateObj.toLocaleString();
          } else if (typeof createdAtRaw === "string") {
            createdAt = createdAtRaw;
          }
        }
        
        // Debug: Log present data to see available fields
        console.log("Present data for marker:", present);
        
        // Check for various image field names - image_inside should be the primary/first image
        const primaryImage = present.image_inside || present.photo || present.image || present.image_1 || present.picture;
        const outsideImage = present.image_outside || present.outside_image;
        const reportImage = present.image_report;
        const secondImage = present.image_2 || present.image2;
        const thirdImage = present.image_3 || present.image3;
        
        // Calculate distance from user location if available
        let distanceText = "";
        if (userLocation && present.latitude && present.longitude) {
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            present.latitude, 
            present.longitude
          );
          distanceText = `<tr><td style="padding:2px 0;width:30%;"><strong>Distance:</strong></td><td>${distance}</td></tr>`;
        }
        
        const infoContent = `
          <div style='min-width:280px;'>
            <div class="images-container" style="position:relative;">
              ${primaryImage ? `
                <img src='${primaryImage}' alt='Primary photo' class="primary-image" style='width:100%;height:150px;object-fit:cover;border-radius:8px;margin-bottom:8px;' onerror="this.style.display='none'" />
                
                ${outsideImage || reportImage || secondImage || thirdImage ? `
                  <div class="image-stack" style="position:absolute;top:5px;right:5px;display:flex;flex-direction:column;gap:4px;">
                    ${outsideImage ? `
                      <img src='${outsideImage}' alt='Outside' style='width:40px;height:40px;object-fit:cover;border-radius:4px;border:2px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);' 
                        onclick="document.querySelector('.primary-image').src='${outsideImage}'" onerror="this.style.display='none'" />
                    ` : ''}
                    ${reportImage ? `
                      <img src='${reportImage}' alt='Report' style='width:40px;height:40px;object-fit:cover;border-radius:4px;border:2px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);' 
                        onclick="document.querySelector('.primary-image').src='${reportImage}'" onerror="this.style.display='none'" />
                    ` : ''}
                    ${secondImage ? `
                      <img src='${secondImage}' alt='Additional' style='width:40px;height:40px;object-fit:cover;border-radius:4px;border:2px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);' 
                        onclick="document.querySelector('.primary-image').src='${secondImage}'" onerror="this.style.display='none'" />
                    ` : ''}
                    ${thirdImage ? `
                      <img src='${thirdImage}' alt='Additional' style='width:40px;height:40px;object-fit:cover;border-radius:4px;border:2px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);' 
                        onclick="document.querySelector('.primary-image').src='${thirdImage}'" onerror="this.style.display='none'" />
                    ` : ''}
                  </div>
                ` : ''}
              ` : `<div style='height:150px;background:#f5f5f5;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;color:#999;'>No Image Available</div>`}
            </div>
            <strong>${present.name || "Present"}</strong><br/>
            <table style="width:100%;margin:8px 0;border-collapse:collapse;">
              <tr><td style="padding:2px 0;width:30%;"><strong>Code:</strong></td><td>${present.code || "-"}</td></tr>
              <tr><td style="padding:2px 0;"><strong>Shop:</strong></td><td>${present.shop || "-"}</td></tr>
              <tr><td style="padding:2px 0;"><strong>Type:</strong></td><td>${present.type || "-"}</td></tr>
              <tr><td style="padding:2px 0;"><strong>Moved:</strong></td><td>${present.moved ? "Yes" : "No"}</td></tr>
              ${distanceText}
              <tr><td style="padding:2px 0;"><strong>Location:</strong></td><td>${present.location || "-"}</td></tr>
            </table>
            <span style='color:#888;font-size:12px;'>Created: ${createdAt}</span>
            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
              <a href="https://www.google.com/maps/dir/?api=1&destination=${present.latitude},${present.longitude}" 
                 target="_blank" 
                 style="display:inline-block;background:#4285F4;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 4px rgba(66,133,244,0.3);transition:all 0.2s;">
                 <span style="margin-right:6px;">🧭</span> Get Directions
              </a>
              ${userLocation ? `
                <span style="font-size:11px;color:#666;background:#f5f5f5;padding:4px 8px;border-radius:4px;">
                  📍 ${calculateDistance(userLocation.lat, userLocation.lng, present.latitude, present.longitude)} away
                </span>
              ` : ''}
            </div>
          </div>
        `;
        const infowindow = new google.maps.InfoWindow({ content: infoContent });
        
        marker.addListener("click", () => {
          // Find and draw line to nearest marker
          const { nearestMarker, nearestPresent, distance } = findNearestMarker(marker, present);
          
          if (nearestMarker && nearestPresent) {
            const distanceStr = calculateDistance(
              present.latitude,
              present.longitude,
              nearestPresent.latitude,
              nearestPresent.longitude
            );
            drawDistanceLine(marker, present, nearestMarker, nearestPresent, distanceStr);
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
  }, [filteredPresents, userLocation]);

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
                      📍 {filteredPresents.length} of {presents.length} markers
                    </span>
                  </Col>
                </Row>

                {/* Collapsible Advanced Filters */}
                {showFilters && (
                  <div className="animate__animated animate__fadeIn">
                    <Row className="g-4">
                      {/* Code Filter */}
                      <Col md="3">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            💼 Code
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.code.size}</span>
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
                              {filterOptions.code.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select codes...
                                </div>
                              )}
                              {[...uniqueFilterValues.code].sort().map(code => (
                                <div 
                                  key={code}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.code.includes(code) ? "#e3f2fd" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newCodes = filterOptions.code.includes(code)
                                      ? filterOptions.code.filter(c => c !== code)
                                      : [...filterOptions.code, code];
                                    setFilterOptions({...filterOptions, code: newCodes});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.code.includes(code)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.code.includes(code)) {
                                      e.target.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.code.includes(code)}
                                    onChange={() => {}}
                                    style={{ 
                                      marginRight: "8px", 
                                      accentColor: "#667eea",
                                      transform: "scale(1.2)"
                                    }}
                                  />
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{code}</span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#667eea", 
                                      color: "white",
                                      fontSize: "11px",
                                      padding: "2px 6px"
                                    }}
                                  >
                                    {presents.filter(p => p.code === code).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Shop Filter */}
                      <Col md="3">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            🏪 Shop
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.shop.size}</span>
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
                              {filterOptions.shop.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select shops...
                                </div>
                              )}
                              {[...uniqueFilterValues.shop].sort().map(shop => (
                                <div 
                                  key={shop}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.shop.includes(shop) ? "#e8f5e8" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newShops = filterOptions.shop.includes(shop)
                                      ? filterOptions.shop.filter(s => s !== shop)
                                      : [...filterOptions.shop, shop];
                                    setFilterOptions({...filterOptions, shop: newShops});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.shop.includes(shop)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.shop.includes(shop)) {
                                      e.target.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.shop.includes(shop)}
                                    onChange={() => {}}
                                    style={{ 
                                      marginRight: "8px", 
                                      accentColor: "#4caf50",
                                      transform: "scale(1.2)"
                                    }}
                                  />
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{shop}</span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#4caf50", 
                                      color: "white",
                                      fontSize: "11px",
                                      padding: "2px 6px"
                                    }}
                                  >
                                    {presents.filter(p => p.shop === shop).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Type Filter */}
                      <Col md="3">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            📋 Type
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.type.size}</span>
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
                              {filterOptions.type.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select types...
                                </div>
                              )}
                              {[...uniqueFilterValues.type].sort().map(type => (
                                <div 
                                  key={type}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "6px 8px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.type.includes(type) ? "#fff3e0" : "transparent"
                                  }}
                                  onClick={() => {
                                    const newTypes = filterOptions.type.includes(type)
                                      ? filterOptions.type.filter(t => t !== type)
                                      : [...filterOptions.type, type];
                                    setFilterOptions({...filterOptions, type: newTypes});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.type.includes(type)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.type.includes(type)) {
                                      e.target.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={filterOptions.type.includes(type)}
                                    onChange={() => {}}
                                    style={{ 
                                      marginRight: "8px", 
                                      accentColor: "#ff9800",
                                      transform: "scale(1.2)"
                                    }}
                                  />
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "500" }}>{type}</span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: "#ff9800", 
                                      color: "white",
                                      fontSize: "11px",
                                      padding: "2px 6px"
                                    }}
                                  >
                                    {presents.filter(p => p.type === type).length}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>

                      {/* Moved Filter */}
                      <Col md="3">
                        <div className="filter-group">
                          <label className="form-label text-white fw-bold mb-2">
                            📦 Status
                            <span className="badge bg-light text-dark ms-2">{uniqueFilterValues.moved.size}</span>
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
                              {filterOptions.moved.length === 0 && (
                                <div className="placeholder-text" style={{ color: "#999", padding: "8px", fontStyle: "italic" }}>
                                  Select status...
                                </div>
                              )}
                              {[...uniqueFilterValues.moved].sort().map(moved => (
                                <div 
                                  key={moved}
                                  className="filter-option"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    margin: "2px 0",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    backgroundColor: filterOptions.moved.includes(moved) 
                                      ? (moved === "true" ? "#e8f5e8" : "#ffebee") 
                                      : "transparent",
                                    border: filterOptions.moved.includes(moved) 
                                      ? (moved === "true" ? "2px solid #4caf50" : "2px solid #f44336")
                                      : "2px solid transparent"
                                  }}
                                  onClick={() => {
                                    const newMoved = filterOptions.moved.includes(moved)
                                      ? filterOptions.moved.filter(m => m !== moved)
                                      : [...filterOptions.moved, moved];
                                    setFilterOptions({...filterOptions, moved: newMoved});
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!filterOptions.moved.includes(moved)) {
                                      e.target.style.backgroundColor = "#f5f5f5";
                                      e.target.style.transform = "scale(1.02)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!filterOptions.moved.includes(moved)) {
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.transform = "scale(1)";
                                    }
                                  }}
                                >
                                  <div style={{ marginRight: "12px", fontSize: "18px" }}>
                                    {moved === "true" ? "✅" : "❌"}
                                  </div>
                                  <span style={{ flex: 1, fontSize: "14px", fontWeight: "600" }}>
                                    {moved === "true" ? "Moved" : "Not Moved"}
                                  </span>
                                  <span 
                                    className="badge"
                                    style={{ 
                                      backgroundColor: moved === "true" ? "#4caf50" : "#f44336", 
                                      color: "white",
                                      fontSize: "12px",
                                      padding: "4px 8px",
                                      borderRadius: "12px"
                                    }}
                                  >
                                    {presents.filter(p => p.moved?.toString() === moved).length}
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
                              setFilterOptions({code: [], shop: [], type: [], moved: []});
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
                              ⚡ {filteredPresents.length} Results Found
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
