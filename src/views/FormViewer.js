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
  Alert,
  Progress
} from 'reactstrap';
import { 
  formService, 
  formItemService, 
  formOptionService, 
  formSubmissionService, 
  formResponseService 
} from '../services/apiServices';

const FormViewer = ({ formUuid, isPublic = false }) => {
  const [form, setForm] = useState(null);
  const [formItems, setFormItems] = useState([]);
  const [formOptions, setFormOptions] = useState({});
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Load form data on component mount
  useEffect(() => {
    if (formUuid) {
      loadFormData();
    }
  }, [formUuid]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      
      // Load form details
      const formResponse = isPublic 
        ? await formService.getPublicForm(formUuid)
        : await formService.getByUuid(formUuid);
      
      if (formResponse.status === 'success') {
        setForm(formResponse.data);
      }

      // Load form items
      const itemsResponse = isPublic
        ? await formItemService.getPublicFormItems(formUuid)
        : await formItemService.getByForm(formUuid);
      
      if (itemsResponse.status === 'success') {
        const items = itemsResponse.data.sort((a, b) => a.sort_order - b.sort_order);
        setFormItems(items);
        
        // Load options for select/radio/checkbox fields
        const optionsData = {};
        for (const item of items) {
          if (['select', 'radio', 'checkbox'].includes(item.item_type)) {
            try {
              const optionsResponse = isPublic
                ? await formOptionService.getPublicOptions(item.uuid)
                : await formOptionService.getByFormItem(item.uuid);
              
              if (optionsResponse.status === 'success') {
                optionsData[item.uuid] = optionsResponse.data;
              }
            } catch (error) {
              console.warn(`Failed to load options for item ${item.uuid}:`, error);
            }
          }
        }
        setFormOptions(optionsData);
      }
    } catch (error) {
      setError('Failed to load form: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (itemUuid, value, valueType = 'text') => {
    setResponses(prev => ({
      ...prev,
      [itemUuid]: {
        value,
        valueType,
        form_item_uuid: itemUuid
      }
    }));

    // Clear validation error for this field
    if (validationErrors[itemUuid]) {
      setValidationErrors(prev => ({
        ...prev,
        [itemUuid]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    formItems.forEach(item => {
      if (item.required && !responses[item.uuid]?.value) {
        errors[item.uuid] = 'This field is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create form submission
      const submissionData = {
        form_uuid: formUuid,
        submitter_name: responses.submitter_name || '',
        submitter_email: responses.submitter_email || '',
        user_uuid: '', // Set from auth context if authenticated
        country_uuid: '',
        province_uuid: '',
        area_uuid: '',
        status: 'submitted'
      };

      const submissionResponse = isPublic
        ? await formSubmissionService.submitForm(submissionData)
        : await formSubmissionService.create(submissionData);

      if (submissionResponse.status === 'success') {
        const submissionUuid = submissionResponse.data.uuid;
        
        // Create individual field responses
        const responsePromises = Object.entries(responses).map(([itemUuid, responseData]) => {
          const responsePayload = {
            visite_harder_uuid: submissionUuid,
            form_item_uuid: itemUuid,
            text_value: responseData.valueType === 'text' ? responseData.value : '',
            number_value: responseData.valueType === 'number' ? parseFloat(responseData.value) : null,
            boolean_value: responseData.valueType === 'boolean' ? responseData.value : null,
            date_value: responseData.valueType === 'date' ? responseData.value : null,
            file_url: responseData.valueType === 'file' ? responseData.value : '',
            user_uuid: '', // Set from auth context if authenticated
            area_uuid: '',
            province_uuid: '',
            country_uuid: ''
          };

          return isPublic
            ? formResponseService.submitResponse(responsePayload)
            : formResponseService.create(responsePayload);
        });

        await Promise.all(responsePromises);
        
        setSuccess('Form submitted successfully!');
        setResponses({});
        setValidationErrors({});
      }
    } catch (error) {
      setError('Failed to submit form: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormItem = (item) => {
    const value = responses[item.uuid]?.value || '';
    const hasError = validationErrors[item.uuid];
    const options = formOptions[item.uuid] || [];

    switch (item.item_type) {
      case 'text':
      case 'email':
        return (
          <Input
            type={item.item_type}
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );

      case 'textarea':
        return (
          <Input
            type="textarea"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
            rows="3"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'number')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'date')}
            invalid={!!hasError}
          />
        );

      case 'select':
        return (
          <Input
            type="select"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.uuid} value={option.value}>
                {option.display_text}
              </option>
            ))}
          </Input>
        );

      case 'radio':
        return (
          <div>
            {options.map((option) => (
              <FormGroup check key={option.uuid}>
                <Label check>
                  <Input
                    type="radio"
                    name={item.uuid}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
                  />
                  {option.display_text}
                </Label>
              </FormGroup>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            {options.map((option) => (
              <FormGroup check key={option.uuid}>
                <Label check>
                  <Input
                    type="checkbox"
                    value={option.value}
                    checked={value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = value ? value.split(',') : [];
                      let newValues;
                      
                      if (e.target.checked) {
                        newValues = [...currentValues, option.value];
                      } else {
                        newValues = currentValues.filter(v => v !== option.value);
                      }
                      
                      handleInputChange(item.uuid, newValues.join(','), 'text');
                    }}
                  />
                  {option.display_text}
                </Label>
              </FormGroup>
            ))}
          </div>
        );

      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              // In a real app, you'd upload the file and get a URL
              const fileName = e.target.files[0]?.name || '';
              handleInputChange(item.uuid, fileName, 'file');
            }}
            invalid={!!hasError}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(item.uuid, e.target.value, 'text')}
            invalid={!!hasError}
            placeholder={`Enter ${item.question.toLowerCase()}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardBody className="text-center">
                <Progress animated value={75} />
                <p className="mt-3">Loading form...</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardBody className="text-center">
                <h5>Form not found</h5>
                <p>The requested form could not be found.</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="content">
      <Row>
        <Col md="8" className="mx-auto">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">{form.title}</CardTitle>
              {form.description && (
                <p className="text-muted mb-0">{form.description}</p>
              )}
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

              <Form onSubmit={handleSubmit}>
                {formItems.map((item, index) => (
                  <FormGroup key={item.uuid} className="mb-4">
                    <Label for={item.uuid}>
                      {item.question}
                      {item.required && <span className="text-danger"> *</span>}
                    </Label>
                    {renderFormItem(item)}
                    {validationErrors[item.uuid] && (
                      <div className="text-danger mt-1">
                        <small>{validationErrors[item.uuid]}</small>
                      </div>
                    )}
                  </FormGroup>
                ))}

                <div className="text-center mt-4">
                  <Button 
                    type="submit" 
                    color="primary" 
                    size="lg"
                    disabled={submitting || formItems.length === 0}
                  >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FormViewer;
