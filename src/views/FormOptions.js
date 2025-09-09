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
  Alert,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Collapse
} from 'reactstrap';
import { 
  formOptionService, 
  formItemService, 
  formService,
  formSubmissionService,
  formResponseService
} from '../services/apiServices';

// Add some inline styles for better UX
const styles = {
  submissionHeader: {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  responseValue: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.9em'
  }
};

const FormOptions = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState('options');
  
  // Options management states
  const [options, setOptions] = useState([]);
  const [forms, setForms] = useState([]);
  const [formItems, setFormItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form submissions states
  const [submissions, setSubmissions] = useState([]);
  const [submissionResponses, setSubmissionResponses] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  
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
    loadSubmissions();
  }, []);

  // Load form items when form is selected
  useEffect(() => {
    if (selectedForm) {
      loadFormItems(selectedForm);
      if (activeTab === 'submissions') {
        loadSubmissionsByForm(selectedForm);
      }
    } else {
      setFormItems([]);
      setSelectedFormItem('');
      if (activeTab === 'submissions') {
        loadSubmissions();
      }
    }
  }, [selectedForm, activeTab]);

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

  // Submission management functions
  const loadSubmissions = async () => {
    try {
      setSubmissionsLoading(true);
      const response = await formSubmissionService.getAll();
      if (response.status === 'success') {
        setSubmissions(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.warn('Failed to load submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadSubmissionsByForm = async (formUuid) => {
    try {
      setSubmissionsLoading(true);
      const response = await formSubmissionService.getByForm(formUuid);
      if (response.status === 'success') {
        setSubmissions(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (error) {
      console.warn('Failed to load submissions for form:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadSubmissionResponses = async (submissionUuid) => {
    try {
      const response = await formResponseService.getBySubmission(submissionUuid);
      if (response.status === 'success') {
        setSubmissionResponses(prev => ({
          ...prev,
          [submissionUuid]: response.data
        }));
      }
    } catch (error) {
      console.warn('Failed to load submission responses:', error);
    }
  };

  const toggleSubmissionExpansion = (submissionUuid) => {
    setExpandedSubmissions(prev => {
      const newExpanded = { ...prev };
      if (newExpanded[submissionUuid]) {
        delete newExpanded[submissionUuid];
      } else {
        newExpanded[submissionUuid] = true;
        // Load responses if not already loaded
        if (!submissionResponses[submissionUuid]) {
          loadSubmissionResponses(submissionUuid);
        }
      }
      return newExpanded;
    });
  };

  const formatResponseValue = (response) => {
    if (response.text_value) return response.text_value;
    if (response.number_value !== null) return response.number_value.toString();
    if (response.boolean_value !== null) return response.boolean_value ? 'Yes' : 'No';
    if (response.date_value) return new Date(response.date_value).toLocaleDateString();
    return 'No value';
  };

  const getFormItemByUuid = (itemUuid) => {
    // First try to find in current form items
    let item = formItems.find(item => item.uuid === itemUuid);
    if (item) return item;
    
    // If not found, try to find from submission responses (they might include form_item data)
    for (const responses of Object.values(submissionResponses)) {
      const response = responses.find(resp => resp.form_item_uuid === itemUuid);
      if (response && response.form_item) {
        return response.form_item;
      }
    }
    
    return { uuid: itemUuid, question: 'Unknown Question', item_type: 'text' };
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Form Management</CardTitle>
              <div className="d-flex align-items-center">
                <Nav tabs className="me-3">
                  <NavItem>
                    <NavLink
                      className={activeTab === 'options' ? 'active' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('options');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Form Options
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeTab === 'submissions' ? 'active' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveTab('submissions');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Form Submissions
                    </NavLink>
                  </NavItem>
                </Nav>
                {activeTab === 'options' && (
                  <Button 
                    color="primary" 
                    size="sm" 
                    onClick={openCreateModal}
                    disabled={!selectedFormItem}
                  >
                    Add Option
                  </Button>
                )}
              </div>
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
                {activeTab === 'options' && (
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
                )}
              </Row>

              <TabContent activeTab={activeTab}>
                {/* Form Options Tab */}
                <TabPane tabId="options">
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
                </TabPane>

                {/* Form Submissions Tab */}
                <TabPane tabId="submissions">
                  {submissionsLoading && submissions.length === 0 ? (
                    <div className="text-center">
                      <p>Loading submissions...</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <Badge color="info" className="me-2">
                          Total Submissions: {submissions.length}
                        </Badge>
                        {selectedForm && (
                          <Badge color="secondary">
                            Filtered by: {getFormTitle(selectedForm)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Summary Table for all submissions */}
                      {submissions.length > 0 && (
                        <div className="mb-4">
                          <h6>Submissions Overview</h6>
                          <Table responsive striped hover size="sm">
                            <thead>
                              <tr>
                                <th>Form</th>
                                <th>Submitter</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Date Submitted</th>
                                <th>GPS Available</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions.map((submission) => (
                                <tr key={submission.uuid}>
                                  <td>
                                    <strong>{getFormTitle(submission.form_uuid)}</strong>
                                  </td>
                                  <td>{submission.submitter_name}</td>
                                  <td>{submission.submitter_email}</td>
                                  <td>
                                    <Badge color={submission.status === 'submitted' ? 'success' : 'warning'} size="sm">
                                      {submission.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small>{new Date(submission.created_at).toLocaleString()}</small>
                                  </td>
                                  <td>
                                    {submission.latitude && submission.longitude ? (
                                      <Badge color="success" size="sm">GPS ✓</Badge>
                                    ) : (
                                      <Badge color="secondary" size="sm">No GPS</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button 
                                      color="info" 
                                      size="sm"
                                      onClick={() => toggleSubmissionExpansion(submission.uuid)}
                                    >
                                      {expandedSubmissions[submission.uuid] ? 'Hide Details' : 'View Details'}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                      
                      {submissions.length === 0 ? (
                        <div className="text-center text-muted">
                          <p>No form submissions found.</p>
                          {selectedForm && <p>Try selecting a different form or clear the filter.</p>}
                        </div>
                      ) : (
                        <div>
                          <h6 className="mt-4">Detailed Submission Responses</h6>
                          <div className="submissions-list">{submissions.map((submission) => (
                            <Card key={submission.uuid} className="mb-3">
                              <CardHeader 
                                className="d-flex justify-content-between align-items-center"
                                onClick={() => toggleSubmissionExpansion(submission.uuid)}
                                style={styles.submissionHeader}
                              >
                                <div>
                                  <h6 className="mb-1">
                                    Form: {getFormTitle(submission.form_uuid)}
                                  </h6>
                                  <div className="row">
                                    <div className="col-md-6">
                                      <small className="text-muted">
                                        <strong>Submitter:</strong> {submission.submitter_name}<br />
                                        <strong>Email:</strong> {submission.submitter_email}<br />
                                        <strong>Status:</strong> {submission.status}<br />
                                        <strong>Form UUID:</strong> {submission.form_uuid}
                                      </small>
                                    </div>
                                    <div className="col-md-6">
                                      <small className="text-muted">
                                        <strong>Submitted:</strong> {new Date(submission.created_at).toLocaleString()}<br />
                                        <strong>Updated:</strong> {new Date(submission.updated_at).toLocaleString()}<br />
                                        {submission.latitude && submission.longitude ? (
                                          <>
                                            <strong>Latitude:</strong> {submission.latitude}<br />
                                            <strong>Longitude:</strong> {submission.longitude}
                                          </>
                                        ) : (
                                          <span>No GPS coordinates</span>
                                        )}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center">
                                  <Badge color={submission.status === 'submitted' ? 'success' : 'warning'} className="me-2">
                                    {submission.status}
                                  </Badge>
                                  <Button 
                                    color="link" 
                                    size="sm"
                                    className="p-0"
                                  >
                                    {expandedSubmissions[submission.uuid] ? '▼' : '▶'}
                                  </Button>
                                </div>
                              </CardHeader>
                              <Collapse isOpen={expandedSubmissions[submission.uuid]}>
                                <CardBody>
                                  <h6 className="mb-3">Form Responses:</h6>
                                  {submissionResponses[submission.uuid] ? (
                                    submissionResponses[submission.uuid].length > 0 ? (
                                      <Table size="sm" bordered>
                                        <thead>
                                          <tr>
                                            <th>Question</th>
                                            <th>Type</th>
                                            <th>Text Value</th>
                                            <th>Number Value</th>
                                            <th>Boolean Value</th>
                                            <th>Date Value</th>
                                            <th>Response ID</th>
                                            <th>Form Item ID</th>
                                            <th>Created At</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {submissionResponses[submission.uuid].map((response) => {
                                            const formItem = getFormItemByUuid(response.form_item_uuid);
                                            return (
                                              <tr key={response.uuid}>
                                                <td>
                                                  <strong>{formItem.question}</strong>
                                                </td>
                                                <td>
                                                  <Badge color="secondary" size="sm">
                                                    {formItem.item_type}
                                                  </Badge>
                                                </td>
                                                <td>
                                                  {response.text_value ? (
                                                    <span style={styles.responseValue}>
                                                      {response.text_value}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted">-</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {response.number_value !== null && response.number_value !== undefined ? (
                                                    <span style={styles.responseValue}>
                                                      {response.number_value}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted">-</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {response.boolean_value !== null && response.boolean_value !== undefined ? (
                                                    <Badge color={response.boolean_value ? 'success' : 'danger'} size="sm">
                                                      {response.boolean_value ? 'Yes' : 'No'}
                                                    </Badge>
                                                  ) : (
                                                    <span className="text-muted">-</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {response.date_value ? (
                                                    <span style={styles.responseValue}>
                                                      {new Date(response.date_value).toLocaleDateString()}
                                                    </span>
                                                  ) : (
                                                    <span className="text-muted">-</span>
                                                  )}
                                                </td>
                                                <td>
                                                  <small className="text-muted font-monospace">
                                                    {response.uuid}
                                                  </small>
                                                </td>
                                                <td>
                                                  <small className="text-muted font-monospace">
                                                    {response.form_item_uuid}
                                                  </small>
                                                </td>
                                                <td>
                                                  <small>
                                                    {new Date(response.created_at).toLocaleString()}
                                                  </small>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </Table>
                                    ) : (
                                      <p className="text-muted">No responses found for this submission.</p>
                                    )
                                  ) : (
                                    <div className="text-center">
                                      <p>Loading responses...</p>
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 pt-3 border-top">
                                    <h6>Submission Details</h6>
                                    <Table size="sm" striped>
                                      <tbody>
                                        <tr>
                                          <td><strong>Submission ID:</strong></td>
                                          <td className="font-monospace">{submission.uuid}</td>
                                        </tr>
                                        <tr>
                                          <td><strong>Form ID:</strong></td>
                                          <td className="font-monospace">{submission.form_uuid}</td>
                                        </tr>
                                        <tr>
                                          <td><strong>Submitter Name:</strong></td>
                                          <td>{submission.submitter_name}</td>
                                        </tr>
                                        <tr>
                                          <td><strong>Submitter Email:</strong></td>
                                          <td>{submission.submitter_email}</td>
                                        </tr>
                                        <tr>
                                          <td><strong>Status:</strong></td>
                                          <td>
                                            <Badge color={submission.status === 'submitted' ? 'success' : 'warning'}>
                                              {submission.status}
                                            </Badge>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td><strong>Created At:</strong></td>
                                          <td>{new Date(submission.created_at).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td><strong>Updated At:</strong></td>
                                          <td>{new Date(submission.updated_at).toLocaleString()}</td>
                                        </tr>
                                        {submission.latitude && (
                                          <tr>
                                            <td><strong>Latitude:</strong></td>
                                            <td className="font-monospace">{submission.latitude}</td>
                                          </tr>
                                        )}
                                        {submission.longitude && (
                                          <tr>
                                            <td><strong>Longitude:</strong></td>
                                            <td className="font-monospace">{submission.longitude}</td>
                                          </tr>
                                        )}
                                        {submission.user_uuid && (
                                          <tr>
                                            <td><strong>User ID:</strong></td>
                                            <td className="font-monospace">{submission.user_uuid}</td>
                                          </tr>
                                        )}
                                        {submission.country_uuid && (
                                          <tr>
                                            <td><strong>Country ID:</strong></td>
                                            <td className="font-monospace">{submission.country_uuid}</td>
                                          </tr>
                                        )}
                                        {submission.province_uuid && (
                                          <tr>
                                            <td><strong>Province ID:</strong></td>
                                            <td className="font-monospace">{submission.province_uuid}</td>
                                          </tr>
                                        )}
                                        {submission.area_uuid && (
                                          <tr>
                                            <td><strong>Area ID:</strong></td>
                                            <td className="font-monospace">{submission.area_uuid}</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </Table>
                                  </div>
                                </CardBody>
                              </Collapse>
                            </Card>
                          ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabPane>
              </TabContent>
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
