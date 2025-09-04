import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert
} from 'reactstrap';
import { formService, formItemService, formOptionService } from '../services/apiServices';

const FormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formItems, setFormItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [formModal, setFormModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_uuid: '', // Will be set from auth context
    country_uuid: '',
    province_uuid: '',
    area_uuid: ''
  });
  
  const [itemData, setItemData] = useState({
    question: '',
    item_type: 'text',
    required: false,
    sort_order: 0,
    options: '',
    form_uuid: ''
  });

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
      }
    } catch (error) {
      setError('Failed to load forms: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormItems = async (formUuid) => {
    try {
      setLoading(true);
      const response = await formItemService.getByForm(formUuid);
      if (response.status === 'success') {
        setFormItems(response.data);
      }
    } catch (error) {
      setError('Failed to load form items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      setLoading(true);
      const response = await formService.create(formData);
      if (response.status === 'success') {
        setSuccess('Form created successfully!');
        setFormModal(false);
        setFormData({
          title: '',
          description: '',
          user_uuid: '',
          country_uuid: '',
          province_uuid: '',
          area_uuid: ''
        });
        loadForms();
      }
    } catch (error) {
      setError('Failed to create form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFormItem = async () => {
    try {
      setLoading(true);
      const itemDataWithForm = {
        ...itemData,
        form_uuid: selectedForm.uuid
      };
      const response = await formItemService.create(itemDataWithForm);
      if (response.status === 'success') {
        setSuccess('Form item created successfully!');
        setItemModal(false);
        setItemData({
          question: '',
          item_type: 'text',
          required: false,
          sort_order: 0,
          options: '',
          form_uuid: ''
        });
        loadFormItems(selectedForm.uuid);
      }
    } catch (error) {
      setError('Failed to create form item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
    loadFormItems(form.uuid);
  };

  const getItemTypeColor = (type) => {
    const colors = {
      text: 'primary',
      textarea: 'info',
      select: 'success',
      radio: 'warning',
      checkbox: 'danger',
      file: 'secondary',
      number: 'dark',
      email: 'primary',
      date: 'info'
    };
    return colors[type] || 'secondary';
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Form Builder</CardTitle>
              <Button 
                color="primary" 
                size="sm" 
                onClick={() => setFormModal(true)}
              >
                Create New Form
              </Button>
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

              <Row>
                {/* Forms List */}
                <Col md="4">
                  <Card>
                    <CardHeader>
                      <CardTitle tag="h5">Forms</CardTitle>
                    </CardHeader>
                    <CardBody style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      {loading && <p>Loading forms...</p>}
                      {forms.length === 0 && !loading && (
                        <p>No forms created yet.</p>
                      )}
                      {forms.map((form) => (
                        <Card 
                          key={form.uuid} 
                          className={`mb-2 cursor-pointer ${selectedForm?.uuid === form.uuid ? 'border-primary' : ''}`}
                          onClick={() => handleSelectForm(form)}
                        >
                          <CardBody className="p-2">
                            <h6 className="mb-1">{form.title}</h6>
                            <small className="text-muted">
                              {form.description?.substring(0, 50)}...
                            </small>
                            <br />
                            <Badge color="info" className="mt-1">
                              {form.form_items?.length || 0} items
                            </Badge>
                          </CardBody>
                        </Card>
                      ))}
                    </CardBody>
                  </Card>
                </Col>

                {/* Form Items */}
                <Col md="8">
                  {selectedForm ? (
                    <Card>
                      <CardHeader>
                        <CardTitle tag="h5">
                          Form Items - {selectedForm.title}
                        </CardTitle>
                        <Button 
                          color="success" 
                          size="sm" 
                          onClick={() => setItemModal(true)}
                        >
                          Add Form Item
                        </Button>
                      </CardHeader>
                      <CardBody>
                        {formItems.length === 0 ? (
                          <p>No form items yet. Add some questions to get started.</p>
                        ) : (
                          <Table responsive>
                            <thead>
                              <tr>
                                <th>Order</th>
                                <th>Question</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {formItems.map((item) => (
                                <tr key={item.uuid}>
                                  <td>{item.sort_order}</td>
                                  <td>{item.question}</td>
                                  <td>
                                    <Badge color={getItemTypeColor(item.item_type)}>
                                      {item.item_type}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge color={item.required ? 'danger' : 'secondary'}>
                                      {item.required ? 'Required' : 'Optional'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      color="warning" 
                                      size="sm" 
                                      className="me-1"
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      color="danger" 
                                      size="sm"
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </CardBody>
                    </Card>
                  ) : (
                    <Card>
                      <CardBody className="text-center">
                        <h5>Select a form to view its items</h5>
                        <p className="text-muted">
                          Choose a form from the left panel to see and manage its questions.
                        </p>
                      </CardBody>
                    </Card>
                  )}
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create Form Modal */}
      <Modal isOpen={formModal} toggle={() => setFormModal(false)}>
        <ModalHeader toggle={() => setFormModal(false)}>
          Create New Form
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="title">Form Title *</Label>
              <Input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter form title"
              />
            </FormGroup>
            <FormGroup>
              <Label for="description">Description</Label>
              <Input
                type="textarea"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter form description"
                rows="3"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setFormModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handleCreateForm}
            disabled={!formData.title || loading}
          >
            {loading ? 'Creating...' : 'Create Form'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Create Form Item Modal */}
      <Modal isOpen={itemModal} toggle={() => setItemModal(false)}>
        <ModalHeader toggle={() => setItemModal(false)}>
          Add Form Item
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="question">Question *</Label>
              <Input
                type="text"
                id="question"
                value={itemData.question}
                onChange={(e) => setItemData({...itemData, question: e.target.value})}
                placeholder="Enter question"
              />
            </FormGroup>
            <FormGroup>
              <Label for="item_type">Field Type *</Label>
              <Input
                type="select"
                id="item_type"
                value={itemData.item_type}
                onChange={(e) => setItemData({...itemData, item_type: e.target.value})}
              >
                <option value="text">Text Input</option>
                <option value="textarea">Text Area</option>
                <option value="select">Dropdown</option>
                <option value="radio">Radio Buttons</option>
                <option value="checkbox">Checkboxes</option>
                <option value="file">File Upload</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label for="sort_order">Sort Order</Label>
              <Input
                type="number"
                id="sort_order"
                value={itemData.sort_order}
                onChange={(e) => setItemData({...itemData, sort_order: parseInt(e.target.value)})}
                placeholder="0"
              />
            </FormGroup>
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={itemData.required}
                  onChange={(e) => setItemData({...itemData, required: e.target.checked})}
                />
                Required Field
              </Label>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setItemModal(false)}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onClick={handleCreateFormItem}
            disabled={!itemData.question || loading}
          >
            {loading ? 'Adding...' : 'Add Item'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormBuilder;
