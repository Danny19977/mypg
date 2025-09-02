import { useState, useEffect } from 'react';
import { 
  territoryService, 
  authService,      // Added auth service
  salesService, 
  deliService,      // Updated from daliService
  dashboardService,
  userService,      // Added user service
  visiteService     // Added visite service
} from '../services/apiServices';

// ============================================================================
// GENERIC API HOOK
// ============================================================================

// This is a reusable hook for any API call
export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

// ============================================================================
// VISITE HOOKS (Store Visits)
// ============================================================================

// Hook for creating/updating visites
export const useVisiteActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createVisite = async (visiteData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await visiteService.create(visiteData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVisite = async (uuid, visiteData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await visiteService.update(uuid, visiteData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVisite = async (uuid) => {
    try {
      setLoading(true);
      setError(null);
      const result = await visiteService.delete(uuid);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createVisite, updateVisite, deleteVisite, loading, error };
};

// ============================================================================
// ============================================================================
// TERRITORY HOOKS
// ============================================================================

export const useCountries = () => {
  return useApi(territoryService.countries.getAll);
};

export const useProvinces = () => {
  return useApi(territoryService.provinces.getAll);
};

export const useProvincesByCountry = (countryUuid) => {
  return useApi(() => territoryService.provinces.getAllPaginated(1, 100), [countryUuid]);
};

export const useAreas = () => {
  return useApi(territoryService.areas.getAll);
};

export const useAreasByProvince = (provinceUuid) => {
  return useApi(() => territoryService.areas.getByProvinceUuid(provinceUuid), [provinceUuid]);
};

// Territory actions hook
export const useTerritoryActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCountry = async (countryData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.countries.create(countryData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProvince = async (provinceData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.provinces.create(provinceData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createArea = async (areaData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await territoryService.areas.create(areaData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createCountry, createProvince, createArea, loading, error };
};

// ============================================================================
// ACTIVITY HOOKS - Replaced with DELI hooks
// ============================================================================

export const useDelis = () => {
  return useApi(deliService.getAll);
};

export const useDelisByArea = (areaUuid) => {
  return useApi(() => deliService.getByArea(areaUuid), [areaUuid]);
};

export const useDelisByProvince = (provinceUuid) => {
  return useApi(() => deliService.getByProvince(provinceUuid), [provinceUuid]);
};

export const useDelisByCountry = (countryUuid) => {
  return useApi(() => deliService.getByCountry(countryUuid), [countryUuid]);
};

// ============================================================================
// SALES HOOKS
// ============================================================================

export const useSales = () => {
  return useApi(salesService.getAll);
};

export const useSalesByArea = (areaUuid) => {
  return useApi(() => salesService.getByArea(areaUuid), [areaUuid]);
};

export const useSalesByProvince = (provinceUuid) => {
  return useApi(() => salesService.getByProvince(provinceUuid), [provinceUuid]);
};

export const useSalesByCountry = (countryUuid) => {
  return useApi(() => salesService.getByCountry(countryUuid), [countryUuid]);
};

// Sales actions hook
export const useSalesActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSale = async (saleData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await salesService.create(saleData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createSale, loading, error };
};

// ============================================================================
// DELI HOOKS (Updated from DALI hooks)
// ============================================================================

export const useDeli = () => {
  return useApi(deliService.getAll);
};

export const useDeliById = (uuid) => {
  return useApi(() => deliService.getByUuid(uuid), [uuid]);
};

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.login(credentials);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.logout();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout, loading, error };
};

export const useAuthUser = () => {
  return useApi(authService.getAuthUser);
};

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export const useDashboardStats = () => {
  return useApi(dashboardService.getStats);
};

export const useRecentActivities = (limit = 10) => {
  return useApi(() => dashboardService.getRecentActivities(limit), [limit]);
};
