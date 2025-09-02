import React, { useState } from 'react';
import { Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../services/api';

function ApiConnectionTest() {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Countries Endpoint',
        endpoint: '/countries/all',
        method: 'GET',
        description: 'Test countries data retrieval'
      },
      {
        name: 'Presents Endpoint',
        endpoint: '/visites/all',
        method: 'GET',
        description: 'Test presents data retrieval'
      },
      {
        name: 'Sales Endpoint',
        endpoint: '/sales/all',
        method: 'GET',
        description: 'Test sales data retrieval'
      },
      {
        name: 'Areas Endpoint',
        endpoint: '/areas/all',
        method: 'GET',
        description: 'Test areas data retrieval'
      },
      {
        name: 'Provinces Endpoint',
        endpoint: '/provinces/all',
        method: 'GET',
        description: 'Test provinces data retrieval'
      }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await api.get(test.endpoint);
        const endTime = Date.now();
        
        setTestResults(prev => [...prev, {
          ...test,
          status: 'success',
          message: `✅ Success (${endTime - startTime}ms)`,
          data: response.data
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          ...test,
          status: 'error',
          message: `❌ Error: ${error.message}`,
          error: error.response?.data || error.message
        }]);
      }
    }
    
    setTesting(false);
  };

  return (
    <Container fluid>
      <Row>
        <Col md="12">
          <Card>
            <Card.Header>
              <Card.Title as="h4">
                <i className="nc-icon nc-settings-gear-65 mr-2"></i>
                API Connection Test
              </Card.Title>
              <p className="card-category">
                Test your connection to the Go backend API
              </p>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6>Current Configuration:</h6>
                <div className="bg-light p-3 rounded">
                  <strong>API Base URL:</strong> {process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}<br/>
                  <strong>Timeout:</strong> {process.env.REACT_APP_API_TIMEOUT || '10000'}ms<br/>
                  <strong>Debug Mode:</strong> {process.env.REACT_APP_DEBUG_API === 'true' ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              <Button 
                variant="primary" 
                onClick={runTests} 
                disabled={testing}
                className="mb-4"
              >
                {testing ? (
                  <>
                    <Spinner size="sm" animation="border" className="mr-2" />
                    Running Tests...
                  </>
                ) : (
                  'Run API Tests'
                )}
              </Button>

              {testResults.length > 0 && (
                <div>
                  <h6>Test Results:</h6>
                  {testResults.map((result, index) => (
                    <Alert 
                      key={index}
                      variant={result.status === 'success' ? 'success' : 'danger'}
                      className="mb-2"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{result.name}</strong>
                          <br />
                          <small className="text-muted">{result.description}</small>
                          <br />
                          <code>{result.method} {result.endpoint}</code>
                        </div>
                        <div className="text-right">
                          <div>{result.message}</div>
                          {result.status === 'success' && result.data && (
                            <small className="text-muted">
                              {Array.isArray(result.data) 
                                ? `${result.data.length} records` 
                                : 'Data received'
                              }
                            </small>
                          )}
                        </div>
                      </div>
                      
                      {result.status === 'error' && (
                        <details className="mt-2">
                          <summary>Error Details</summary>
                          <pre className="mt-2 p-2 bg-light rounded">
                            {JSON.stringify(result.error, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Alert>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <h6>Troubleshooting:</h6>
                <ul>
                  <li><strong>Connection refused:</strong> Make sure your Go backend server is running</li>
                  <li><strong>404 errors:</strong> Check if the endpoints exist in your Go backend</li>
                  <li><strong>CORS errors:</strong> Add CORS middleware to your Go backend</li>
                  <li><strong>Timeout errors:</strong> Check if your backend is responding within the timeout period</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ApiConnectionTest;
