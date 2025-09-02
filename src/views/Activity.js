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

function Activity() {
  // Sample chart data
  const activityChart = {
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      series: [
        [287, 385, 490, 492, 554, 586, 698],
        [67, 152, 143, 240, 287, 335, 435],
        [23, 113, 67, 108, 190, 239, 307]
      ]
    },
    options: {
      low: 0,
      high: 800,
      showArea: false,
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
    },
    responsiveOptions: [
      [
        "screen and (max-width: 640px)",
        {
          axisX: {
            labelInterpolationFnc: function (value) {
              return value[0];
            }
          }
        }
      ]
    ]
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <Card.Header>
                <Card.Title as="h4">
                  <i className="nc-icon nc-chart-bar-32 mr-2"></i>
                  Activity Dashboard
                </Card.Title>
                <p className="card-category">
                  Monitor real-time activities and performance metrics
                </p>
              </Card.Header>
              <Card.Body>
                <div className="ct-chart" id="activityChart">
                  <ChartistGraph
                    data={activityChart.data}
                    type="Line"
                    options={activityChart.options}
                    responsiveOptions={activityChart.responsiveOptions}
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
                      <i className="nc-icon nc-laptop text-success"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Active Users</p>
                      <Card.Title as="h4">150</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
                  Updated now
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
                      <i className="nc-icon nc-vector text-warning"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Daily Tasks</p>
                      <Card.Title as="h4">87</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-calendar-o"></i>
                  Today
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
                      <p className="card-category">Alerts</p>
                      <Card.Title as="h4">5</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-clock-o"></i>
                  Last hour
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
                      <i className="nc-icon nc-sound-wave text-info"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Performance</p>
                      <Card.Title as="h4">95%</Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh"></i>
                  Live data
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md="8">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Recent Activities</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="activity-feed">
                  <div className="feed-item mb-3">
                    <i className="nc-icon nc-check-2 text-success mr-2"></i>
                    <span>John completed field survey in Area A</span>
                    <small className="text-muted ml-2">2 minutes ago</small>
                  </div>
                  <div className="feed-item mb-3">
                    <i className="nc-icon nc-alert-circle-i text-warning mr-2"></i>
                    <span>Low battery alert from Device #1247</span>
                    <small className="text-muted ml-2">15 minutes ago</small>
                  </div>
                  <div className="feed-item mb-3">
                    <i className="nc-icon nc-single-02 text-info mr-2"></i>
                    <span>Sarah logged in from Remote Location</span>
                    <small className="text-muted ml-2">1 hour ago</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md="4">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Quick Actions</Card.Title>
              </Card.Header>
              <Card.Body>
                <Button variant="primary" className="btn-block mb-2">
                  <i className="nc-icon nc-simple-add"></i> New Activity
                </Button>
                <Button variant="outline-secondary" className="btn-block mb-2">
                  <i className="nc-icon nc-chart-bar-32"></i> Generate Report
                </Button>
                <Button variant="outline-info" className="btn-block">
                  <i className="nc-icon nc-settings"></i> Settings
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Activity;
