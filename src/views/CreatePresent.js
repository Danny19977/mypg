/*!

=========================================================
* TeamOnSite (TOS) - Create Present Form
=========================================================

* Modern present creation form with camera capture
* GPS location tracking and user authentication
* Responsive design with real-time validations

=========================================================

*/
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Card,
  Form,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Modal,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useVisiteActions } from "../hooks/useApi";
import "../assets/css/CreatePresent.css";

function CreatePresent() {
  // Authentication context
  const { user, isAuthenticated } = useAuth();
  
  // Visite actions hook
  const { createVisite, loading, error } = useVisiteActions();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    sup: "",
    activity: "",
    photo: "",
    latitude: "",
    longitude: "",
  });
  
  // UI state
  const [notification, setNotification] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs for camera
  const canvasRef = useRef(null);
  
  // Activity options
  const activityOptions = [
    { value: "Sales", label: "Sales" },
    { value: "Deli", label: "Deli" },
  ];
  
  // Auto-fill user name and get GPS location when component mounts
  useEffect(() => {
    if (user && user.fullname) {
      setFormData(prev => ({
        ...prev,
        name: user.fullname
      }));
    }
    
    // Automatically get GPS location when component loads
    getCurrentLocation();
  }, [user]);
  
  // Get current location
  const getCurrentLocation = () => {
    setLocationStatus("loading");
    
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setNotification({
        type: "danger",
        message: "Geolocation is not supported by this browser."
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        setLocationStatus("success");
        // Hide the success notification message
        // setNotification({
        //   type: "success",
        //   message: "Location captured successfully!"
        // });
      },
      (error) => {
        setLocationStatus("error");
        let errorMessage = "Unable to retrieve your location.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        
        setNotification({
          type: "danger",
          message: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use rear camera for field work
        audio: false 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      setNotification({
        type: "danger",
        message: "Error accessing camera. Please allow camera permissions and try again."
      });
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };
  
  // Capture photo
  const capturePhoto = () => {
    if (cameraStream) {
      const video = document.getElementById('present-camera-video');
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      // Update form data and preview
      setFormData(prev => ({
        ...prev,
        photo: photoDataUrl
      }));
      setPhotoPreview(photoDataUrl);
      
      // Stop camera
      stopCamera();
      
      setNotification({
        type: "success",
        message: "Photo captured successfully!"
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.sup.trim()) {
      errors.sup = "Supervisor name is required";
    }
    
    if (!formData.activity) {
      errors.activity = "Activity type is required";
    }
    
    if (!formData.photo) {
      errors.photo = "Photo is required";
    }
    
    if (!formData.latitude || !formData.longitude) {
      errors.location_coords = "GPS location is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        type: "danger",
        message: "Please fill in all required fields correctly."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the present record
          const presentData = {
            ...formData,
            country_uuid: user.country_uuid || "",
            province_uuid: user.province_uuid || "",
            area_uuid: user.area_uuid || "",
            user_uuid: user.uuid || "",
            signature: user.fullname || "", // Add signature as user's name
          };
      
      await createVisite(presentData);
      
      setNotification({
        type: "success",
        message: "Present record created successfully!"
      });
      
      // Reset form
      setFormData({
        name: user?.fullname || "",
        location: "", // Keep for backend compatibility but hidden from user
        sup: "",
        activity: "",
        photo: "",
        latitude: "",
        longitude: "",
      });
      setPhotoPreview(null);
      setLocationStatus("idle");
      setValidationErrors({});
      
    } catch (error) {
      setNotification({
        type: "danger",
        message: error.message || "Failed to create present record"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Clear photo
  const clearPhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: ""
    }));
    setPhotoPreview(null);
  };
  
  // Component cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  if (!isAuthenticated) {
    return (
      <Container fluid>
        <Row className="justify-content-center">
          <Col md="6">
            <Alert variant="warning" className="text-center">
                  <h4>Authentification requise</h4>
                  <p>Veuillez vous connecter pour créer un enregistrement de présence.</p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }
  
  return (
    <>
      <Container fluid>
        {/* Notification Alert */}
        {notification && (
          <Row>
            <Col md="12">
              <Alert 
                variant={notification.type} 
                dismissible 
                onClose={() => setNotification(null)}
                className="alert-enhanced mb-4"
              >
                <strong>
                  <i className={`nc-icon ${notification.type === "success" ? "nc-check-2" : "nc-alert-circle-i"} mr-2`}></i>
                    {notification.type === "success" ? "Succès !" : "Erreur !"}
                </strong> {notification.message}
              </Alert>
            </Col>
          </Row>
        )}
        
        <Row className="justify-content-center">
          <Col md="8" lg="6">
            <Card className="create-present-card shadow-lg">
              <Card.Header className="bg-primary text-white">
                <Row className="align-items-center">
                  <Col>
                    <Card.Title as="h4" className="mb-0">
                      <i className="nc-icon nc-check-2 form-icon mr-2"></i>
                      Créer un enregistrement de présence
                    </Card.Title>
                    <p className="card-category mb-0 text-light">
                      Enregistrez votre présence sur le terrain et votre activité
                    </p>
                  </Col>
                  <Col xs="auto">
                    <Badge 
                      className={`location-status-badge ${
                        locationStatus === "success" ? "success" : 
                        locationStatus === "loading" ? "warning" : 
                        "inactive"
                      }`}
                    >
                      <i className={`nc-icon ${
                        locationStatus === "success" ? "nc-pin-3" : 
                        locationStatus === "loading" ? "nc-refresh-69" : 
                        "nc-alert-circle-i"
                      } mr-1`}></i>
                      GPS {
                        locationStatus === "success" ? "Captured" : 
                        locationStatus === "loading" ? "Detecting..." : 
                        "Failed"
                      }
                    </Badge>
                  </Col>
                </Row>
              </Card.Header>
              
              <Card.Body className="px-4 py-4">
                <Form onSubmit={handleSubmit}>
      {/* Nom de Hostess (Rempli automatiquement, lecture seule) */}
                  <Row>
                    <Col md="12">
                      <Form.Group className="form-group-enhanced form-group-success">
                        <Form.Label className="font-weight-bold">
                          <i className="nc-icon nc-single-02 form-icon primary mr-2"></i>
        Nom de Hostess
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          readOnly
                        />
                        <Form.Text className="text-muted">
                          <i className="nc-icon nc-check-2 text-success mr-1"></i>
        Rempli automatiquement à partir de votre profil
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
      {/* Zone de travail (correspond à l'emplacement) */}
                  <Row>
                    <Col md="12">
                      <Form.Group className="form-group-enhanced">
                        <Form.Label className="font-weight-bold">
                          <i className="nc-icon nc-pin-3 form-icon info mr-2"></i>
        Zone de travail <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Enter area working"
                          isInvalid={!!validationErrors.location}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.location}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
      {/* Nom du superviseur */}
                  <Row>
                    <Col md="12">
                      <Form.Group className="form-group-enhanced">
                        <Form.Label className="font-weight-bold">
                          <i className="nc-icon nc-badge form-icon secondary mr-2"></i>
        Nom du superviseur <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="sup"
                          value={formData.sup}
                          onChange={handleInputChange}
                          placeholder="Enter your supervisor's name"
                          isInvalid={!!validationErrors.sup}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.sup}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {/* Type d'activité */}
                  <Row>
                    <Col md="12">
                      <Form.Group className="form-group-enhanced">
                        <Form.Label className="font-weight-bold">
                          <i className="nc-icon nc-bullet-list-67 form-icon success mr-2"></i>
                          Type d'activité <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="activity"
                          value={formData.activity}
                          onChange={handleInputChange}
                          isInvalid={!!validationErrors.activity}
                          className="activity-select"
                        >
                          <option value="" disabled hidden>
                            Sélectionnez le type d'activité
                          </option>
                          {activityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label === "Sales" ? "Vente" : option.label === "Deli" ? "Dépôt" : option.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.activity}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  {/* Photo Capture Section */}
                  <Row>
                    <Col md="12">
                      <Form.Group className="form-group-enhanced">
                        <Form.Label className="font-weight-bold">
                          <i className="nc-icon nc-camera-compact form-icon danger mr-2"></i>
                          Prise de photo <span className="text-danger">*</span>
                        </Form.Label>
                        {/* Section de capture photo */}
                        <div className="camera-section">
                          {photoPreview ? (
                            <div className="text-center">
                              <div className="position-relative d-inline-block">
                                <img
                                  src={photoPreview}
                                  alt="Photo prise"
                                  className="photo-preview img-fluid"
                                  style={{ maxHeight: "250px" }}
                                />
                                <div
                                  className="photo-remove-btn"
                                  onClick={clearPhoto}
                                  role="button"
                                  tabIndex="0"
                                  onKeyPress={(e) => e.key === 'Enter' && clearPhoto()}
                                >
                                  <i className="nc-icon nc-simple-remove"></i>
                                </div>
                              </div>
                              <div className="mt-3">
                                <Badge className="location-status-badge success p-2">
                                  <i className="nc-icon nc-check-2 mr-1"></i>
                                  Photo prise avec succès
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Button
                                className="btn-enhanced btn-primary-enhanced mb-3"
                                onClick={startCamera}
                                size="lg"
                              >
                                <i className="nc-icon nc-camera-compact mr-2"></i>
                                Ouvrir la caméra
                              </Button>
                              <div className="text-muted">
                                <i className="nc-icon nc-alert-circle-i mr-1"></i>
                                Accès à la caméra requis pour la prise de photo
                              </div>
                            </div>
                          )}
                        </div>
                        {validationErrors.photo && (
                          <div className="invalid-feedback text-center mt-2">
                            <i className="nc-icon nc-simple-remove mr-1"></i>
                            {validationErrors.photo}
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                  {/* Bouton de soumission */}
                  <Row>
                    <Col md="12">
                      <div className="text-center">
                        <Button
                          type="submit"
                          className={`btn-enhanced btn-primary-enhanced px-5 py-3 ${(isSubmitting || loading) ? 'btn-loading' : ''}`}
                          disabled={isSubmitting || loading}
                          size="lg"
                        >
                          {isSubmitting || loading ? (
                            <>
                              <Spinner size="sm" animation="border" className="mr-2" />
                              Création de l'enregistrement de présence...
                            </>
                          ) : (
                            <>
                              <i className="nc-icon nc-check-2 mr-2"></i>
                              Soumettre l'enregistrement de présence
                            </>
                          )}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
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
                <i className="nc-icon nc-camera-compact"></i>
                Prendre une photo
              </Modal.Title>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={stopCamera}
              >
                <i className="nc-icon nc-simple-remove"></i>
              </button>
            </Modal.Header>
            <Modal.Body className="camera-modal-body">
              <div className="camera-container">
                <video
                  id="present-camera-video"
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
                <i className="nc-icon nc-simple-remove mr-1"></i>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                onClick={capturePhoto}
                className="btn-enhanced btn-primary-enhanced"
              >
                <i className="nc-icon nc-camera-compact mr-1"></i>
                Prendre la photo
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Container>
    </>
  );
}

export default CreatePresent;
