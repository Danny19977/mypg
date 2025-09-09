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
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
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

  // Options for select, radio, and checkbox types
  const [fieldOptions, setFieldOptions] = useState([]);
  const [newOptionText, setNewOptionText] = useState('');
  
  // Conditional fields for dropdown options
  const [conditionalFields, setConditionalFields] = useState({});
  const [selectedOptionForCondition, setSelectedOptionForCondition] = useState('');

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
    console.log('handleCreateFormItem called!'); // Debug log
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Validate that we have a selected form
      if (!selectedForm || !selectedForm.uuid) {
        setError('No form selected. Please select a form first.');
        setLoading(false);
        return;
      }
      
      // Prepare options string for dropdown, radio, and checkbox types
      let optionsString = '';
      if (['select', 'radio', 'checkbox'].includes(itemData.item_type)) {
        optionsString = fieldOptions.join(',');
      }
      
      const itemDataWithForm = {
        question: itemData.question,
        item_type: itemData.item_type,
        required: itemData.required || false,
        sort_order: editMode ? (itemData.sort_order || 0) : (formItems.length + 1), // Auto-increment for new items
        options: optionsString,
        conditional_fields: JSON.stringify(conditionalFields), // Store conditional fields as JSON
        form_uuid: selectedForm.uuid
      };

      console.log('🚀 Submitting form item with conditional fields:', {
        ...itemDataWithForm,
        conditionalFieldsObject: conditionalFields
      });
      console.log('Using formItemService:', formItemService); // Debug log
      
      let response;
      if (editMode && editingItem) {
        // Update existing item
        response = await formItemService.update(editingItem.uuid, itemDataWithForm);
        console.log('Update Response:', response); // Debug log
      } else {
        // Create new item
        response = await formItemService.create(itemDataWithForm);
        console.log('Create Response:', response); // Debug log
      }
      
      if (response && response.status === 'success') {
        setSuccess(editMode ? 'Form item updated successfully!' : 'Form item created successfully!');
        setItemModal(false);
        setEditMode(false);
        setEditingItem(null);
        setItemData({
          question: '',
          item_type: 'text',
          required: false,
          sort_order: 0,
          options: '',
          form_uuid: ''
        });
        setFieldOptions([]);
        setNewOptionText('');
        setConditionalFields({});
        setSelectedOptionForCondition('');
        loadFormItems(selectedForm.uuid);
      } else {
        setError(`Failed to ${editMode ? 'update' : 'create'} form item: ` + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} form item:`, error); // Debug log
      setError(`Failed to ${editMode ? 'update' : 'create'} form item: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditMode(true);
    setEditingItem(item);
    setItemData({
      question: item.question,
      item_type: item.item_type,
      required: item.required || false,
      sort_order: item.sort_order || 0,
      options: item.options || '',
      form_uuid: item.form_uuid
    });
    
    // Set field options if the item has options
    if (item.options && ['select', 'radio', 'checkbox'].includes(item.item_type)) {
      setFieldOptions(item.options.split(',').map(opt => opt.trim()));
    } else {
      setFieldOptions([]);
    }
    
    // Load conditional fields if they exist
    if (item.conditional_fields) {
      try {
        const conditionals = JSON.parse(item.conditional_fields);
        setConditionalFields(conditionals);
      } catch (error) {
        console.error('Error parsing conditional fields:', error);
        setConditionalFields({});
      }
    } else {
      setConditionalFields({});
    }
    
    setNewOptionText('');
    setSelectedOptionForCondition('');
    setItemModal(true);
  };

  const handleDeleteItem = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this form item?')) {
      try {
        setLoading(true);
        const response = await formItemService.delete(uuid);
        if (response && response.status === 'success') {
          setSuccess('Form item deleted successfully!');
          loadFormItems(selectedForm.uuid);
        } else {
          setError('Failed to delete form item: ' + (response?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting form item:', error);
        setError('Failed to delete form item: ' + error.message);
      } finally {
        setLoading(false);
      }
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
      date: 'info',
      camera: 'info'
    };
    return colors[type] || 'secondary';
  };

  // Helper functions for managing field options
  const addOption = () => {
    if (newOptionText.trim() && !fieldOptions.includes(newOptionText.trim())) {
      setFieldOptions([...fieldOptions, newOptionText.trim()]);
      setNewOptionText('');
    }
  };

  const removeOption = (index) => {
    const optionToRemove = fieldOptions[index];
    const updated = fieldOptions.filter((_, i) => i !== index);
    setFieldOptions(updated);
    
    // Remove conditional fields for this option
    if (conditionalFields[optionToRemove]) {
      const updatedConditionals = { ...conditionalFields };
      delete updatedConditionals[optionToRemove];
      setConditionalFields(updatedConditionals);
    }
  };

  // Helper functions for conditional fields
  const addConditionalField = (optionValue, fieldType, fieldLabel, isRequired = false) => {
    if (!optionValue || !fieldType || !fieldLabel) return;
    
    const newField = {
      id: Date.now() + Math.random(),
      type: fieldType,
      label: fieldLabel,
      required: isRequired,
      options: fieldType === 'radio' || fieldType === 'checkbox' ? [] : null
    };
    
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: [
        ...(prev[optionValue] || []),
        newField
      ]
    }));
  };

  const removeConditionalField = (optionValue, fieldId) => {
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.filter(field => field.id !== fieldId) || []
    }));
  };

  const addConditionalFieldOption = (optionValue, fieldId, optionText) => {
    if (!optionText.trim()) return;
    
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { ...field, options: [...(field.options || []), optionText.trim()] }
          : field
      ) || []
    }));
  };

  const removeConditionalFieldOption = (optionValue, fieldId, optionIndex) => {
    setConditionalFields(prev => ({
      ...prev,
      [optionValue]: prev[optionValue]?.map(field => 
        field.id === fieldId 
          ? { ...field, options: field.options?.filter((_, i) => i !== optionIndex) || [] }
          : field
      ) || []
    }));
  };

  const handleFieldTypeChange = (type) => {
    setItemData({...itemData, item_type: type});
    // Reset options when changing field type
    if (!['select', 'radio', 'checkbox'].includes(type)) {
      setFieldOptions([]);
      setNewOptionText('');
      setConditionalFields({});
      setSelectedOptionForCondition('');
    }
  };

  const isOptionsRequired = () => {
    return ['select', 'radio', 'checkbox'].includes(itemData.item_type);
  };

  // Helper component for adding conditional fields
  const ConditionalFieldAdder = ({ onAdd }) => {
    const [fieldType, setFieldType] = useState('text');
    const [fieldLabel, setFieldLabel] = useState('');
    const [isRequired, setIsRequired] = useState(false);

    const handleAdd = () => {
      if (fieldLabel.trim()) {
        onAdd(fieldType, fieldLabel.trim(), isRequired);
        setFieldLabel('');
        setIsRequired(false);
      }
    };

    return (
      <div className="border rounded p-3 bg-light">
        <div className="row">
          <div className="col-md-4">
            <Label className="small">Field Label *</Label>
            <Input
              type="text"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="Enter field label"
              size="sm"
            />
          </div>
          <div className="col-md-3">
            <Label className="small">Field Type</Label>
            <Input
              type="select"
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              size="sm"
            >
              <option value="text">Text Field</option>
              <option value="textarea">Text Area</option>
              <option value="radio">Radio Buttons</option>
              <option value="checkbox">Checkboxes</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="date">Date</option>
              <option value="camera">Camera</option>
            </Input>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <FormGroup check className="mb-2">
              <Label check>
                <Input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
                <span className="ms-1">Required</span>
              </Label>
            </FormGroup>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <Button 
              color="primary" 
              size="sm" 
              onClick={handleAdd}
              disabled={!fieldLabel.trim()}
              className="w-100"
            >
              Add Field
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Helper component for displaying conditional fields
  const ConditionalFieldDisplay = ({ field, optionValue, onRemove, onAddOption, onRemoveOption }) => {
    const [newOption, setNewOption] = useState('');

    const handleAddOption = () => {
      if (newOption.trim()) {
        onAddOption(newOption.trim());
        setNewOption('');
      }
    };

    return (
      <div className="border rounded p-2 mb-2 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <strong className="small">{field.label} ({field.type})</strong>
            {field.required && <Badge color="warning" size="sm" className="ms-2">Required</Badge>}
          </div>
          <Button color="danger" size="sm" onClick={onRemove}>Remove</Button>
        </div>

        {(field.type === 'radio' || field.type === 'checkbox') && (
          <div>
            <div className="d-flex gap-2 mb-2">
              <Input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add option"
                size="sm"
              />
              <Button 
                color="secondary" 
                size="sm" 
                onClick={handleAddOption}
                disabled={!newOption.trim()}
              >
                Add
              </Button>
            </div>
            
            {field.options && field.options.length > 0 && (
              <div>
                <div className="small text-muted mb-1">Options:</div>
                {field.options.map((option, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded">
                    <span className="small">{option}</span>
                    <Button 
                      color="danger" 
                      size="sm" 
                      onClick={() => onRemoveOption(index)}
                      className="py-0 px-1"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
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
                          onClick={() => {
                            setEditMode(false);
                            setEditingItem(null);
                            setItemModal(true);
                            setFieldOptions([]);
                            setNewOptionText('');
                            setConditionalFields({});
                            setSelectedOptionForCondition('');
                            setItemData({
                              question: '',
                              item_type: 'text',
                              required: false,
                              sort_order: 0,
                              options: '',
                              form_uuid: ''
                            });
                          }}
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
                                <th>Options</th>
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
                                    {item.options ? (
                                      <div>
                                        <div className="d-flex flex-wrap gap-1 mb-1">
                                          {item.options.split(',').slice(0, 3).map((option, index) => (
                                            <Badge key={index} color="light" className="text-dark">
                                              {option.trim()}
                                            </Badge>
                                          ))}
                                          {item.options.split(',').length > 3 && (
                                            <Badge color="secondary">
                                              +{item.options.split(',').length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                        {item.conditional_fields && JSON.parse(item.conditional_fields || '{}') && Object.keys(JSON.parse(item.conditional_fields || '{}')).length > 0 && (
                                          <Badge color="info" className="small">
                                            Has Conditions
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">-</span>
                                    )}
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
                                      onClick={() => handleEditItem(item)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      color="danger" 
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.uuid)}
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
            {/* <FormGroup>
              <Label for="description">Description</Label>
              <Input
                type="textarea"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter form description"
                rows="3"
              />
            </FormGroup> */}
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
      <Modal isOpen={itemModal} toggle={() => {
        setItemModal(false);
        setEditMode(false);
        setEditingItem(null);
        setFieldOptions([]);
        setNewOptionText('');
        setConditionalFields({});
        setSelectedOptionForCondition('');
      }} size="xl">
        <ModalHeader toggle={() => {
          setItemModal(false);
          setEditMode(false);
          setEditingItem(null);
          setFieldOptions([]);
          setNewOptionText('');
          setConditionalFields({});
          setSelectedOptionForCondition('');
        }}>
          {editMode ? 'Edit Form Item' : 'Add Form Item'}
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
                onChange={(e) => handleFieldTypeChange(e.target.value)}
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
                <option value="camera">Camera</option>
              </Input>
            </FormGroup>

            {/* Conditional Options Section */}
            {isOptionsRequired() && (
              <FormGroup>
                <Label>Options *</Label>
                <div className="mb-2">
                  <div className="d-flex">
                    <Input
                      type="text"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder={`Add ${itemData.item_type === 'select' ? 'dropdown option' : 
                                           itemData.item_type === 'radio' ? 'radio button option' : 
                                           'checkbox option'}`}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      className="me-2"
                    />
                    <Button 
                      color="primary" 
                      size="sm" 
                      onClick={addOption}
                      disabled={!newOptionText.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                {fieldOptions.length > 0 && (
                  <div className="border rounded p-3">
                    <Label className="mb-2">Preview ({itemData.item_type}):</Label>
                    
                    {itemData.item_type === 'select' && (
                      <div>
                        <Input type="select" disabled>
                          <option>Select an option...</option>
                          {fieldOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </Input>
                      </div>
                    )}

                    {itemData.item_type === 'radio' && (
                      <div>
                        {fieldOptions.map((option, index) => (
                          <FormGroup check key={index} className="mb-1">
                            <Label check>
                              <Input type="radio" name="preview_radio" disabled />
                              {option}
                            </Label>
                          </FormGroup>
                        ))}
                      </div>
                    )}

                    {itemData.item_type === 'checkbox' && (
                      <div>
                        {fieldOptions.map((option, index) => (
                          <FormGroup check key={index} className="mb-1">
                            <Label check>
                              <Input type="checkbox" disabled />
                              {option}
                            </Label>
                          </FormGroup>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <Label className="mb-2">Manage Options:</Label>
                      {fieldOptions.map((option, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-1 p-2 bg-light rounded">
                          <span>{option}</span>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onClick={() => removeOption(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {fieldOptions.length === 0 && (
                  <small className="text-muted">
                    {itemData.item_type === 'select' && 'Add options for the dropdown list'}
                    {itemData.item_type === 'radio' && 'Add options for radio buttons (users can select only one)'}
                    {itemData.item_type === 'checkbox' && 'Add options for checkboxes (users can select multiple)'}
                  </small>
                )}
              </FormGroup>
            )}

            {/* Conditional Fields Section - Only for dropdown */}
            {itemData.item_type === 'select' && fieldOptions.length > 0 && (
              <FormGroup>
                <Label>Conditional Fields (Optional)</Label>
                <small className="text-muted d-block mb-2">
                  Add fields that appear when specific dropdown options are selected
                </small>
                
                <div className="mb-3">
                  <Label>Select dropdown option to add conditions:</Label>
                  <Input
                    type="select"
                    value={selectedOptionForCondition}
                    onChange={(e) => setSelectedOptionForCondition(e.target.value)}
                  >
                    <option value="">Choose an option...</option>
                    {fieldOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </Input>
                </div>

                {selectedOptionForCondition && (
                  <div className="border rounded p-3 mb-3">
                    <h6>Conditional fields for: "{selectedOptionForCondition}"</h6>
                    
                    <div className="mb-3">
                      <ConditionalFieldAdder 
                        onAdd={(type, label, required) => addConditionalField(selectedOptionForCondition, type, label, required)}
                      />
                    </div>

                    {conditionalFields[selectedOptionForCondition]?.length > 0 && (
                      <div>
                        <Label>Current conditional fields:</Label>
                        {conditionalFields[selectedOptionForCondition].map((field) => (
                          <ConditionalFieldDisplay
                            key={field.id}
                            field={field}
                            optionValue={selectedOptionForCondition}
                            onRemove={() => removeConditionalField(selectedOptionForCondition, field.id)}
                            onAddOption={(optionText) => addConditionalFieldOption(selectedOptionForCondition, field.id, optionText)}
                            onRemoveOption={(optionIndex) => removeConditionalFieldOption(selectedOptionForCondition, field.id, optionIndex)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Show all conditional fields summary */}
                {Object.keys(conditionalFields).length > 0 && (
                  <div className="border rounded p-3 bg-light">
                    <Label>Conditional Fields Summary:</Label>
                    {Object.entries(conditionalFields).map(([option, fields]) => (
                      <div key={option} className="mb-2">
                        <strong>"{option}"</strong> → {fields.length} conditional field(s)
                        <ul className="mb-0 mt-1">
                          {fields.map((field) => (
                            <li key={field.id} className="small">
                              {field.label} ({field.type})
                              {field.required && <span className="text-danger"> *</span>}
                              {field.options && field.options.length > 0 && (
                                <span className="text-muted"> - {field.options.length} option(s)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </FormGroup>
            )}

            {/* Remove Sort Order field - auto-calculated */}
            {/* <FormGroup>
              <Label for="sort_order">Sort Order</Label>
              <Input
                type="number"
                id="sort_order"
                value={itemData.sort_order}
                onChange={(e) => setItemData({...itemData, sort_order: parseInt(e.target.value)})}
                placeholder="0"
              />
            </FormGroup> */}
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
          <Button color="secondary" onClick={() => {
            setItemModal(false);
            setEditMode(false);
            setEditingItem(null);
            setFieldOptions([]);
            setNewOptionText('');
            setConditionalFields({});
            setSelectedOptionForCondition('');
          }}>
            Cancel
          </Button>
          <Button 
            color="success" 
            onClick={handleCreateFormItem}
            disabled={
              !selectedForm ||
              !itemData.question.trim() || 
              (isOptionsRequired() && fieldOptions.length === 0) || 
              loading
            }
          >
            {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Item' : 'Add Item')}
          </Button>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-small text-muted">
              Debug: Mode: {editMode ? 'Edit' : 'Create'}, 
              Form: {selectedForm ? '✓' : '✗'}, 
              Question: {itemData.question ? '✓' : '✗'}, 
              Options: {isOptionsRequired() ? (fieldOptions.length > 0 ? '✓' : '✗') : 'N/A'}, 
              Loading: {loading ? 'Yes' : 'No'}
            </div>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormBuilder;
