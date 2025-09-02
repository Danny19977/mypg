import React from "react";
import ChartistGraph from "react-chartist";
import {
  Badge,
  Button,
  Card,
  Navbar,
  Nav,
  Table,
  Container,
  Row,
  Col,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";

function Dali() {
  // Dali performance chart
  const daliChart = {
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        [20, 45, 30, 65],
        [35, 25, 55, 40],
        [15, 35, 25, 50]
      ]
    },
    options: {
      seriesBarDistance: 10,
      axisX: {
        showGrid: false
      },
      height: "245px"
    }
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">
                  <i className="nc-icon nc-single-02 mr-2"></i>
                  DALI Performance Dashboard
                </Card.Title>
                <p className="card-category">
                  Distributed Addressable Lighting Interface - System monitoring and control
                </p>
              </Card.Header>
              <Card.Body>
                <div className="ct-chart" id="daliChart">
                  <ChartistGraph
                    data={daliChart.data}
                    type="Bar"
                    options={daliChart.options}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-bulb-63 text-warning"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Active Devices</p>
                      <Card.Title as="h4">1,247</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
                  Real-time
                </div>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-settings-gear-64 text-success"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">System Health</p>
                      <Card.Title as="h4">98.5%</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
                  Live
                </div>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-chart-pie-36 text-info"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Energy Saved</p>
                      <Card.Title as="h4">23%</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-calendar-o"></i>
                  This month
                </div>
              </Card.Footer>
            </Card>
          </Col>
          
          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-alert-circle-i text-danger"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Alerts</p>
                      <Card.Title as="h4">7</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-clock-o"></i>
                  Active
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md="8">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <Card.Title as="h4">DALI Device Status</Card.Title>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                <Table className="table-hover table-striped">
                  <thead>
                    <tr>
                      <th className="border-0">Device ID</th>
                      <th className="border-0">Location</th>
                      <th className="border-0">Type</th>
                      <th className="border-0">Brightness</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Last Update</th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>DALI-001</td>
                      <td>Building A - Floor 1</td>
                      <td>LED Panel</td>
                      <td>85%</td>
                      <td>
                        <Badge bg="success">Online</Badge>
                      </td>
                      <td>2 min ago</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="mr-1">
                          <i className="nc-icon nc-settings"></i>
                        </Button>
                        <Button variant="outline-info" size="sm">
                          <i className="nc-icon nc-chart-bar-32"></i>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td>DALI-002</td>
                      <td>Building A - Floor 2</td>
                      <td>Dimmer</td>
                      <td>60%</td>
                      <td>
                        <Badge bg="success">Online</Badge>
                      </td>
                      <td>1 min ago</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="mr-1">
                          <i className="nc-icon nc-settings"></i>
                        </Button>
                        <Button variant="outline-info" size="sm">
                          <i className="nc-icon nc-chart-bar-32"></i>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td>DALI-003</td>
                      <td>Building B - Lobby</td>
                      <td>Emergency Light</td>
                      <td>100%</td>
                      <td>
                        <Badge bg="warning">Maintenance</Badge>
                      </td>
                      <td>45 min ago</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="mr-1">
                          <i className="nc-icon nc-settings"></i>
                        </Button>
                        <Button variant="outline-info" size="sm">
                          <i className="nc-icon nc-chart-bar-32"></i>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td>DALI-004</td>
                      <td>Building C - Parking</td>
                      <td>Sensor</td>
                      <td>0%</td>
                      <td>
                        <Badge bg="danger">Offline</Badge>
                      </td>
                      <td>2 hours ago</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="mr-1">
                          <i className="nc-icon nc-settings"></i>
                        </Button>
                        <Button variant="outline-info" size="sm">
                          <i className="nc-icon nc-chart-bar-32"></i>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md="4">
            <Card>
              <Card.Header>
                <Card.Title as="h4">System Controls</Card.Title>
              </Card.Header>
              <Card.Body>
                <Button variant="primary" className="btn-block mb-2">
                  <i className="nc-icon nc-bulb-63"></i> All Lights On
                </Button>
                <Button variant="secondary" className="btn-block mb-2">
                  <i className="nc-icon nc-button-power"></i> Emergency Mode
                </Button>
                <Button variant="outline-warning" className="btn-block mb-2">
                  <i className="nc-icon nc-settings"></i> Auto Schedule
                </Button>
                <hr />
                <h6>Quick Actions</h6>
                <Button variant="outline-primary" className="btn-block mb-2">
                  <i className="nc-icon nc-refresh-69"></i> Refresh All
                </Button>
                <Button variant="outline-info" className="btn-block">
                  <i className="nc-icon nc-paper"></i> System Report
                </Button>
              </Card.Body>
            </Card>
            
            <Card className="mt-3">
              <Card.Header>
                <Card.Title as="h4">Recent Alerts</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="alert-feed">
                  <div className="alert-item mb-2">
                    <i className="nc-icon nc-alert-circle-i text-danger mr-2"></i>
                    <span className="small">Device DALI-004 offline</span>
                    <small className="text-muted d-block">2 hours ago</small>
                  </div>
                  <div className="alert-item mb-2">
                    <i className="nc-icon nc-settings text-warning mr-2"></i>
                    <span className="small">Maintenance mode activated</span>
                    <small className="text-muted d-block">3 hours ago</small>
                  </div>
                  <div className="alert-item mb-2">
                    <i className="nc-icon nc-check-2 text-success mr-2"></i>
                    <span className="small">Energy target achieved</span>
                    <small className="text-muted d-block">1 day ago</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dali;
