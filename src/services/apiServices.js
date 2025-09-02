// ...existing code...
import api from './api';

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

export const authService = {
  // Login - Updated for token-based authentication
  login: async (credentials) => {
    try {
      // Backend expects: { identifier: string, password: string }
      // Login endpoint is /auth/login based on backend routes
      const response = await api.post('/auth/login', {
        identifier: credentials.identifier, // Can be email or phone
        password: credentials.password
      });
      
      // Backend returns: { message: "success", data: "jwt-token" }
      if (response.data.data) {
        // Store JWT token in localStorage
        localStorage.setItem('authToken', response.data.data);
        console.log('🔐 JWT token stored successfully');
      }
      
      return response.data;
    } catch (error) {
      // Extract error message from backend response
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Login failed: ${errorMessage}`);
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(`Registration failed: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get authenticated user
  getAuthUser: async () => {
    try {
      const response = await api.get('/auth/user');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  },

  // Logout - Updated for token-based authentication
  logout: async () => {
    try {
      // Call logout endpoint with Authorization header
      const response = await api.post('/auth/logout');
      // Remove JWT token from localStorage
      localStorage.removeItem('authToken');
      console.log('🔓 JWT token removed successfully');
      return response.data;
    } catch (error) {
      // Clear token even if logout fails
      localStorage.removeItem('authToken');
      console.log('🔓 JWT token removed (forced due to error)');
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
};

// MANAGER SERVICES
export const managerService = {
  // Get all managers
  getAll: async () => {
    try {
      const response = await api.get('/managers');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch managers: ${error.response?.data?.message || error.message}`);
    }
  },

  // Create manager
  create: async (managerData) => {
    try {
      const response = await api.post('/managers/create', managerData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create manager: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update manager
  update: async (uuid, managerData) => {
    try {
      const response = await api.put(`/managers/update/${uuid}`, managerData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update manager: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete manager
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/managers/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete manager: ${error.response?.data?.message || error.message}`);
    }
  }
};

// ============================================================================
// VISITE SERVICES (Store Visits) - For /visites endpoints
// ============================================================================

export const visiteService = {
  getByUser: async (user_uuid) => {
    try {
      const response = await api.get(`/visites/user/${user_uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user visites: ${error.message}`);
    }
  },
  getByUserAndDateRange: async (user_uuid, start, end) => {
    try {
      const response = await api.get(`/visites/user/${user_uuid}/date-range?start=${start}&end=${end}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user visites by date range: ${error.message}`);
    }
  },
  getAll: async (includeDeleted = true) => {
    try {
      const url = includeDeleted ? '/visites/all?includeDeleted=true' : '/visites/all';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch visites: ${error.message}`);
    }
  },
  getAllPaginated: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/visites/all/paginate?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch visites: ${error.message}`);
    }
  },
  getByDateRange: async (start, end) => {
    try {
      const response = await api.get(`/visites/date-range?start=${start}&end=${end}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch visites by date range: ${error.message}`);
    }
  },
  getByUuid: async (uuid) => {
    try {
      const response = await api.get(`/visites/get/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch visite: ${error.message}`);
    }
  },
  create: async (visiteData) => {
    try {
      console.log('API Service - Data being sent to backend:', visiteData);
      console.log('API Service - Fields in request:', Object.keys(visiteData));
      
      const response = await api.post('/visites/create', visiteData);
      console.log('API Service - Backend response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('API Service - Create error:', error.response?.data || error.message);
      throw new Error(`Failed to create visite: ${error.response?.data?.message || error.message}`);
    }
  },
  update: async (uuid, visiteData) => {
    try {
      const response = await api.put(`/visites/update/${uuid}`, visiteData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update visite: ${error.response?.data?.message || error.message}`);
    }
  },
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/visites/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete visite: ${error.message}`);
    }
  }
};

// Expose visiteService globally for UI filter integration
if (typeof window !== 'undefined') {
  window.visiteService = visiteService;
}

// ============================================================================
// TERRITORY SERVICES (Countries, Provinces, Areas) - Updated to match backend
// ============================================================================

export const territoryService = {
  // Countries
  countries: {
    getAll: async () => {
      try {
        const response = await api.get('/countries/all');
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch countries: ${error.message}`);
      }
    },

    getAllPaginated: async (page = 1, limit = 10) => {
      try {
        const response = await api.get(`/countries/all/paginate?page=${page}&limit=${limit}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch countries: ${error.message}`);
      }
    },
    
    getByUuid: async (uuid) => {
      try {
        const response = await api.get(`/countries/get/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch country: ${error.message}`);
      }
    },
    
    create: async (countryData) => {
      try {
        const response = await api.post('/countries/create', countryData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create country: ${error.response?.data?.message || error.message}`);
      }
    },
    
    update: async (uuid, countryData) => {
      try {
        const response = await api.put(`/countries/update/${uuid}`, countryData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to update country: ${error.response?.data?.message || error.message}`);
      }
    },
    
    delete: async (uuid) => {
      try {
        const response = await api.delete(`/countries/delete/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to delete country: ${error.message}`);
      }
    }
  },

  // Provinces
  provinces: {
    getAll: async () => {
      try {
        const response = await api.get('/provinces/all');
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch provinces: ${error.message}`);
      }
    },

    getAllPaginated: async (page = 1, limit = 10) => {
      try {
        const response = await api.get(`/provinces/all/paginate?page=${page}&limit=${limit}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch provinces: ${error.message}`);
      }
    },

    getByCountry: async (countryUuid) => {
      try {
        const response = await api.get(`/provinces/all/country/${countryUuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch provinces by country: ${error.message}`);
      }
    },
    
    getByUuid: async (uuid) => {
      try {
        const response = await api.get(`/provinces/get/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch province: ${error.message}`);
      }
    },
    
    create: async (provinceData) => {
      try {
        const response = await api.post('/provinces/create', provinceData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create province: ${error.response?.data?.message || error.message}`);
      }
    },
    
    update: async (uuid, provinceData) => {
      try {
        const response = await api.put(`/provinces/update/${uuid}`, provinceData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to update province: ${error.response?.data?.message || error.message}`);
      }
    },
    
    delete: async (uuid) => {
      try {
        const response = await api.delete(`/provinces/delete/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to delete province: ${error.message}`);
      }
    }
  },

  // Areas
  areas: {
    getAll: async () => {
      try {
        const response = await api.get('/areas/all');
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch areas: ${error.message}`);
      }
    },

    getAllPaginated: async (page = 1, limit = 10) => {
      try {
        const response = await api.get(`/areas/all/paginate?page=${page}&limit=${limit}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch areas: ${error.message}`);
      }
    },

    getByProvinceUuid: async (provinceUuid) => {
      try {
        const response = await api.get(`/areas/all/province_uuid?province_uuid=${provinceUuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch areas for province: ${error.message}`);
      }
    },

    getByProvince: async (provinceUuid) => {
      try {
        const response = await api.get(`/areas/all/province/${provinceUuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch areas for province: ${error.message}`);
      }
    },
    
    getByUuid: async (uuid) => {
      try {
        const response = await api.get(`/areas/get/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch area: ${error.message}`);
      }
    },
    
    create: async (areaData) => {
      try {
        const response = await api.post('/areas/create', areaData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create area: ${error.response?.data?.message || error.message}`);
      }
    },
    
    update: async (uuid, areaData) => {
      try {
        const response = await api.put(`/areas/update/${uuid}`, areaData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to update area: ${error.response?.data?.message || error.message}`);
      }
    },
    
    delete: async (uuid) => {
      try {
        const response = await api.delete(`/areas/delete/${uuid}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to delete area: ${error.message}`);
      }
    }
  }
};

// ============================================================================
// SALES SERVICES - Updated to match backend routes
// ============================================================================

export const salesService = {
  // Get all sales
  getAll: async () => {
    try {
      const response = await api.get('/sales/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
  },

  // Get sales with pagination
  getAllPaginated: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/sales/all/paginate?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
  },

  // Get sales by area
  getByArea: async (areaUuid) => {
    try {
      const response = await api.get(`/sales/all/area/${areaUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales by area: ${error.message}`);
    }
  },

  // Get sales by province
  getByProvince: async (provinceUuid) => {
    try {
      const response = await api.get(`/sales/all/province/${provinceUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales by province: ${error.message}`);
    }
  },

  // Get sales by country
  getByCountry: async (countryUuid) => {
    try {
      const response = await api.get(`/sales/all/country/${countryUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales by country: ${error.message}`);
    }
  },

  // Get sales by quantity range
  getByQuantityRange: async (minQty, maxQty) => {
    try {
      const response = await api.get(`/sales/quantity-range?min=${minQty}&max=${maxQty}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales by quantity range: ${error.message}`);
    }
  },

  // Get sales by price range
  getByPriceRange: async (minPrice, maxPrice) => {
    try {
      const response = await api.get(`/sales/price-range?min=${minPrice}&max=${maxPrice}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales by price range: ${error.message}`);
    }
  },

  // Get sales by UUID
  getByUuid: async (uuid) => {
    try {
      const response = await api.get(`/sales/get/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch sales: ${error.message}`);
    }
  },

  // Create new sale
  create: async (saleData) => {
    try {
      const response = await api.post('/sales/create', saleData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create sale: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update sale
  update: async (uuid, saleData) => {
    try {
      const response = await api.put(`/sales/update/${uuid}`, saleData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update sale: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete sale
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/sales/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete sale: ${error.message}`);
    }
  }
};

// ============================================================================
// DELI SERVICES (This appears to be your "Dali" feature)
// ============================================================================

export const deliService = {
  // Get all delis
  getAll: async () => {
    try {
      const response = await api.get('/delis/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delis: ${error.message}`);
    }
  },

  // Get delis with pagination
  getAllPaginated: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/delis/all/paginate?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delis: ${error.message}`);
    }
  },

  // Get delis by area
  getByArea: async (areaUuid) => {
    try {
      const response = await api.get(`/delis/all/area/${areaUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delis by area: ${error.message}`);
    }
  },

  // Get delis by province
  getByProvince: async (provinceUuid) => {
    try {
      const response = await api.get(`/delis/all/province/${provinceUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delis by province: ${error.message}`);
    }
  },

  // Get delis by country
  getByCountry: async (countryUuid) => {
    try {
      const response = await api.get(`/delis/all/country/${countryUuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch delis by country: ${error.message}`);
    }
  },

  // Get deli by UUID
  getByUuid: async (uuid) => {
    try {
      const response = await api.get(`/delis/get/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch deli: ${error.message}`);
    }
  },

  // Create new deli
  create: async (deliData) => {
    try {
      const response = await api.post('/delis/create', deliData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create deli: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update deli
  update: async (uuid, deliData) => {
    try {
      const response = await api.put(`/delis/update/${uuid}`, deliData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update deli: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete deli
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/delis/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete deli: ${error.message}`);
    }
  }
};

// ============================================================================
// USER SERVICES
// ============================================================================

export const userService = {
  // Get all users
  getAll: async () => {
    try {
      const response = await api.get('/users/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  },

  // Get users with pagination
  getAllPaginated: async (page = 1, limit = 10, search = '') => {
    try {
      let url = `/users/all/paginate?page=${page}&limit=${limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  },

  // Get user by UUID
  getByUuid: async (uuid) => {
    try {
      const response = await api.get(`/users/get/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const response = await api.post('/users/create', userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update user
  update: async (uuid, userData) => {
    try {
      const response = await api.put(`/users/update/${uuid}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete user
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/users/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
};

// ============================================================================
// DASHBOARD SERVICES (Custom endpoints for dashboard data)
// ============================================================================

export const dashboardService = {
  // Get dashboard statistics (you'll need to create this endpoint in your Go backend)
  getStats: async () => {
    try {
      // For now, we'll aggregate data from existing endpoints
      const [countries, presents, sales] = await Promise.all([
        api.get('/countries/all'),
        api.get('/visites/all'),
        api.get('/sales/all')
      ]);

      return {
        total_countries: countries.data?.length || 0,
        total_presents: presents.data?.length || 0,
        total_sales: sales.data?.reduce((sum, sale) => sum + (sale.total_price || 0), 0) || 0,
        total_areas: 0 // You can add this endpoint later
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard stats: ${error.message}`);
    }
  },

  // Get recent activities (you'll need to create this endpoint in your Go backend)
  getRecentActivities: async (limit = 10) => {
    try {
      // For now, return recent presents as activities
      const response = await api.get(`/visites/all/paginate?page=1&limit=${limit}`);
      const presents = response.data;
      return presents?.map(present => ({
        id: present.uuid,
        title: `New Present: ${present.name}`,
        description: `Present added at ${present.location}`,
        user_name: present.user?.name || 'Unknown',
        created_at: present.created_at || present.CreatedAt,
        status: 'completed'
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch recent activities: ${error.message}`);
    }
  }
};

// ============================================================================
// USER LOGS SERVICES
// ============================================================================

export const userLogsService = {
  // Get all user logs with pagination
  getPaginated: async (params = {}) => {
    try {
      const { page = 1, limit = 15, search = '' } = params;
      const response = await api.get('/users-logs/all/paginate', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user logs: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get user logs by user UUID with pagination
  getByUserUUID: async (userUuid, params = {}) => {
    try {
      const { page = 1, limit = 15, search = '' } = params;
      const response = await api.get(`/users-logs/all/paginate/${userUuid}`, {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user logs: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get all user logs without pagination
  getAll: async () => {
    try {
      const response = await api.get('/users-logs/all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch all user logs: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get single user log by UUID
  getById: async (uuid) => {
    try {
      const response = await api.get(`/users-logs/get/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch user log: ${error.response?.data?.message || error.message}`);
    }
  },

  // Create new user log
  create: async (logData) => {
    try {
      const response = await api.post('/users-logs/create', logData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create user log: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update user log
  update: async (uuid, logData) => {
    try {
      const response = await api.put(`/users-logs/update/${uuid}`, logData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update user log: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete user log
  delete: async (uuid) => {
    try {
      const response = await api.delete(`/users-logs/delete/${uuid}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete user log: ${error.response?.data?.message || error.message}`);
    }
  }
};
