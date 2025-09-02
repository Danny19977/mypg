import React from "react";
import {
  Badge,
  Button,
  Card,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";

// Import our custom hooks for API calls
import { useDashboardStats, useRecentActivities } from "../hooks/useApi";

function Dashboard() {
  // API hooks for dashboard data
  const { data: stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivities, loading: activitiesLoading, error: activitiesError } = useRecentActivities(5);

  return (
    <>
      <Container fluid>
        <Row>
          {/* Statistics Cards */}
          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="nc-icon nc-single-02 text-warning"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Total Presents</p>
                      <Card.Title as="h4">
                        {statsLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          stats?.total_presents || '0'
                        )}
                      </Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fas fa-redo mr-1"></i>
                  Live Data
                </div>
              </Card.Footer>
            </Card>
          </Col>

          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-success">
                      <i className="nc-icon nc-globe text-success"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Active Countries</p>
                      <Card.Title as="h4">
                        {statsLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          stats?.total_countries || '0'
                        )}
                      </Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fas fa-calendar-alt mr-1"></i>
                  Updated Today
                </div>
              </Card.Footer>
            </Card>
          </Col>

          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-danger">
                      <i className="nc-icon nc-money-coins text-danger"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Total Sales</p>
                      <Card.Title as="h4">
                        {statsLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          `$${stats?.total_sales || '0'}`
                        )}
                      </Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fas fa-clock mr-1"></i>
                  This Month
                </div>
              </Card.Footer>
            </Card>
          </Col>

          <Col lg="3" sm="6">
            <Card className="card-stats">
              <Card.Body>
                <Row>
                  <Col xs="5">
                    <div className="icon-big text-center icon-info">
                      <i className="nc-icon nc-chart-bar-32 text-info"></i>
                    </div>
                  </Col>
                  <Col xs="7">
                    <div className="numbers">
                      <p className="card-category">Total Areas</p>
                      <Card.Title as="h4">
                        {statsLoading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          stats?.total_areas || '0'
                        )}
                      </Card.Title>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer>
                <hr />
                <div className="stats">
                  <i className="fas fa-trending-up mr-1"></i>
                  This Week
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Recent Activities */}
          <Col md="8">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Recent Activities</Card.Title>
                <p className="card-category">Latest team activities and updates</p>
              </Card.Header>
              <Card.Body>
                {activitiesLoading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading recent activities...</p>
                  </div>
                )}

                {activitiesError && (
                  <Alert variant="danger">
                    <strong>Error:</strong> {activitiesError}
                  </Alert>
                )}

                {!activitiesLoading && !activitiesError && (
                  <div className="table-responsive">
                    {recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div key={activity.id || index} className="mb-3 p-3 border-bottom">
                          <div className="d-flex justify-content-between">
                            <div>
                              <h6 className="mb-1">{activity.title || activity.activity_type}</h6>
                              <p className="text-muted mb-1">{activity.description}</p>
                              <small className="text-muted">
                                {activity.user_name || 'System'} • {new Date(activity.created_at).toLocaleString()}
                              </small>
                            </div>
                            <div>
                              <Badge 
                                variant={activity.status === 'completed' ? 'success' : 'warning'}
                              >
                                {activity.status || 'pending'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No recent activities found</p>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col md="4">
            <Card>
              <Card.Header>
                <Card.Title as="h4">Quick Actions</Card.Title>
                <p className="card-category">Common tasks and operations</p>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="outline-success" href="/admin/country">
                    <i className="nc-icon nc-globe mr-2"></i>
                    Manage Countries
                  </Button>
                  <Button variant="outline-info" href="/admin/sales">
                    <i className="nc-icon nc-money-coins mr-2"></i>
                    View Sales
                  </Button>
                  <Button variant="outline-warning" href="/admin/activity">
                    <i className="nc-icon nc-chart-bar-32 mr-2"></i>
                    Activity Reports
                  </Button>
                </div>

                {/* Status Overview */}
                <div className="mt-4">
                  <h6>System Status</h6>
                  <div className="mb-2">
                    <small className="text-muted d-block">API Connection</small>
                    <Badge variant={!statsError ? 'success' : 'danger'}>
                      {!statsError ? 'Connected' : 'Error'}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <small className="text-muted d-block">Data Sync</small>
                    <Badge variant="success">Up to date</Badge>
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

export default Dashboard;
