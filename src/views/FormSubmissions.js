import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Table,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Input,
  Form,
  FormGroup,
  Label,
  Pagination,
  PaginationItem,
  PaginationLink
} from 'reactstrap';
import { 
  formSubmissionService, 
  formResponseService, 
  formService 
} from '../services/apiServices';

const FormSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionResponses, setSubmissionResponses] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  
  // Modal state
  const [detailModal, setDetailModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadSubmissions();
    loadForms();
  }, [currentPage, pageSize, searchTerm, statusFilter, formFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await formSubmissionService.getAllPaginated(
        currentPage, 
        pageSize, 
        searchTerm
      );
      
      if (response.status === 'success') {
        setSubmissions(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.total_pages);
          setTotalRecords(response.pagination.total_records);
        }
      }
    } catch (error) {
      setError('Failed to load submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const loadSubmissionDetails = async (submission) => {
    try {
      setLoading(true);
      const response = await formResponseService.getBySubmission(submission.uuid);
      
      if (response.status === 'success') {
        setSubmissionResponses(response.data);
        setSelectedSubmission(submission);
        setDetailModal(true);
      }
    } catch (error) {
      setError('Failed to load submission details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionUuid, newStatus) => {
    try {
      setLoading(true);
      const response = await formSubmissionService.update(submissionUuid, {
        status: newStatus
      });
      
      if (response.status === 'success') {
        setSuccess(`Submission status updated to ${newStatus}`);
        loadSubmissions();
        if (selectedSubmission?.uuid === submissionUuid) {
          setSelectedSubmission({...selectedSubmission, status: newStatus});
        }
      }
    } catch (error) {
      setError('Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'primary',
      reviewed: 'warning',
      approved: 'success',
      rejected: 'danger',
      pending: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFormTitle = (formUuid) => {
    const form = forms.find(f => f.uuid === formUuid);
    return form ? form.title : 'Unknown Form';
  };

  const renderSubmissionValue = (response) => {
    if (response.text_value) return response.text_value;
    if (response.number_value !== null) return response.number_value.toString();
    if (response.boolean_value !== null) return response.boolean_value ? 'Yes' : 'No';
    if (response.date_value) return new Date(response.date_value).toLocaleDateString();
    if (response.file_url) return <a href={response.file_url} target="_blank" rel="noopener noreferrer">View File</a>;
    return 'No response';
  };

  return (
    <div className="content">
      <Row>
        <Col md="12">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">Form Submissions</CardTitle>
              <div className="d-flex gap-2">
                <Input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: '200px' }}
                />
                <Input
                  type="select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: '150px' }}
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Input>
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

              {loading && submissions.length === 0 ? (
                <div className="text-center">
                  <p>Loading submissions...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <small className="text-muted">
                      Showing {submissions.length} of {totalRecords} submissions
                    </small>
                  </div>

                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Form</th>
                        <th>Submitter</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No submissions found
                          </td>
                        </tr>
                      ) : (
                        submissions.map((submission) => (
                          <tr key={submission.uuid}>
                            <td>
                              <strong>{getFormTitle(submission.form_uuid)}</strong>
                            </td>
                            <td>{submission.submitter_name || 'Anonymous'}</td>
                            <td>{submission.submitter_email || 'N/A'}</td>
                            <td>
                              <Badge color={getStatusColor(submission.status)}>
                                {submission.status || 'submitted'}
                              </Badge>
                            </td>
                            <td>{formatDate(submission.created_at)}</td>
                            <td>
                              <Button
                                color="info"
                                size="sm"
                                className="me-1"
                                onClick={() => loadSubmissionDetails(submission)}
                              >
                                View
                              </Button>
                              
                              {submission.status !== 'approved' && (
                                <Button
                                  color="success"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => updateSubmissionStatus(submission.uuid, 'approved')}
                                >
                                  Approve
                                </Button>
                              )}
                              
                              {submission.status !== 'rejected' && (
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => updateSubmissionStatus(submission.uuid, 'rejected')}
                                >
                                  Reject
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <PaginationItem disabled={currentPage === 1}>
                          <PaginationLink 
                            previous 
                            onClick={() => setCurrentPage(currentPage - 1)}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, index) => (
                          <PaginationItem 
                            key={index + 1} 
                            active={currentPage === index + 1}
                          >
                            <PaginationLink onClick={() => setCurrentPage(index + 1)}>
                              {index + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem disabled={currentPage === totalPages}>
                          <PaginationLink 
                            next 
                            onClick={() => setCurrentPage(currentPage + 1)}
                          />
                        </PaginationItem>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Submission Detail Modal */}
      <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} size="lg">
        <ModalHeader toggle={() => setDetailModal(false)}>
          Submission Details
        </ModalHeader>
        <ModalBody>
          {selectedSubmission && (
            <>
              <Row className="mb-3">
                <Col md="6">
                  <strong>Form:</strong> {getFormTitle(selectedSubmission.form_uuid)}
                </Col>
                <Col md="6">
                  <strong>Status:</strong>{' '}
                  <Badge color={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status || 'submitted'}
                  </Badge>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md="6">
                  <strong>Submitter:</strong> {selectedSubmission.submitter_name || 'Anonymous'}
                </Col>
                <Col md="6">
                  <strong>Email:</strong> {selectedSubmission.submitter_email || 'N/A'}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md="6">
                  <strong>Submitted:</strong> {formatDate(selectedSubmission.created_at)}
                </Col>
                <Col md="6">
                  <strong>Last Updated:</strong> {formatDate(selectedSubmission.updated_at)}
                </Col>
              </Row>

              <hr />
              
              <h5>Responses</h5>
              {submissionResponses.length === 0 ? (
                <p>No responses found for this submission.</p>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionResponses.map((response) => (
                      <tr key={response.uuid}>
                        <td>
                          <strong>{response.form_item?.question || 'Unknown Question'}</strong>
                          <br />
                          <small className="text-muted">
                            {response.form_item?.item_type || 'text'}
                          </small>
                        </td>
                        <td>{renderSubmissionValue(response)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDetailModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default FormSubmissions;
