import { useEffect, useRef, useCallback } from 'react';


export const useGoogleMap = (containerRef, data, userLocation) => {
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const distanceLineRef = useRef(null);

    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;
        
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        } else if (distanceKm < 10) {
            return `${distanceKm.toFixed(2)} km`;
        } else {
            return `${distanceKm.toFixed(1)} km`;
        }
    }, []);

    const clearMarkers = useCallback(() => {
        if (markersRef.current) {
            markersRef.current.forEach(({ marker }) => marker.setMap(null));
            markersRef.current = [];
        }
        
        if (distanceLineRef.current) {
            if (distanceLineRef.current.distanceLabel) {
                distanceLineRef.current.distanceLabel.close();
            }
            distanceLineRef.current.setMap(null);
            distanceLineRef.current = null;
        }
    }, []);

    const createInfoWindowContent = useCallback((item) => {
        // Format and validate data
        const statusValue = item.text_value ? String(item.text_value).trim() : null;
        const statusColor = statusValue ? 
            (statusValue.toUpperCase() === 'OUVERT' ? '#4CAF50' : 
             statusValue.toUpperCase() === 'NON' ? '#F44336' : 
             '#757575') : '#757575';
             
        console.log('Form data:', {
            text_value: statusValue,
            email: item.email,
            number_value: item.number_value,
            boolean_value: item.boolean_value,
            comment: item.comment,
            color: statusColor
        });

        // Calculate distance if user location is available
        const distance = userLocation && item.latitude && item.longitude ? 
            calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                parseFloat(item.latitude), 
                parseFloat(item.longitude)
            ) : null;

        const images = item.images || [];
        const createdAt = item.created_at ? 
            (item.created_at.includes('T') ? new Date(item.created_at).toLocaleString() : item.created_at) : 
            'N/A';

        return `
            <div style="min-width:380px; max-width:520px;">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px;
                    border-radius: 8px 8px 0 0;
                    text-align: center;
                    border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="margin:0 0 4px 0; font-size:16px; color:white;">
                        📍 Visit Entry #${item.id}
                    </h4>
                    <div style="font-size:12px; color:rgba(255,255,255,0.9); font-family:monospace;">
                        ${item.visite_harder_uuid || 'Unknown UUID'}
                    </div>
                </div>

                <!-- Content Container -->
                <div style="padding:16px; background:white; border-radius:0 0 8px 8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Status Badge -->
                    ${statusValue ? `
                        <div style="text-align:center; margin-bottom:20px;">
                            <div style="
                                display:inline-flex;
                                align-items:center;
                                background-color:${statusColor};
                                color:white;
                                padding:8px 16px;
                                border-radius:20px;
                                font-weight:500;
                                font-size:14px;
                                box-shadow:0 2px 4px ${statusColor}40;">
                                <span style="margin-right:6px;">🏪</span>
                                ${statusValue}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Form Data Section -->
                    <div style="margin-bottom:20px; border:1px solid #e0e4e8; border-radius:8px;">
                        <!-- Section Header -->
                        <div onclick="
                            const content = this.nextElementSibling;
                            const arrow = this.querySelector('.arrow');
                            content.style.display = content.style.display === 'none' ? 'block' : 'none';
                            arrow.innerHTML = content.style.display === 'none' ? '▼' : '▲';
                            arrow.style.transform = content.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';"
                            style="
                                padding:12px 16px;
                                background:#f8f9fa;
                                cursor:pointer;
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                border-bottom:1px solid #e0e4e8;
                                transition:background 0.2s;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:16px;">📝</span>
                                <span style="font-weight:500; color:#2c3e50;">Form Data</span>
                            </div>
                            <span class="arrow" style="color:#6c757d; transition:transform 0.2s;">▼</span>
                        </div>

                        <!-- Form Content -->
                        <div style="display:none; padding:16px;">
                            <!-- Form Fields Grid -->
                            <div style="display:grid; gap:12px;">
                                ${[
                                    { 
                                        label: 'Store Status',
                                        value: statusValue,
                                        icon: '🏪',
                                        color: statusColor,
                                        highlight: true
                                    },
                                    { 
                                        label: 'Contact Email',
                                        value: item.email,
                                        icon: '📧'
                                    },
                                    { 
                                        label: 'Visit Number',
                                        value: item.number_value,
                                        icon: '🔢'
                                    },
                                    { 
                                        label: 'Store State',
                                        value: item.boolean_value !== undefined ? 
                                            (item.boolean_value ? 'Open' : 'Closed') : null,
                                        icon: '✓',
                                        color: item.boolean_value ? '#4CAF50' : '#F44336'
                                    },
                                    { 
                                        label: 'Notes',
                                        value: item.comment,
                                        icon: '💭',
                                        multiline: true
                                    }
                                ].filter(field => field.value !== null && field.value !== undefined)
                                .map(field => `
                                    <div style="
                                        background: ${field.highlight ? `linear-gradient(135deg, ${field.color}15, ${field.color}08)` : '#f8f9fa'};
                                        padding: ${field.multiline ? '16px' : '12px'};
                                        border-radius: 8px;
                                        border: 1px solid ${field.color ? field.color + '40' : '#e0e4e8'};
                                    ">
                                        <div style="
                                            color: #666;
                                            font-size: 12px;
                                            margin-bottom: 6px;
                                            display: flex;
                                            align-items: center;
                                            gap: 6px;
                                        ">
                                            <span style="font-size: 16px;">${field.icon}</span>
                                            ${field.label}
                                        </div>
                                        <div style="
                                            color: ${field.color || '#2c3e50'};
                                            font-size: ${field.multiline ? '13px' : '14px'};
                                            font-weight: ${field.highlight ? '500' : 'normal'};
                                            ${field.multiline ? 'white-space: pre-wrap;' : ''}
                                        ">
                                            ${String(field.value)}
                                        </div>
                                    </div>
                                `).join('')}

                            <!-- Attachments -->
                            ${item.file_url ? `
                                <div style="padding: 8px; border-top: 1px solid #dee2e6;">
                                    <div style="font-weight: bold; margin-bottom: 4px;">
                                        📎 Attachments:
                                    </div>
                                    ${Array.isArray(item.file_url) 
                                        ? item.file_url.map(url => `
                                            <a href="${url}" target="_blank" style="display: block; color: #4a90e2; text-decoration: none; margin: 4px 0;">
                                                <span style="margin-right: 8px;">📄</span> View Attachment
                                            </a>
                                        `).join('')
                                        : `
                                            <a href="${item.file_url}" target="_blank" style="display: block; color: #4a90e2; text-decoration: none;">
                                                <span style="margin-right: 8px;">📄</span> View Attachment
                                            </a>
                                        `}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${images.length > 0 ? `
                        <!-- Image Gallery -->
                        <div style="margin:20px -16px; background:#f8f9fa; padding:16px; border-top:1px solid #e0e4e8; border-bottom:1px solid #e0e4e8;">
                            <div style="margin-bottom:12px;">
                                <div style="font-weight:500; color:#2c3e50; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                                    <span style="font-size:16px;">📸</span>
                                    Visit Photos
                                </div>
                                <div style="font-size:12px; color:#666;">
                                    ${images.length} image${images.length !== 1 ? 's' : ''} attached
                                </div>
                            </div>
                            <div style="
                                display:flex;
                                overflow-x:auto;
                                gap:12px;
                                padding:4px;
                                scrollbar-width:thin;
                                scrollbar-color:#ccc transparent;">
                                ${images.map(url => `
                                    <div style="
                                        flex:0 0 auto;
                                        position:relative;
                                        background:white;
                                        padding:8px;
                                        border-radius:12px;
                                        box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                                        <img src="${url}" 
                                             alt="Visit Photo" 
                                             style="
                                                height:180px;
                                                width:auto;
                                                object-fit:cover;
                                                border-radius:8px;
                                                display:block;"
                                             onerror="this.parentElement.style.display='none';">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}



                <div style="max-height:400px; overflow-y:auto;">
                    <div style="margin-bottom: 15px;">
                        <!-- Main Details Button -->
                        <div onclick="
                            const detailsContent = this.nextElementSibling;
                            const arrow = this.querySelector('.arrow');
                            if(detailsContent.style.maxHeight) {
                                detailsContent.style.maxHeight = null;
                                arrow.innerHTML = '▼';
                            } else {
                                detailsContent.style.maxHeight = detailsContent.scrollHeight + 'px';
                                arrow.innerHTML = '▲';
                            }"
                            style="cursor: pointer; padding: 10px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <h5 style="margin: 0; color: #2c3e50; font-size: 14px;">
                                📝 Details <span style="color: #666; font-size: 12px;">(click to expand)</span>
                            </h5>
                            <span class="arrow" style="color: #667eea; font-size: 12px;">▼</span>
                        </div>

                        <!-- Expandable Content -->
                        <div style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out;">
                            <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-top: 5px;">
                                <!-- Form Submission Data -->
                                <div style="display: grid; gap: 12px;">
                                    ${[
                                        { label: 'Store Status', value: statusValue, icon: '🏪', color: statusColor },
                                        { label: 'Email Address', value: item.email, icon: '📧' },
                                        { label: 'Number Value', value: item.number_value, icon: '🔢' },
                                        { label: 'Store State', value: item.boolean_value !== undefined ? (item.boolean_value ? 'Open' : 'Closed') : null, icon: '✓' },
                                        { label: 'Comments', value: item.comment, icon: '💭' }
                                    ].filter(field => field.value !== null && field.value !== undefined)
                                        .map(field => `
                                            <div style="
                                                background: ${field.color ? `linear-gradient(135deg, ${field.color}15, ${field.color}08)` : '#f8f9fa'};
                                                padding: 12px;
                                                border-radius: 8px;
                                                border: 1px solid ${field.color || '#dee2e6'};
                                                margin-bottom: 8px;
                                            ">
                                                <div style="
                                                    color: #666;
                                                    font-size: 12px;
                                                    margin-bottom: 4px;
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 6px;
                                                ">
                                                    <span style="font-size: 16px;">${field.icon}</span>
                                                    ${field.label}
                                                </div>
                                                <div style="
                                                    color: ${field.color || '#2c3e50'};
                                                    font-size: 14px;
                                                    font-weight: ${field.color ? '500' : 'normal'};
                                                ">
                                                    ${String(field.value)}
                                                </div>
                                            </div>
                                        `).join('')}

                                    ${item.file_url ? `
                                        <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
                                            <div style="color: #666; font-size: 12px; margin-bottom: 4px;">
                                                📎 Attachments:
                                            </div>
                                            <div>
                                                ${Array.isArray(item.file_url) 
                                                    ? item.file_url.map(url => `
                                                        <a href="${url}" target="_blank" style="display: block; color: #667eea; text-decoration: none; font-size: 13px; margin: 4px 0;">
                                                            <span style="margin-right: 8px;">📄</span> View Attachment
                                                        </a>
                                                    `).join('')
                                                    : `
                                                        <a href="${item.file_url}" target="_blank" style="display: block; color: #667eea; text-decoration: none; font-size: 13px;">
                                                            <span style="margin-right: 8px;">📄</span> View Attachment
                                                        </a>
                                                    `}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Basic Info Table -->
                    <!-- User Info Grid -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin-bottom: 20px;
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 8px;">
                        <div style="padding:8px; background:white; border-radius:6px;">
                            <div style="font-size:11px; color:#666; margin-bottom:4px;">� User</div>
                            <div style="font-size:13px; color:#2c3e50;">${item.user_name || 'N/A'}</div>
                        </div>
                        <div style="padding:8px; background:white; border-radius:6px;">
                            <div style="font-size:11px; color:#666; margin-bottom:4px;">📧 Email</div>
                            <div style="font-size:13px; color:#2c3e50;">${item.email || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                    <!-- Actions and Info -->
                    <div style="margin-top:20px;">
                        <!-- Location Info Grid -->
                        <div style="
                            display:grid;
                            grid-template-columns:repeat(2,1fr);
                            gap:10px;
                            margin-bottom:20px;">
                            <div style="padding:12px;background:#f8f9fa;border-radius:8px;">
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">📅 Created</div>
                                <div style="font-size:13px;color:#2c3e50;font-weight:500;">${createdAt}</div>
                            </div>
                            <div style="padding:12px;background:#f8f9fa;border-radius:8px;">
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">🔢 Entry Order</div>
                                <div style="font-size:13px;color:#2c3e50;font-weight:500;">${item.entry_order || 'N/A'}</div>
                            </div>
                            <div style="padding:12px;background:#f8f9fa;border-radius:8px;">
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">📍 Area</div>
                                <div style="font-size:13px;color:#2c3e50;font-weight:500;">${item.area_name || 'N/A'}</div>
                            </div>
                            <div style="padding:12px;background:#f8f9fa;border-radius:8px;">
                                <div style="font-size:11px;color:#666;margin-bottom:4px;">🌎 Province</div>
                                <div style="font-size:13px;color:#2c3e50;font-weight:500;">${item.province_name || 'N/A'}</div>
                            </div>
                        </div>

                        <!-- Location Details -->
                        <div style="margin-bottom:20px;">
                            <div style="
                                background:#f8f9fa;
                                border-radius:8px;
                                padding:12px;
                                margin-bottom:10px;">
                                <div style="font-size:12px;color:#666;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                                    <span style="font-size:16px;">📍</span>
                                    Location Coordinates
                                </div>
                                <div style="
                                    font-family:monospace;
                                    font-size:13px;
                                    color:#2c3e50;
                                    background:white;
                                    padding:8px;
                                    border-radius:4px;
                                    border:1px solid #e0e4e8;">
                                    ${parseFloat(item.latitude).toFixed(6)}, ${parseFloat(item.longitude).toFixed(6)}
                                </div>
                            </div>

                            ${distance ? `
                                <div style="
                                    background:#f8f9fa;
                                    border-radius:8px;
                                    padding:12px;
                                    margin-bottom:10px;">
                                    <div style="font-size:12px;color:#666;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                                        <span style="font-size:16px;">📏</span>
                                        Distance from Your Location
                                    </div>
                                    <div style="font-size:14px;color:#2c3e50;font-weight:500;">
                                        ${distance}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Action Buttons -->
                        <div style="
                            display:flex;
                            gap:12px;
                            margin-top:20px;
                            padding-top:20px;
                            border-top:1px solid #e0e4e8;">
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}" 
                               target="_blank" 
                               style="
                                    flex:1;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:linear-gradient(135deg, #4285F4, #3367D6);
                                    color:white;
                                    padding:12px 20px;
                                    border-radius:8px;
                                    text-decoration:none;
                                    font-size:14px;
                                    font-weight:500;
                                    box-shadow:0 2px 6px rgba(66,133,244,0.3);
                                    transition:all 0.2s;">
                                <span style="margin-right:8px;font-size:18px;">🧭</span>
                                Get Directions
                            </a>
                        </div>
                    </div>
                </div>

                
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                </div>
            </div>
        `;
    }, [userLocation, calculateDistance]);

    const createMarkers = useCallback(() => {
        if (!mapRef.current || !window.google) return;

        console.log("🗺️ Starting marker creation...");
        clearMarkers();
        
        const google = window.google;
        const bounds = new google.maps.LatLngBounds();

        const validData = data.filter(item => 
            item.latitude !== null && 
            item.longitude !== null && 
            !isNaN(parseFloat(item.latitude)) && 
            !isNaN(parseFloat(item.longitude))
        );

        if (validData.length === 0) {
            console.log("🗺️ No valid data points to display");
            return;
        }

        console.log(`🗺️ Creating ${validData.length} markers`);

        validData.forEach(item => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            
            bounds.extend(new google.maps.LatLng(lat, lng));
            
            const statusValue = item.text_value ? String(item.text_value).trim().toUpperCase() : null;
            const markerColor = statusValue === 'OUVERT' ? '#4CAF50' : 
                              statusValue === 'NON' ? '#F44336' : 
                              '#757575';

            const marker = new google.maps.Marker({
                position: { lat, lng },
                map: mapRef.current,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: markerColor,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });

            const infoContent = createInfoWindowContent(item);
            const infoWindow = new google.maps.InfoWindow({ content: infoContent });
            
            marker.addListener("click", () => {
                infoWindow.open(mapRef.current, marker);
                
                if (userLocation && distanceLineRef.current) {
                    if (distanceLineRef.current.distanceLabel) {
                        distanceLineRef.current.distanceLabel.close();
                    }
                    distanceLineRef.current.setMap(null);
                }
                
                if (userLocation) {
                    const lineCoordinates = [
                        { lat: userLocation.lat, lng: userLocation.lng },
                        { lat, lng }
                    ];

                    distanceLineRef.current = new google.maps.Polyline({
                        path: lineCoordinates,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        map: mapRef.current
                    });

                    const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
                    const midpoint = {
                        lat: (userLocation.lat + lat) / 2,
                        lng: (userLocation.lng + lng) / 2
                    };

                    distanceLineRef.current.distanceLabel = new google.maps.InfoWindow({
                        content: `<div style="font-weight: bold; color: #FF0000;">${distance}</div>`,
                        position: midpoint
                    });

                    distanceLineRef.current.distanceLabel.open(mapRef.current);
                }
            });

            markersRef.current.push({ marker, data: item });
        });

        mapRef.current.fitBounds(bounds);
        google.maps.event.addListenerOnce(mapRef.current, "bounds_changed", () => {
            if (mapRef.current.getZoom() > 15) {
                mapRef.current.setZoom(15);
            }
        });
    }, [data, userLocation, calculateDistance, clearMarkers, createInfoWindowContent]);

    const initializeMap = useCallback(() => {
        if (!containerRef.current || !window.google) return;

        console.log("🗺️ Initializing Google Map...");
        const google = window.google;
        const defaultCenter = data.length > 0 && data[0].latitude && data[0].longitude
            ? { lat: parseFloat(data[0].latitude), lng: parseFloat(data[0].longitude) }
            : { lat: 0, lng: 0 };

        mapRef.current = new google.maps.Map(containerRef.current, {
            zoom: 10,
            center: defaultCenter,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true,
            gestureHandling: 'greedy'
        });

        mapRef.current.addListener("click", () => {
            if (distanceLineRef.current) {
                if (distanceLineRef.current.distanceLabel) {
                    distanceLineRef.current.distanceLabel.close();
                }
                distanceLineRef.current.setMap(null);
                distanceLineRef.current = null;
            }
        });

        console.log("✅ Google Map initialized");
    }, [data]);

    useEffect(() => {
        if (window.google) {
            initializeMap();
        }
    }, [initializeMap]);

    useEffect(() => {
        if (mapRef.current) {
            createMarkers();
        }
    }, [createMarkers]);

    return { mapRef, clearMarkers };
};