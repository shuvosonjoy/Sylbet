const API_BASE = '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  return response.json();
};

const getHeaders = (token, isFormData = false) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const api = {
  // Auth
  login: async (credentials) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },

  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getProfile: async (token) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  verifyAdmin: async (token) => {
    const res = await fetch(`${API_BASE}/auth/admin/verify`, {
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  // Products
  getProducts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  getProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return handleResponse(res);
  },

  createProduct: async (formData, token) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(token, true),
      body: formData
    });
    return handleResponse(res);
  },

  updateProduct: async (id, formData, token) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(token, true),
      body: formData
    });
    return handleResponse(res);
  },

  deleteProduct: async (id, token) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse(res);
  },

  createCategory: async (data, token) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateCategory: async (id, data, token) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteCategory: async (id, token) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  // Subcategories
  getSubcategories: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/subcategories${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  createSubcategory: async (data, token) => {
    const res = await fetch(`${API_BASE}/subcategories`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateSubcategory: async (id, data, token) => {
    const res = await fetch(`${API_BASE}/subcategories/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteSubcategory: async (id, token) => {
    const res = await fetch(`${API_BASE}/subcategories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  // Orders
  createOrder: async (data, token) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getOrders: async (token) => {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  getMyOrders: async (token) => {
    const res = await fetch(`${API_BASE}/orders/my-orders`, {
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (id, status, token) => {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Wishlist
  getWishlist: async (token) => {
    const res = await fetch(`${API_BASE}/wishlist`, {
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  addToWishlist: async (productId, token) => {
    const res = await fetch(`${API_BASE}/wishlist/${productId}`, {
      method: 'POST',
      headers: getHeaders(token)
    });
    return handleResponse(res);
  },

  removeFromWishlist: async (productId, token) => {
    const res = await fetch(`${API_BASE}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    });
    return handleResponse(res);
  }
};
