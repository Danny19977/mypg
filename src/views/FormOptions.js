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
import { 
  formOptionService, 
  formItemService, 
  formService 
} from '../services/apiServices';

const FormOptions = () => {
  const [options, setOptions] = useState([]);
  const [forms, setForms] = useState([]);
  const [formItems, setFormItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [optionModal, setOptionModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState(null);
  
  // Filters
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedFormItem, setSelectedFormItem] = useState('');
  
  // Option data
  const [optionData, setOptionData] = useState({
    display_text: '',
    value: '',
    option_label: '',
    sort_order: 0,
    is_default: false,
    form_item_uuid: '',
    user_uuid: '', // Will be set from auth context
    country_uuid: '',
    province_uuid: '',
    area_uuid: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadForms();
    loadOptions();
  }, []);

  // Load form items when form is selected
  useEffect(() => {
    if (selectedForm) {
      loadFormItems(selectedForm);
    } else {
      setFormItems([]);
      setSelectedFormItem('');
    }
  }, [selectedForm]);

  // Filter options when form item is selected
  useEffect(() => {
    if (selectedFormItem) {
      loadOptionsByFormItem(selectedFormItem);
    } else if (selectedForm === '') {
      loadOptions();
    }
  }, [selectedFormItem]);

  const loadForms = async () => {
    try {
      const response = await formService.getAll();
      if (response.status === 'success') {
        setForms(response.data);
      }
    } catch (error) {
      console.warn('Failed to load forms:', error);
    }
  };

  const loadFormItems = async (formUuid) => {
    try {
      const response = await formItemService.getByForm(formUuid);
      if (response.status === 'success') {
        // Only show items that can have options
        const optionableItems = response.data.filter(item => 
          ['select', 'radio', 'checkbox'].includes(item.item_type)
        );
        setFormItems(optionableItems);
      }
    } catch (error) {
      console.warn('Failed to load form items:', error);
    }
  };

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.getAll();
      if (response.status === 'success') {
        setOptions(response.data.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      setError('Failed to load options: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptionsByFormItem = async (formItemUuid) => {
    try {
      setLoading(true);
      const response = await formOptionService.getByFormItem(formItemUuid);
      if (response.status === 'success') {
        setOptions(response.data.sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (error) {
      setError('Failed to load options: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOption = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.create(optionData);
      if (response.status === 'success') {
        setSuccess('Option created successfully!');
        setOptionModal(false);
        resetOptionData();
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to create option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = async () => {
    try {
      setLoading(true);
      const response = await formOptionService.update(editingOptionId, optionData);
      if (response.status === 'success') {
        setSuccess('Option updated successfully!');
        setOptionModal(false);
        setEditMode(false);
        setEditingOptionId(null);
        resetOptionData();
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to update option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionUuid) => {
    if (!window.confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await formOptionService.delete(optionUuid);
      if (response.status === 'success') {
        setSuccess('Option deleted successfully!');
        
        // Reload options based on current filter
        if (selectedFormItem) {
          loadOptionsByFormItem(selectedFormItem);
        } else {
          loadOptions();
        }
      }
    } catch (error) {
      setError('Failed to delete option: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEditingOptionId(null);
    resetOptionData();
    if (selectedFormItem) {
      setOptionData(prev => ({ ...prev, form_item_uuid: selectedFormItem }));
    }
    setOptionModal(true);
  };

  const openEditModal = (option) => {
    setEditMode(true);
    setEditingOptionId(option.uuid);
    setOptionData({
      display_text: option.display_text,
      value: option.value,
      option_label: option.option_label || '',
      sort_order: option.sort_order,
      is_default: option.is_default,
      form_item_uuid: option.form_item_uuid,
      user_uuid: option.user_uuid || '',
      country_uuid: option.country_uuid || '',
      province_uuid: option.province_uuid || '',
      area_uuid: option.area_uuid || ''
    });
    setOptionModal(true);
  };

  const resetOptionData = () => {
    setOptionData({
      display_text: '',
      value: '',
      option_label: '',
      sort_order: 0,
      is_default: false,
      form_item_uuid: selectedFormItem || '',
      user_uuid: '',
      country_uuid: '',
      province_uuid: '',
      area_uuid: ''
    });
  };

  const getFormTitle = (formUuid) => {
    const form = forms.find(f => f.uuid === formUuid);
    return form ? form.title : 'Unknown Form';
  };

  const getFormItemQuestion = (formItemUuid) => {
    const item = formItems.find(item => item.uuid === formItemUuid);
    if (!item) {
      // Try to find in all loaded options
      const option = options.find(opt => opt.form_item_uuid === formItemUuid);
      return option?.form_item?.question || 'Unknown Question';
    }
    return item.question;
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Form Options Management</CardTitle>
              <Button 
                color="primary" 
                size="sm" 
                onClick={openCreateModal}
                disabled={!selectedFormItem}
              >
                Add Option
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

              {/* Filters */}
              <Row className="mb-3">
                <Col md="6">
                  <FormGroup>
                    <Label for="formFilter">Filter by Form</Label>
                    <Input
                      type="select"
                      id="formFilter"
                      value={selectedForm}
                      onChange={(e) => setSelectedForm(e.target.value)}
                    >
                      <option value="">All Forms</option>
                      {forms.map((form) => (
                        <option key={form.uuid} value={form.uuid}>
                          {form.title}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="formItemFilter">Filter by Form Item</Label>
                    <Input
                      type="select"
                      id="formItemFilter"
                      value={selectedFormItem}
                      onChange={(e) => setSelectedFormItem(e.target.value)}
                      disabled={!selectedForm}
                    >
                      <option value="">All Form Items</option>
                      {formItems.map((item) => (
                        <option key={item.uuid} value={item.uuid}>
                          {item.question} ({item.item_type})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {/* Options Table */}
              {loading && options.length === 0 ? (
                <div className="text-center">
                  <p>Loading options...</p>
                </div>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Display Text</th>
                      <th>Value</th>
                      <th>Form Item</th>
                      <th>Default</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          {selectedFormItem 
                            ? 'No options found for this form item' 
                            : 'No options found. Select a form item to add options.'
                          }
                        </td>
                      </tr>
                    ) : (
                      options.map((option) => (
                        <tr key={option.uuid}>
                          <td>{option.sort_order}</td>
                          <td>{option.display_text}</td>
                          <td>
                            <code>{option.value}</code>
                          </td>
                          <td>
                            <div>
                              <strong>{getFormItemQuestion(option.form_item_uuid)}</strong>
                              <br />
                              <small className="text-muted">
                                {getFormTitle(option.form_item?.form_uuid || '')}
                              </small>
                            </div>
                          </td>
                          <td>
                            <Badge color={option.is_default ? 'success' : 'secondary'}>
                              {option.is_default ? 'Default' : 'Option'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              color="warning" 
                              size="sm" 
                              className="me-1"
                              onClick={() => openEditModal(option)}
                            >
                              Edit
                            </Button>
                            <Button 
                              color="danger" 
                              size="sm"
                              onClick={() => handleDeleteOption(option.uuid)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Option Modal */}
      <Modal isOpen={optionModal} toggle={() => setOptionModal(false)}>
        <ModalHeader toggle={() => setOptionModal(false)}>
          {editMode ? 'Edit Option' : 'Create New Option'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="form_item_uuid">Form Item *</Label>
              <Input
                type="select"
                id="form_item_uuid"
                value={optionData.form_item_uuid}
                onChange={(e) => setOptionData({...optionData, form_item_uuid: e.target.value})}
                disabled={editMode}
              >
                <option value="">Select a form item</option>
                {formItems.map((item) => (
                  <option key={item.uuid} value={item.uuid}>
                    {item.question} ({item.item_type})
                  </option>
                ))}
              </Input>
            </FormGroup>
            
            <FormGroup>
              <Label for="display_text">Display Text *</Label>
              <Input
                type="text"
                id="display_text"
                value={optionData.display_text}
                onChange={(e) => setOptionData({...optionData, display_text: e.target.value})}
                placeholder="What users will see"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="value">Value *</Label>
              <Input
                type="text"
                id="value"
                value={optionData.value}
                onChange={(e) => setOptionData({...optionData, value: e.target.value})}
                placeholder="The actual value stored"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="option_label">Option Label</Label>
              <Input
                type="text"
                id="option_label"
                value={optionData.option_label}
                onChange={(e) => setOptionData({...optionData, option_label: e.target.value})}
                placeholder="Additional description (optional)"
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="sort_order">Sort Order</Label>
              <Input
                type="number"
                id="sort_order"
                value={optionData.sort_order}
                onChange={(e) => setOptionData({...optionData, sort_order: parseInt(e.target.value)})}
                placeholder="0"
              />
            </FormGroup>
            
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={optionData.is_default}
                  onChange={(e) => setOptionData({...optionData, is_default: e.target.checked})}
                />
                Set as default option
              </Label>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setOptionModal(false)}>
            Cancel
          </Button>
          <Button 
            color={editMode ? "warning" : "primary"}
            onClick={editMode ? handleUpdateOption : handleCreateOption}
            disabled={!optionData.display_text || !optionData.value || !optionData.form_item_uuid || loading}
          >
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Option' : 'Create Option')}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormOptions;
