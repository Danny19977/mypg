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

function Sales() {
  // Sales chart data
  const salesChart = {
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [
        [287, 385, 490, 492, 554, 586],
        [67, 152, 143, 240, 287, 335],
      ]
    },
    options: {
      low: 0,
      high: 700,
      showArea: true,
      height: "245px",
      axisX: {
        showGrid: false,
      },
      lineSmooth: true,
      showLine: true,
      showPoint: true,
      fullWidth: true,
      chartPadding: {
        right: 50
      }
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
                  <i className="nc-icon nc-money-coins mr-2"></i>
                  Sales Dashboard
                </Card.Title>
                <p className="card-category">
                  Track sales performance, revenue, and team achievements
                </p>
              </Card.Header>
              <Card.Body>
                <div className="ct-chart" id="salesChart">
                  <ChartistGraph
                    data={salesChart.data}
                    type="Line"
                    options={salesChart.options}
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
                      <i className="nc-icon nc-money-coins text-success"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Total Revenue</p>
                      <Card.Title as="h4">$1.2M</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
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
                      <i className="nc-icon nc-chart-bar-32 text-warning"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Sales</p>
                      <Card.Title as="h4">847</Card.Title>
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
                      <i className="nc-icon nc-single-02 text-info"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Customers</p>
                      <Card.Title as="h4">2,145</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
                  Active
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
                      <i className="nc-icon nc-favourite-28 text-danger"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Conversion</p>
                      <Card.Title as="h4">78%</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-clock-o"></i>
                  This week
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md="8">
            <Card className="strpied-tabled-with-hover">
              <Card.Header>
                <Card.Title as="h4">Top Sales Representatives</Card.Title>
              </Card.Header>
              <Card.Body className="table-full-width table-responsive px-0">
                <Table className="table-hover table-striped">
                  <thead>
                    <tr>
                      <th className="border-0">Rep Name</th>
                      <th className="border-0">Territory</th>
                      <th className="border-0">Sales</th>
                      <th className="border-0">Revenue</th>
                      <th className="border-0">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm mr-3">
                            <span className="avatar-title rounded-circle bg-success">AM</span>
                          </div>
                          Alice Miller
                        </div>
                      </td>
                      <td>Los Angeles County</td>
                      <td>156</td>
                      <td>$234,500</td>
                      <td>
                        <Badge bg="success">Excellent</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm mr-3">
                            <span className="avatar-title rounded-circle bg-info">BT</span>
                          </div>
                          Bob Thompson
                        </div>
                      </td>
                      <td>Harris County</td>
                      <td>142</td>
                      <td>$198,750</td>
                      <td>
                        <Badge bg="success">Excellent</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm mr-3">
                            <span className="avatar-title rounded-circle bg-warning">CW</span>
                          </div>
                          Carol Wilson
                        </div>
                      </td>
                      <td>Metropolitan Area A</td>
                      <td>128</td>
                      <td>$167,200</td>
                      <td>
                        <Badge bg="warning">Good</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm mr-3">
                            <span className="avatar-title rounded-circle bg-primary">DJ</span>
                          </div>
                          David Johnson
                        </div>
                      </td>
                      <td>Rural District 12</td>
                      <td>95</td>
                      <td>$143,800</td>
                      <td>
                        <Badge bg="warning">Good</Badge>
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
                <Card.Title as="h4">Monthly Targets</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="progress-container progress-success">
                  <span className="progress-badge">Revenue Target</span>
                  <div className="progress">
                    <div className="progress-bar progress-bar-success" style={{width: "85%"}}>
                      <span className="sr-only">85%</span>
                    </div>
                  </div>
                </div>
                <div className="progress-container progress-info">
                  <span className="progress-badge">Sales Count</span>
                  <div className="progress">
                    <div className="progress-bar progress-bar-info" style={{width: "72%"}}>
                      <span className="sr-only">72%</span>
                    </div>
                  </div>
                </div>
                <div className="progress-container progress-warning">
                  <span className="progress-badge">New Customers</span>
                  <div className="progress">
                    <div className="progress-bar progress-bar-warning" style={{width: "68%"}}>
                      <span className="sr-only">68%</span>
                    </div>
                  </div>
                </div>
                <hr />
                <Button variant="primary" className="btn-block mb-2">
                  <i className="nc-icon nc-simple-add"></i> New Sale
                </Button>
                <Button variant="outline-secondary" className="btn-block">
                  <i className="nc-icon nc-paper"></i> Sales Report
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Sales;
