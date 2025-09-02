import React, { useState, useEffect, useRef } from "react";
import { Card, Container, Row, Col, Table, Button, Modal, Form, Alert, Spinner, Pagination } from "react-bootstrap";
import { visiteService, userService, territoryService } from "../services/apiServices";
import StyledSelect from "../components/StyledSelect";
import { useAuth } from "../contexts/AuthContext";
import "./Visite.css";

function Visite() {
  const { user } = useAuth(); // Get the authenticated user
  const [visites, setVisites] = useState([]);
  const [allVisites, setAllVisites] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVisite, setSelectedVisite] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [relatedData, setRelatedData] = useState({
    user: null,
    country: null,
    province: null,
    area: null
  });
  
  // Dropdown options data
  const codeOptions = [
    "GC 30 Juin", "GC bandal", "GC BIBWA", "GC BOKASSA", "GC CITE VERTE", "GC DELVAUX", 
    "GC MARCHE DELAUX", "GC EFOBANK", 
    ...Array.from({length: 520}, (_, i) => `ES-KIN-${String(i + 1).padStart(4, '0')}`),
    "ES-KINK-0001", "ES-KINK-0003", "ES-KINK-0004", "ES-KINK-0005", "ES-KINK-0006", 
    "ES-KINK-0007", "ES-KIN-0521", "ES-KIN-0522", "ES-KIN-0523", "ES-KIN-0524", 
    "ES-KIN-0525", "ES-KINK-0008", "ES-KINK-0009", "ES-KINK-0010", "ES-KIN-0526", 
    "ES-KIN-0527", "ES-KIN-0528", "ES-KIN-0529", "ES-KIN-0530", "ES-KIN-0531", 
    "ES-KIN-0532", "ES-KIN-0533", "ES-KIN-0534", "ES-KIN-0535", "ES-KINK-0011", 
    "ES-KINK-0012", "ES-KINK-0013", "ES-KINK-0014", "ES-KINK-0015", "ES-KINK-0016", 
    "ES-KINK-0017", "ES-KIN-0536", "ES-KIN-0537", "ES-KIN-0538", "ES-KIN-0539", 
    "ES-KIN-0540", "ES-KIN-0541", "ES-KINK-0018", "ES-KINK-0019", "ES-KINK-0020", 
    "ES-KIN-0542", "ES-KIN-0543", "ES-KIN-0544", "ES-KIN-0545", "ES-KIN-0546", 
    "ES-KIN-0547", "ES-KIN-0548", "ES-KIN-0549", "ES-KIN-0550", "ES-KIN-0551"
  ];

  const shopStatusOptions = [
    { value: "OUVERT", label: "🏪 OUVERT" },
    { value: "FERME", label: "🚫 FERMÉ" }
  ];

  const shopTypeOptions = [
    { value: "BETON", label: "🏗️ BÉTON" },
    { value: "CONTAINER", label: "📦 CONTAINER" }
  ];

  const yesNoOptions = [
    { value: "OUI", label: "✅ OUI" },
    { value: "NON", label: "❌ NON" }
  ];

  const locationQualityOptions = [
    { value: "POINT CHAUD", label: "🔥 POINT CHAUD" },
    { value: "BON", label: "👍 BON" },
    { value: "PASSABLE", label: "👌 PASSABLE" },
    { value: "MAUVIAS", label: "👎 MAUVAIS" }
  ];

  const terminalNumberOptions = Array.from({length: 7}, (_, i) => ({
    value: i.toString(),
    label: `${i} ${i === 0 ? 'terminal' : i === 1 ? 'terminal' : 'terminaux'}`
  }));
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [currentImageField, setCurrentImageField] = useState(null); // 'inside', 'outside', 'report'
  const [currentModal, setCurrentModal] = useState(null); // 'create' or 'edit'
  const [imagePreviews, setImagePreviews] = useState({
    inside: null,
    outside: null,
    report: null
  });
  const [editImagePreviews, setEditImagePreviews] = useState({
    inside: null,
    outside: null,
    report: null
  });
  
  // Refs
  const canvasRef = useRef(null);
  const initializeFormData = () => ({
    commercial: user?.fullname || "",
    code: "",
    shop: "",
    type: "",
    moved: "",
    location: "",
    presence: "",
    terminal: "",
    terminal_nb: "",
    terminal_nby: "",
    shop_nby: "",
    comment: "",
    image_inside: "",
    image_outside: "",
    image_report: "",
    latitude: "",
    longitude: "",
    // UUID fields auto-submitted, not shown in modal
    user_uuid: user?.uuid || "",
    area_uuid: user?.area_uuid || "",
    province_uuid: user?.province_uuid || "",
    country_uuid: user?.country_uuid || ""
  });

  const [formData, setFormData] = useState(initializeFormData());
  // Auto-populate latitude and longitude when modal opens
  useEffect(() => {
    if (showModal) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFormData((prev) => ({
              ...prev,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            }));
          },
          () => {
            setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
          }
        );
      }
    }
  }, [showModal]);

  // Camera functions
  const startCamera = async (imageField, modalType = 'create') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use rear camera for field work
        audio: false 
      });
      setCameraStream(stream);
      setCurrentImageField(imageField);
      setCurrentModal(modalType);
      setShowCamera(true);
    } catch (error) {
      showAlert("danger", "Error accessing camera. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCurrentImageField(null);
    setCurrentModal(null);
  };

  const capturePhoto = () => {
    if (cameraStream && currentImageField) {
      const video = document.getElementById('visite-camera-video');
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      // Update form data and preview based on current modal and field
      const fieldName = `image_${currentImageField}`;
      
      if (currentModal === 'create') {
        setFormData(prev => ({
          ...prev,
          [fieldName]: photoDataUrl
        }));
        
        setImagePreviews(prev => ({
          ...prev,
          [currentImageField]: photoDataUrl
        }));
      } else if (currentModal === 'edit') {
        setEditFormData(prev => ({
          ...prev,
          [fieldName]: photoDataUrl
        }));
        
        setEditImagePreviews(prev => ({
          ...prev,
          [currentImageField]: photoDataUrl
        }));
      }
      
      // Stop camera
      stopCamera();
      
      showAlert("success", `Photo captured for ${currentImageField} image successfully!`);
    }
  };

  const clearPhoto = (imageField, modalType = 'create') => {
    const fieldName = `image_${imageField}`;
    
    if (modalType === 'create') {
      setFormData(prev => ({
        ...prev,
        [fieldName]: ""
      }));
      setImagePreviews(prev => ({
        ...prev,
        [imageField]: null
      }));
    } else if (modalType === 'edit') {
      setEditFormData(prev => ({
        ...prev,
        [fieldName]: ""
      }));
      setEditImagePreviews(prev => ({
        ...prev,
        [imageField]: null
      }));
    }
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  const [editFormData, setEditFormData] = useState({ ...initializeFormData(), uuid: "" });
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  useEffect(() => {
    fetchVisites();
    fetchUsers();
  }, []);

  // Update formData when user data is available
  useEffect(() => {
    if (user?.fullname) {
      setFormData(initializeFormData());
    }
  }, [user]);

  const fetchVisites = async () => {
    setLoading(true);
    try {
      const response = await visiteService.getAll();
      if (response.status === "success") {
        // Use all visites directly - no more filtering for deleted_at
        setAllVisites(response.data);
        setTotalRecords(response.data.length);
        
        // Set initial page data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setVisites(response.data.slice(startIndex, endIndex));
      }
    } catch (error) {
      showAlert("danger", "Failed to load visites: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll();
      if (response.status === "success") {
        setUsers(response.data);
      }
    } catch (error) {
      showAlert("danger", "Failed to load users: " + error.message);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Update displayed visites when pagination changes
  useEffect(() => {
    if (allVisites.length > 0) {
      const currentVisites = allVisites.slice(startIndex, endIndex);
      setVisites(currentVisites);
    }
  }, [currentPage, itemsPerPage, allVisites, startIndex, endIndex]);

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Helper function to get user options for dropdown
  const getUserOptions = () => {
    return users.map(user => ({
      value: user.fullname,
      label: `👤 ${user.fullname}`
    }));
  };

  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => setAlert({ show: false, variant: "", message: "" }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Create a clean form data object with only the required fields
      const createData = {
        commercial: formData.commercial,
        code: formData.code,
        shop: formData.shop,
        type: formData.type,
        moved: formData.moved,
        location: formData.location,
        presence: formData.presence,
        terminal: formData.terminal,
        terminal_nb: formData.terminal_nb,
        terminal_nby: formData.terminal_nby,
        shop_nby: formData.shop_nby,
        comment: formData.comment,
        image_inside: formData.image_inside,
        image_outside: formData.image_outside,
        image_report: formData.image_report,
        latitude: formData.latitude,
        longitude: formData.longitude,
        user_uuid: formData.user_uuid,
        area_uuid: formData.area_uuid,
        province_uuid: formData.province_uuid,
        country_uuid: formData.country_uuid
      };

      // Ensure no timestamp fields are accidentally included
      delete createData.created_at;
      delete createData.updated_at;
      
      // Debug: Log the data being sent to verify no timestamp fields
      console.log('Create data being sent (no timestamps):', createData);
      console.log('Fields included:', Object.keys(createData));
      
      const response = await visiteService.create(createData);
      if (response.status === "success") {
        showAlert("success", "Visite created successfully!");
        setShowModal(false);
        setFormData(initializeFormData());
        setImagePreviews({
          inside: null,
          outside: null,
          report: null
        });
        fetchVisites();
      }
    } catch (error) {
      showAlert("danger", "Failed to create visite: " + error.message);
    }
  };

  const handleEdit = (visite) => {
    // Auto-update specific fields with current user data and location
    const updatedVisite = {
      ...visite,
      user_uuid: user?.uuid || visite.user_uuid || "",
      area_uuid: user?.area_uuid || visite.area_uuid || "",
      province_uuid: user?.province_uuid || visite.province_uuid || "",
      country_uuid: user?.country_uuid || visite.country_uuid || ""
    };

    // Get current location for auto-update
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updatedVisite.latitude = position.coords.latitude.toString();
          updatedVisite.longitude = position.coords.longitude.toString();
          setEditFormData(updatedVisite);
        },
        () => {
          // If geolocation fails, keep existing coordinates
          setEditFormData(updatedVisite);
        }
      );
    } else {
      setEditFormData(updatedVisite);
    }

    // Set edit image previews based on existing data
    setEditImagePreviews({
      inside: visite.image_inside || null,
      outside: visite.image_outside || null,
      report: visite.image_report || null
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Create update data
      const updateData = { ...editFormData };
      
      const response = await visiteService.update(editFormData.uuid, updateData);
      if (response.status === "success") {
        showAlert("success", "Visite updated successfully!");
        setShowEditModal(false);
        fetchVisites();
      }
    } catch (error) {
      showAlert("danger", "Failed to update visite: " + error.message);
    }
  };

  const handleDelete = (visite) => {
    setSelectedVisite(visite);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      console.log('Attempting hard delete for visite:', selectedVisite.uuid);
      
      // Use hard delete - permanently removes from database
      const response = await visiteService.delete(selectedVisite.uuid);
      
      console.log('Hard delete response:', response);
      
      if (response.status === "success") {
        showAlert("success", "Visite deleted permanently!");
        setShowDeleteModal(false);
        // Ensure we refresh the data after deletion
        await fetchVisites();
      } else {
        showAlert("warning", "Delete operation completed but status unclear. Please refresh to verify.");
        setShowDeleteModal(false);
        fetchVisites();
      }
    } catch (error) {
      console.error('Delete error:', error);
      showAlert("danger", "Failed to delete visite: " + error.message);
    }
  };
  
  // Function to handle viewing visite details
  const handleView = async (visite) => {
    setSelectedVisite(visite);
    setLoadingDetails(true);
    setRelatedData({
      user: null,
      country: null,
      province: null,
      area: null
    });
    
    try {
      // Get visite details first
      const response = await visiteService.getByUuid(visite.uuid);
      
      if (response.status === "success") {
        const visiteData = response.data;
        setViewDetails(visiteData);
        
        // Fetch related data in parallel
        const promises = [];
        
        // Fetch user data if user_uuid exists
        if (visiteData.user_uuid) {
          promises.push(
            userService.getByUuid(visiteData.user_uuid)
              .then(resp => {
                if (resp.status === "success") {
                  return { type: 'user', data: resp.data };
                }
                return { type: 'user', data: null };
              })
              .catch(() => ({ type: 'user', data: null }))
          );
        }
        
        // Fetch country data if country_uuid exists
        if (visiteData.country_uuid) {
          promises.push(
            territoryService.countries.getByUuid(visiteData.country_uuid)
              .then(resp => {
                if (resp.status === "success") {
                  return { type: 'country', data: resp.data };
                }
                return { type: 'country', data: null };
              })
              .catch(() => ({ type: 'country', data: null }))
          );
        }
        
        // Fetch province data if province_uuid exists
        if (visiteData.province_uuid) {
          promises.push(
            territoryService.provinces.getByUuid(visiteData.province_uuid)
              .then(resp => {
                if (resp.status === "success") {
                  return { type: 'province', data: resp.data };
                }
                return { type: 'province', data: null };
              })
              .catch(() => ({ type: 'province', data: null }))
          );
        }
        
        // Fetch area data if area_uuid exists
        if (visiteData.area_uuid) {
          promises.push(
            territoryService.areas.getByUuid(visiteData.area_uuid)
              .then(resp => {
                if (resp.status === "success") {
                  return { type: 'area', data: resp.data };
                }
                return { type: 'area', data: null };
              })
              .catch(() => ({ type: 'area', data: null }))
          );
        }
        
        // Wait for all promises to resolve
        if (promises.length > 0) {
          const results = await Promise.all(promises);
          
          // Process results
          const newRelatedData = {
            user: null,
            country: null,
            province: null,
            area: null
          };
          
          results.forEach(result => {
            if (result.data) {
              newRelatedData[result.type] = result.data;
            }
          });
          
          setRelatedData(newRelatedData);
        }
        
        setShowViewModal(true);
      } else {
        showAlert("warning", "Could not retrieve full details for this visite.");
      }
    } catch (error) {
      console.error('View details error:', error);
      showAlert("danger", "Failed to load visite details: " + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col md="12">
          <Card className="strpied-tabled-with-hover">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title as="h4">
                    <i className="nc-icon nc-paper mr-2"></i>
                    Gestion des Visites
                  </Card.Title>
                  <p className="card-category">
                    Gérer les visites et rapports terrain
                  </p>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => setShowModal(true)}
                  className="mb-2"
                >
                  <i className="nc-icon nc-simple-add mr-2"></i>
                  Nouvelle Visite
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="table-full-width px-0">
              {alert.show && <Alert variant={alert.variant} className="mx-3">{alert.message}</Alert>}
              {loading ? (
                <div className="text-center p-4">
                  <i className="nc-icon nc-refresh-69 fa-spin"></i> Chargement des visites...
                </div>
              ) : (
                <Table className="table-hover table-striped">
                  <thead className="bg-gradient-primary">
                    <tr>
                      <th className="border-0" style={{color: '#495057', width: '12%', whiteSpace: 'normal', wordWrap: 'break-word'}}>Commercial</th>
                      <th className="border-0" style={{color: '#495057', width: '8%', whiteSpace: 'normal', wordWrap: 'break-word'}}>CODE DU ES/MS/GC</th>
                      <th className="border-0" style={{color: '#495057', width: '8%', whiteSpace: 'normal', wordWrap: 'break-word'}}>SHOP OUVERT OU FERMÉ A L'ARRIVÉE</th>
                      <th className="border-0" style={{color: '#495057', width: '6%', whiteSpace: 'normal', wordWrap: 'break-word'}}>TYPE DU SHOP</th>
                      <th className="border-0" style={{color: '#495057', width: '6%', whiteSpace: 'normal', wordWrap: 'break-word'}}>LE SHOP A CHANGÉ D'EMPLACEMENT DURANT LES 3 DERNIERS MOIS</th>
                      <th className="border-0" style={{color: '#495057', width: '8%', whiteSpace: 'normal', wordWrap: 'break-word'}}>QUALITE EMPLACEMENT</th>
                      <th className="border-0" style={{color: '#495057', width: '6%', whiteSpace: 'normal', wordWrap: 'break-word'}}>PRESENCE ENSEIGNE</th>
                      <th className="border-0" style={{color: '#495057', width: '7%', whiteSpace: 'normal', wordWrap: 'break-word'}}>LE PROPRIETAIRE A T'IL UN TERMINAL QUI L'APPARTIENT DEVANT SON EXPRESS</th>
                      <th className="border-0" style={{color: '#495057', width: '6%', whiteSpace: 'normal', wordWrap: 'break-word'}}>NOMBRE DES TERMINAUX A PROXIMITE (JUSQU'A 100 METRES)</th>
                      <th className="border-0" style={{color: '#495057', width: '6%', whiteSpace: 'normal', wordWrap: 'break-word'}}>SHOP CONCURRENT A PROXIMITÉ</th>
                      <th className="border-0" style={{color: '#495057', width: '15%', whiteSpace: 'normal', wordWrap: 'break-word'}}>VOS COMMENTAIRES</th>
                      <th className="border-0 text-center" style={{color: '#495057', width: '12%'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visites.map((visite, index) => (
                      <tr key={visite.uuid} className="visite-row">
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="icon mr-3" style={{fontSize: '16px'}}>
                              👤
                            </div>
                            <div>
                              <strong style={{fontSize: '14px'}}>{visite.commercial}</strong>
                            </div>
                          </div>
                        </td>
                        <td>{visite.code}</td>
                        <td>{visite.shop}</td>
                        <td>{visite.type}</td>
                        <td>{visite.moved}</td>
                        <td>{visite.location}</td>
                        <td>{visite.presence}</td>
                        <td>{visite.terminal}</td>
                        <td>{visite.terminal_nb}</td>
                        <td>{visite.terminal_nby}</td>
                        <td className="td-comment" title={visite.comment}>{visite.comment}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleView(visite)} 
                              title="Voir les détails"
                              style={{borderRadius: '6px'}}
                            >
                              <i className="nc-icon nc-zoom-split" style={{color: '#007bff'}}></i>
                            </Button>
                            <Button 
                              variant="outline-info" 
                              size="sm" 
                              onClick={() => handleEdit(visite)} 
                              title="Modifier"
                              style={{borderRadius: '6px'}}
                            >
                              <i className="nc-icon nc-ruler-pencil" style={{color: '#17a2b8'}}></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(visite)} 
                              title="Supprimer"
                              style={{borderRadius: '6px'}}
                            >
                              <i className="nc-icon nc-simple-remove" style={{color: '#dc3545'}}></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              
              {/* Pagination Component */}
              {!loading && totalRecords > 0 && (
                <div className="pagination-container">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="pagination-info">
                      Page {currentPage} of {totalPages} • Showing {visites.length > 0 ? (startIndex + 1) : 0} to{' '}
                      {Math.min(endIndex, totalRecords)} of {totalRecords} visites
                    </small>
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        title="First Page"
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        title="Previous Page"
                      >
                        <i className="fas fa-angle-left"></i>
                      </Button>
                      <span className="mx-3 fw-bold">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        title="Next Page"
                      >
                        <i className="fas fa-angle-right"></i>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Last Page"
                      >
                        <i className="fas fa-angle-double-right"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} className="visite-modal" size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>✨ Nouvelle Visite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Form.Group className="mb-3">
              <Form.Label>COMMERCIAL *</Form.Label>
              <div className="commercial-display">
                <Form.Control 
                  type="text"
                  value={user?.fullname || "Loading..."}
                  readOnly
                  style={{
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed',
                    fontWeight: '600',
                    color: '#495057'
                  }}
                />
                {/* <small className="text-muted">Utilisateur connecté</small> */}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CODE DU ES/MS/GC *</Form.Label>
              <StyledSelect
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                options={codeOptions}
                placeholder="Sélectionner un code..."
                searchable={true}
                required={true}
                icon="🏷️"
                maxHeight="250px"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SHOP OUVERT OU FERMÉ À L'ARRIVÉE ? *</Form.Label>
              <StyledSelect
                name="shop"
                value={formData.shop}
                onChange={handleInputChange}
                options={shopStatusOptions}
                placeholder="Statut du shop..."
                required={true}
                icon="🏪"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>TYPE DU SHOP ? *</Form.Label>
              <StyledSelect
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                options={shopTypeOptions}
                placeholder="Type de shop..."
                required={true}
                icon="🏗️"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>LE SHOP A CHANGÉ D'EMPLACEMENT DURANT LES 3 DERNIERS MOIS ? *</Form.Label>
              <StyledSelect
                name="moved"
                value={formData.moved}
                onChange={handleInputChange}
                options={yesNoOptions}
                placeholder="Changement d'emplacement..."
                required={true}
                icon="📍"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>QUALITÉ EMPLACEMENT *</Form.Label>
              <StyledSelect
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                options={locationQualityOptions}
                placeholder="Qualité de l'emplacement..."
                required={true}
                icon="⭐"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>PRÉSENCE ENSEIGNE *</Form.Label>
              <StyledSelect
                name="presence"
                value={formData.presence}
                onChange={handleInputChange}
                options={yesNoOptions}
                placeholder="Présence d'enseigne..."
                required={true}
                icon="🪧"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>LE PROPRIÉTAIRE A-T-IL UN TERMINAL QUI LUI APPARTIENT DEVANT SON EXPRESS ? *</Form.Label>
              <StyledSelect
                name="terminal"
                value={formData.terminal}
                onChange={handleInputChange}
                options={yesNoOptions}
                placeholder="Terminal propriétaire..."
                required={true}
                icon="💳"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>NOMBRE DES TERMINAUX À PROXIMITÉ (JUSQU'À 100 MÈTRES) *</Form.Label>
              <StyledSelect
                name="terminal_nb"
                value={formData.terminal_nb}
                onChange={handleInputChange}
                options={terminalNumberOptions}
                placeholder="Nombre de terminaux..."
                required={true}
                icon="🔢"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>TERMINAL 1 À PROXIMITÉ *</Form.Label>
              <Form.Control 
                name="terminal_nby" 
                value={formData.terminal_nby} 
                onChange={handleInputChange} 
                placeholder="Description du terminal..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SHOP CONCURRENT À PROXIMITÉ *</Form.Label>
              <StyledSelect
                name="shop_nby"
                value={formData.shop_nby}
                onChange={handleInputChange}
                options={yesNoOptions}
                placeholder="Shop concurrent..."
                required={true}
                icon="🏪"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>VOS COMMENTAIRES *</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                name="comment" 
                value={formData.comment} 
                onChange={handleInputChange}
                placeholder="Vos commentaires..."
              />
            </Form.Group>
            
            {/* Image Inside */}
            <Form.Group>
              <Form.Label>Image Intérieure</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('inside')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {imagePreviews.inside && (
                <div className="mt-2 text-center">
                  <img 
                    src={imagePreviews.inside} 
                    alt="Image Inside Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('inside')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            
            {/* Image Outside */}
            <Form.Group>
              <Form.Label>Image Extérieure</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('outside')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {imagePreviews.outside && (
                <div className="mt-2 text-center">
                  <img 
                    src={imagePreviews.outside} 
                    alt="Image Outside Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('outside')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            
            {/* Image Report */}
            <Form.Group>
              <Form.Label>Image Rapport</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('report')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {imagePreviews.report && (
                <div className="mt-2 text-center">
                  <img 
                    src={imagePreviews.report} 
                    alt="Image Report Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('report')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            {/* Latitude and Longitude are auto-populated and hidden */}
            {/* UUID fields are auto-submitted and hidden */}
            <Button type="submit" className="btn btn-primary">
              <i className="fas fa-save me-2"></i>Créer la Visite
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} className="visite-modal" size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Modifier la Visite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>COMMERCIAL *</Form.Label>
              <div className="commercial-display">
                <Form.Control 
                  type="text"
                  value={editFormData.commercial || ""}
                  readOnly
                  style={{
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed',
                    fontWeight: '600',
                    color: '#495057'
                  }}
                />
                <small className="text-muted">Commercial original (non modifiable)</small>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CODE DU ES/MS/GC *</Form.Label>
              <StyledSelect
                name="code"
                value={editFormData.code}
                onChange={handleEditInputChange}
                options={codeOptions}
                placeholder="Sélectionner un code..."
                searchable={true}
                required={true}
                icon="🏷️"
                maxHeight="250px"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SHOP OUVERT OU FERMÉ À L'ARRIVÉE ? *</Form.Label>
              <StyledSelect
                name="shop"
                value={editFormData.shop}
                onChange={handleEditInputChange}
                options={shopStatusOptions}
                placeholder="Statut du shop..."
                required={true}
                icon="🏪"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>TYPE DU SHOP ? *</Form.Label>
              <StyledSelect
                name="type"
                value={editFormData.type}
                onChange={handleEditInputChange}
                options={shopTypeOptions}
                placeholder="Type de shop..."
                required={true}
                icon="🏗️"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>LE SHOP A CHANGÉ D'EMPLACEMENT DURANT LES 3 DERNIERS MOIS ? *</Form.Label>
              <StyledSelect
                name="moved"
                value={editFormData.moved}
                onChange={handleEditInputChange}
                options={yesNoOptions}
                placeholder="Changement d'emplacement..."
                required={true}
                icon="📍"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>QUALITÉ EMPLACEMENT *</Form.Label>
              <StyledSelect
                name="location"
                value={editFormData.location}
                onChange={handleEditInputChange}
                options={locationQualityOptions}
                placeholder="Qualité de l'emplacement..."
                required={true}
                icon="⭐"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>PRÉSENCE ENSEIGNE *</Form.Label>
              <StyledSelect
                name="presence"
                value={editFormData.presence}
                onChange={handleEditInputChange}
                options={yesNoOptions}
                placeholder="Présence d'enseigne..."
                required={true}
                icon="🪧"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>LE PROPRIÉTAIRE A-T-IL UN TERMINAL QUI LUI APPARTIENT DEVANT SON EXPRESS ? *</Form.Label>
              <StyledSelect
                name="terminal"
                value={editFormData.terminal}
                onChange={handleEditInputChange}
                options={yesNoOptions}
                placeholder="Terminal propriétaire..."
                required={true}
                icon="💳"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>NOMBRE DES TERMINAUX À PROXIMITÉ (JUSQU'À 100 MÈTRES) *</Form.Label>
              <StyledSelect
                name="terminal_nb"
                value={editFormData.terminal_nb}
                onChange={handleEditInputChange}
                options={terminalNumberOptions}
                placeholder="Nombre de terminaux..."
                required={true}
                icon="🔢"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>TERMINAL 1 À PROXIMITÉ *</Form.Label>
              <Form.Control 
                name="terminal_nby" 
                value={editFormData.terminal_nby} 
                onChange={handleEditInputChange}
                placeholder="Description du terminal..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>SHOP CONCURRENT À PROXIMITÉ *</Form.Label>
              <StyledSelect
                name="shop_nby"
                value={editFormData.shop_nby}
                onChange={handleEditInputChange}
                options={yesNoOptions}
                placeholder="Shop concurrent..."
                required={true}
                icon="🏪"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>VOS COMMENTAIRES *</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                name="comment" 
                value={editFormData.comment} 
                onChange={handleEditInputChange}
                placeholder="Vos commentaires..."
              />
            </Form.Group>
            
            {/* Image Inside */}
            <Form.Group>
              <Form.Label>Image Intérieure</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('inside', 'edit')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {editImagePreviews.inside && (
                <div className="mt-2 text-center">
                  <img 
                    src={editImagePreviews.inside} 
                    alt="Image Inside Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('inside', 'edit')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            
            {/* Image Outside */}
            <Form.Group>
              <Form.Label>Image Extérieure</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('outside', 'edit')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {editImagePreviews.outside && (
                <div className="mt-2 text-center">
                  <img 
                    src={editImagePreviews.outside} 
                    alt="Image Outside Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('outside', 'edit')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            
            {/* Image Report */}
            <Form.Group>
              <Form.Label>Image Rapport</Form.Label>
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => startCamera('report', 'edit')}
                  style={{ width: "100%" }}
                >
                  <i className="fas fa-camera"></i> Prendre une photo
                </Button>
              </div>
              {editImagePreviews.report && (
                <div className="mt-2 text-center">
                  <img 
                    src={editImagePreviews.report} 
                    alt="Image Report Preview" 
                    style={{ maxHeight: "100px", maxWidth: "100%" }}
                    className="img-thumbnail"
                  />
                  <div className="mt-1">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => clearPhoto('report', 'edit')}
                    >
                      <i className="fas fa-trash"></i> Clear
                    </Button>
                  </div>
                </div>
              )}
            </Form.Group>
            
            <Button type="submit" className="btn btn-primary">
              <i className="fas fa-save me-2"></i>Mettre à Jour
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} className="visite-modal" centered>
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Confirmer la Suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle text-warning" style={{fontSize: '48px'}}></i>
            </div>
            <h5>Êtes-vous sûr de vouloir supprimer cette visite ?</h5>
            <p className="text-muted">Cette action est irréversible.</p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                <i className="fas fa-times me-2"></i>Annuler
              </Button>
              <Button variant="danger" onClick={confirmDelete}>
                <i className="fas fa-trash me-2"></i>Supprimer
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Camera Modal */}
      <Modal 
        show={showCamera} 
        onHide={stopCamera}
        size="lg"
        backdrop="static"
        className="camera-modal"
        centered
      >
        <div className="camera-modal-content">
          <Modal.Header className="camera-modal-header">
            <Modal.Title>
              <i className="fas fa-camera"></i>
              Prendre une photo - {currentImageField && currentImageField.charAt(0).toUpperCase() + currentImageField.slice(1)}
            </Modal.Title>
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={stopCamera}
            >
              <i className="fas fa-times"></i>
            </button>
          </Modal.Header>
          <Modal.Body className="camera-modal-body">
            <div className="camera-container">
              <video
                id="visite-camera-video"
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                    video.play();
                  }
                }}
                className="camera-video"
                autoPlay
                playsInline
                style={{ 
                  width: "100%",
                  maxHeight: "400px",
                  borderRadius: "10px"
                }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="camera-modal-footer">
            <Button 
              variant="outline-secondary" 
              onClick={stopCamera}
              className="mr-2"
            >
              <i className="fas fa-times mr-1"></i>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={capturePhoto}
              className="btn-enhanced btn-primary-enhanced"
            >
              <i className="fas fa-camera mr-1"></i>
              Prendre la photo
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
      
      {/* View Details Modal */}
      <Modal 
        show={showViewModal} 
        onHide={() => setShowViewModal(false)} 
        className="visite-modal" 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>👁️ Détails de la Visite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetails ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des détails...</p>
            </div>
          ) : viewDetails ? (
            <div className="visite-details">
              <Row>
                <Col md={6}>
                  <h5 className="details-section-title">Informations Générales</h5>
                  <Table bordered hover size="sm" className="details-table">
                    <tbody>
                      <tr>
                        <th>Commercial</th>
                        <td className="details-td">{viewDetails.commercial}</td>
                      </tr>
                      <tr>
                        <th>CODE DU ES/MS/GC</th>
                        <td className="details-td">{viewDetails.code}</td>
                      </tr>
                      <tr>
                        <th>SHOP OUVERT OU FERMÉ A L'ARRIVÉE</th>
                        <td className="details-td">{viewDetails.shop}</td>
                      </tr>
                      <tr>
                        <th>TYPE DU SHOP</th>
                        <td className="details-td">{viewDetails.type}</td>
                      </tr>
                      <tr>
                        <th>LE SHOP A CHANGÉ D'EMPLACEMENT DURANT LES 3 DERNIERS MOIS</th>
                        <td className="details-td">{viewDetails.moved}</td>
                      </tr>
                      <tr>
                        <th>QUALITE EMPLACEMENT</th>
                        <td className="details-td">{viewDetails.location}</td>
                      </tr>
                      <tr>
                        <th>PRESENCE ENSEIGNE</th>
                        <td className="details-td">{viewDetails.presence}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h5 className="details-section-title">Terminal & Shop</h5>
                  <Table bordered hover size="sm" className="details-table">
                    <tbody>
                      <tr>
                        <th>LE PROPRIETAIRE A T'IL UN TERMINAL QUI L'APPARTIENT DEVANT SON EXPRESS</th>
                        <td className="details-td">{viewDetails.terminal}</td>
                      </tr>
                      <tr>
                        <th>NOMBRE DES TERMINAUX A PROXIMITE (JUSQU'A 100 METRES)</th>
                        <td className="details-td">{viewDetails.terminal_nb}</td>
                      </tr>
                      <tr>
                        <th>Terminal Nby</th>
                        <td className="details-td">{viewDetails.terminal_nby}</td>
                      </tr>
                      <tr>
                        <th>SHOP CONCURRENT A PROXIMITÉ</th>
                        <td className="details-td">{viewDetails.shop_nby}</td>
                      </tr>
                      <tr>
                        <th>Latitude</th>
                        <td className="details-td">{viewDetails.latitude}</td>
                      </tr>
                      <tr>
                        <th>Longitude</th>
                        <td className="details-td">{viewDetails.longitude}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              
              <Row className="mt-3">
                <Col md={12}>
                  <h5 className="details-section-title">VOS COMMENTAIRES</h5>
                  <div className="comment-box">
                    {viewDetails.comment || "Aucun commentaire"}
                  </div>
                </Col>
              </Row>
              
              <h5 className="details-section-title mt-4">Références</h5>
              <Table bordered hover size="sm" className="details-table">
                <tbody>
                  <tr>
                    <th>Commercial</th>
                    <td className="details-td">
                      {relatedData.user ? (
                        <span>{relatedData.user.fullname || 'N/A'}</span>
                      ) : viewDetails.user_uuid ? (
                        <span className="loading-placeholder">
                          <small className="text-muted">Chargement...</small>
                        </span>
                      ) : (
                        <span className="text-muted">Non spécifié</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Zone</th>
                    <td className="details-td">
                      {relatedData.area ? (
                        <span>{relatedData.area.name || 'N/A'}</span>
                      ) : viewDetails.area_uuid ? (
                        <span className="loading-placeholder">
                          <small className="text-muted">Chargement...</small>
                        </span>
                      ) : (
                        <span className="text-muted">Non spécifié</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Province</th>
                    <td className="details-td">
                      {relatedData.province ? (
                        <span>{relatedData.province.name || 'N/A'}</span>
                      ) : viewDetails.province_uuid ? (
                        <span className="loading-placeholder">
                          <small className="text-muted">Chargement...</small>
                        </span>
                      ) : (
                        <span className="text-muted">Non spécifié</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Pays</th>
                    <td className="details-td">
                      {relatedData.country ? (
                        <span>{relatedData.country.name || 'N/A'}</span>
                      ) : viewDetails.country_uuid ? (
                        <span className="loading-placeholder">
                          <small className="text-muted">Chargement...</small>
                        </span>
                      ) : (
                        <span className="text-muted">Non spécifié</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>ID de Référence</th>
                    <td className="details-td uuid-cell">{viewDetails.uuid}</td>
                  </tr>
                </tbody>
              </Table>
              
              <h5 className="details-section-title mt-4">Images</h5>
              <Row>
                {viewDetails.image_inside && (
                  <Col md={4} className="mb-3">
                    <div className="image-preview-container">
                      <h6>Image Intérieure</h6>
                      <img 
                        src={viewDetails.image_inside} 
                        alt="Interior" 
                        className="img-fluid img-thumbnail" 
                      />
                    </div>
                  </Col>
                )}
                {viewDetails.image_outside && (
                  <Col md={4} className="mb-3">
                    <div className="image-preview-container">
                      <h6>Image Extérieure</h6>
                      <img 
                        src={viewDetails.image_outside} 
                        alt="Exterior" 
                        className="img-fluid img-thumbnail" 
                      />
                    </div>
                  </Col>
                )}
                {viewDetails.image_report && (
                  <Col md={4} className="mb-3">
                    <div className="image-preview-container">
                      <h6>Image Rapport</h6>
                      <img 
                        src={viewDetails.image_report} 
                        alt="Report" 
                        className="img-fluid img-thumbnail" 
                      />
                    </div>
                  </Col>
                )}
              </Row>
              
              <h5 className="details-section-title mt-4">Timestamps</h5>
              <Table bordered hover size="sm">
                <tbody>
                  <tr>
                    <th>Créé le</th>
                    <td>{new Date(viewDetails.created_at).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th>Mis à jour le</th>
                    <td>{new Date(viewDetails.updated_at).toLocaleString()}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Aucune donnée disponible</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            <i className="fas fa-times me-2"></i>Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Container>
  );
}

export default Visite;
