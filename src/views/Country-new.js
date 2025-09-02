import React, { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Table,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";

// Import our custom hooks for API calls
import { useCountries, useTerritoryActions } from "../hooks/useApi";

function Country() {
  // API hooks
  const { data: countries, loading, error, refetch } = useCountries();
  const { createCountry, loading: actionLoading, error: actionError } = useTerritoryActions();
  
  // Local state
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag: '',
    status: 'active'
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCountry(formData);
      setNotification({ type: 'success', message: 'Country created successfully!' });
      setShowModal(false);
      setFormData({ name: '', code: '', flag: '', status: 'active' });
      refetch(); // Refresh the list
    } catch (err) {
      setNotification({ type: 'danger', message: 'Failed to create country' });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format status badge
  const getStatusBadge = (status) => {
    return status === 'active' ? 
      <Badge variant="success">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

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
              >
                {notification.message}
              </Alert>
            </Col>
          </Row>
        )}

        <Row>
          <Col md="12">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title as="h4">
                      <i className="nc-icon nc-globe mr-2"></i>
                      Country Management
                    </Card.Title>
                    <p className="card-category">
                      Manage countries and their territorial divisions
                    </p>
                  </div>
                  <div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => setShowModal(true)}
                    >
                      Add Country
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={refetch} 
                      disabled={loading}
                    >
                      {loading ? <Spinner size="sm" animation="border" /> : 'Refresh'}
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading countries...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <Alert variant="danger" className="mx-3">
                    <strong>Error:</strong> {error}
                  </Alert>
                )}

                {/* Data Table */}
                {!loading && !error && (
                  <Table className="table-hover table-striped">
                    <thead>
                      <tr>
                        <th className="border-0">Flag</th>
                        <th className="border-0">Country Name</th>
                        <th className="border-0">Code</th>
                        <th className="border-0">Provinces</th>
                        <th className="border-0">Areas</th>
                        <th className="border-0">Status</th>
                        <th className="border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countries && countries.length > 0 ? (
                        countries.map((country) => (
                          <tr key={country.id}>
                            <td>{country.flag || '🌍'}</td>
                            <td>{country.name}</td>
                            <td><Badge variant="info">{country.code}</Badge></td>
                            <td>{country.provinces_count || 0}</td>
                            <td>{country.areas_count || 0}</td>
                            <td>{getStatusBadge(country.status)}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="mr-2"
                              >
                                View
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            No countries found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Add Country Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Country</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group>
                <Form.Label>Country Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter country name"
                  required
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Country Code</Form.Label>
                <Form.Control
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., US, CA, UK"
                  maxLength="3"
                  required
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Flag Emoji</Form.Label>
                <Form.Control
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleInputChange}
                  placeholder="🇺🇸"
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Control
                  as="select"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Control>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={actionLoading}>
                {actionLoading ? <Spinner size="sm" animation="border" /> : 'Create Country'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </>
  );
}

export default Country;
