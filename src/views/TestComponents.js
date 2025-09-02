import React from 'react';
import { 
  Card, Container, Row, Col, Button, Modal, Form, 
  Alert, Table, Badge, Dropdown 
} from "react-bootstrap";

function TestComponents() {
  return (
    <Container>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title>Component Test</Card.Title>
            </Card.Header>
            <Card.Body>
              <Button variant="primary">Test Button</Button>
              <Badge bg="success">Test Badge</Badge>
              <Alert variant="info">Test Alert</Alert>
              <Dropdown>
                <Dropdown.Toggle variant="secondary">
                  Test Dropdown
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>Test Item</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TestComponents;
