
import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Table, Button, Modal, Form, Alert, Spinner } from "react-bootstrap";
import { managerService } from "../services/apiServices";

function Manager() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [formData, setFormData] = useState({ title: "", user_uuid: "", country_uuid: "" });
  const [editFormData, setEditFormData] = useState({ uuid: "", title: "", user_uuid: "", country_uuid: "" });
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await managerService.getAll();
      if (response.status === "success") {
        setManagers(response.data);
      }
    } catch (error) {
      showAlert("danger", "Failed to load managers: " + error.message);
    } finally {
      setLoading(false);
    }
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
      const response = await managerService.create(formData);
      if (response.status === "success") {
        showAlert("success", "Manager created successfully!");
        setShowModal(false);
        setFormData({ title: "", user_uuid: "", country_uuid: "" });
        fetchManagers();
      }
    } catch (error) {
      showAlert("danger", "Failed to create manager: " + error.message);
    }
  };

  const handleEdit = (manager) => {
    setEditFormData({
      uuid: manager.uuid,
      title: manager.title || "",
      user_uuid: manager.user_uuid || "",
      country_uuid: manager.country_uuid || ""
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await managerService.update(editFormData.uuid, editFormData);
      if (response.status === "success") {
        showAlert("success", "Manager updated successfully!");
        setShowEditModal(false);
        fetchManagers();
      }
    } catch (error) {
      showAlert("danger", "Failed to update manager: " + error.message);
    }
  };

  const handleDelete = (manager) => {
    setSelectedManager(manager);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await managerService.delete(selectedManager.uuid);
      if (response.status === "success") {
        showAlert("success", "Manager deleted successfully!");
        setShowDeleteModal(false);
        fetchManagers();
      }
    } catch (error) {
      showAlert("danger", "Failed to delete manager: " + error.message);
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col md="12">
          <Card className="strpied-tabled-with-hover">
            <Card.Header>
              <Card.Title as="h4">Manager Management</Card.Title>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                Add Manager
              </Button>
            </Card.Header>
            <Card.Body className="table-full-width table-responsive px-0">
              {alert.show && <Alert variant={alert.variant}>{alert.message}</Alert>}
              {loading ? (
                <Spinner animation="border" />
              ) : (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>User UUID</th>
                      <th>Country UUID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager) => (
                      <tr key={manager.uuid}>
                        <td>{manager.title}</td>
                        <td>{manager.user_uuid}</td>
                        <td>{manager.country_uuid}</td>
                        <td>
                          <Button variant="info" size="sm" onClick={() => handleEdit(manager)}>
                            Edit
                          </Button>{" "}
                          <Button variant="danger" size="sm" onClick={() => handleDelete(manager)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Manager</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreate}>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={formData.title} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>User UUID</Form.Label>
              <Form.Control name="user_uuid" value={formData.user_uuid} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Country UUID</Form.Label>
              <Form.Control name="country_uuid" value={formData.country_uuid} onChange={handleInputChange} required />
            </Form.Group>
            <Button type="submit" variant="primary">Create</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Manager</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={editFormData.title} onChange={handleEditInputChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>User UUID</Form.Label>
              <Form.Control name="user_uuid" value={editFormData.user_uuid} onChange={handleEditInputChange} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Country UUID</Form.Label>
              <Form.Control name="country_uuid" value={editFormData.country_uuid} onChange={handleEditInputChange} required />
            </Form.Group>
            <Button type="submit" variant="primary">Update</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Manager</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this manager?</p>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Manager;
