import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Edit, Trash2, X, Home, Package, Layers, FolderTree, ShoppingBag } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('products');
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '', price: '', discountPrice: '', description: '',
    category: '', subcategory: '', stock: '', featured: false, bestSelling: false, image: null,
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: null });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', category: '', image: null });

  useEffect(() => {
    fetchData();
    if (activeTab === 'products' || activeTab === 'subcategories') {
      fetchCategories();
    }
    if (activeTab === 'products') {
      fetchSubcategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await api.getSubcategories();
      setSubcategories(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let res = [];
      if (activeTab === 'products') {
        const result = await api.getProducts({ limit: 100 });
        res = result.products || result || [];
      } else if (activeTab === 'categories') {
        res = await api.getCategories();
      } else if (activeTab === 'subcategories') {
        res = await api.getSubcategories();
      } else if (activeTab === 'orders') {
        res = await api.getOrders(token);
      }
      setData(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredSubcategories = productForm.category
    ? subcategories.filter(s => (s.category?._id || s.category) === productForm.category)
    : [];

  // Modal
  const openModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);

    if (activeTab === 'products') {
      if (mode === 'edit' && item) {
        setProductForm({
          name: item.name || '', price: item.price || '', discountPrice: item.discountPrice || '',
          description: item.description || '', category: item.category?._id || '',
          subcategory: item.subcategory?._id || '', stock: item.stock || 0,
          featured: item.featured || false, bestSelling: item.bestSelling || false, image: null,
        });
      } else {
        setProductForm({
          name: '', price: '', discountPrice: '', description: '',
          category: categories[0]?._id || '', subcategory: '', stock: 0,
          featured: false, bestSelling: false, image: null,
        });
      }
    }

    if (activeTab === 'categories') {
      if (mode === 'edit' && item) {
        setCategoryForm({ name: item.name || '', description: item.description || '', image: null });
      } else {
        setCategoryForm({ name: '', description: '', image: null });
      }
    }

    if (activeTab === 'subcategories') {
      if (mode === 'edit' && item) {
        setSubcategoryForm({
          name: item.name || '', description: item.description || '',
          category: item.category?._id || item.category || '', image: null,
        });
      } else {
        setSubcategoryForm({ name: '', description: '', category: categories[0]?._id || '', image: null });
      }
    }

    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Product Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('price', productForm.price);
    if (productForm.discountPrice) formData.append('discountPrice', productForm.discountPrice);
    formData.append('description', productForm.description);
    formData.append('category', productForm.category);
    if (productForm.subcategory) formData.append('subcategory', productForm.subcategory);
    formData.append('stock', productForm.stock);
    formData.append('featured', productForm.featured);
    formData.append('bestSelling', productForm.bestSelling);
    if (productForm.image) formData.append('image', productForm.image);

    try {
      if (modalMode === 'add') {
        await api.createProduct(formData, token);
        showToast.success('Product created!');
      } else {
        await api.updateProduct(currentItem._id, formData, token);
        showToast.success('Product updated!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error saving product');
    }
  };

  // Category Submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', categoryForm.name);
      formData.append('description', categoryForm.description);
      if (categoryForm.image) {
        formData.append('image', categoryForm.image);
      }

      if (modalMode === 'add') {
        await api.createCategory(formData, token);
        showToast.success('Category created!');
      } else {
        await api.updateCategory(currentItem._id, formData, token);
        showToast.success('Category updated!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error saving category');
    }
  };

  // Subcategory Submit
  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', subcategoryForm.name);
      formData.append('description', subcategoryForm.description);
      formData.append('category', subcategoryForm.category);
      if (subcategoryForm.image) {
        formData.append('image', subcategoryForm.image);
      }

      if (modalMode === 'add') {
        await api.createSubcategory(formData, token);
        showToast.success('Subcategory created!');
      } else {
        await api.updateSubcategory(currentItem._id, formData, token);
        showToast.success('Subcategory updated!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error saving subcategory');
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'products') await api.deleteProduct(id, token);
      else if (activeTab === 'categories') await api.deleteCategory(id, token);
      else if (activeTab === 'subcategories') await api.deleteSubcategory(id, token);
      showToast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error deleting item');
    }
  };

  // Order Status
  const handleOrderStatusUpdate = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status, token);
      showToast.success('Status updated');
      fetchData();
    } catch (error) {
      showToast.error('Error updating status');
    }
  };

  // Render Content
  const renderContent = () => {
    if (loading) return <div className="spinner"></div>;

    // PRODUCTS
    if (activeTab === 'products') {
      return (
        <div>
          <div className="admin-header">
            <h2>Products Management</h2>
            <button className="btn btn-primary" onClick={() => openModal('add')}><Plus size={16} /> Add Product</button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data) && data.map(item => (
                  <tr key={item._id}>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (<span className="text-muted">No Img</span>)}
                    </td>
                    <td className="font-medium">{item.name || 'N/A'}</td>
                    <td>
                      <div>{item.category?.name || 'N/A'}</div>
                      {item.subcategory?.name && <div className="text-sm text-muted">{item.subcategory.name}</div>}
                    </td>
                    <td>৳{Number(item.price || 0).toLocaleString()}</td>
                    <td>{item.discountPrice ? <span style={{ color: 'var(--color-danger)' }}>৳{Number(item.discountPrice).toLocaleString()}</span> : '—'}</td>
                    <td>
                      <span className={`stock-indicator ${item.stock <= 0 ? 'stock-out' : item.stock <= 5 ? 'stock-low' : 'stock-in'}`}>
                        {item.stock || 0}
                      </span>
                    </td>
                    <td>{item.featured ? '⭐' : '—'} {item.bestSelling ? '🔥' : ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openModal('edit', item)} className="admin-action-btn edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(item._id)} className="admin-action-btn delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // CATEGORIES
    if (activeTab === 'categories') {
      return (
        <div>
          <div className="admin-header">
            <h2>Categories Management</h2>
            <button className="btn btn-primary" onClick={() => openModal('add')}><Plus size={16} /> Add Category</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {Array.isArray(data) && data.map(item => (
                <tr key={item._id}>
                  <td className="font-medium">{item.name || 'N/A'}</td>
                  <td>{item.description || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openModal('edit', item)} className="admin-action-btn edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item._id)} className="admin-action-btn delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // SUBCATEGORIES
    if (activeTab === 'subcategories') {
      return (
        <div>
          <div className="admin-header">
            <h2>Subcategories Management</h2>
            <button className="btn btn-primary" onClick={() => openModal('add')}><Plus size={16} /> Add Subcategory</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Category</th><th>Description</th><th>Actions</th></tr></thead>
            <tbody>
              {Array.isArray(data) && data.map(item => (
                <tr key={item._id}>
                  <td className="font-medium">{item.name || 'N/A'}</td>
                  <td>{item.category?.name || 'N/A'}</td>
                  <td>{item.description || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openModal('edit', item)} className="admin-action-btn edit"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item._id)} className="admin-action-btn delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ORDERS
    if (activeTab === 'orders') {
      return (
        <div>
          <div className="admin-header"><h2>Orders Management</h2></div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>bKash TxID</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data) && data.map(item => (
                  <tr key={item._id}>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="font-medium">{item.customerName || 'N/A'}</div>
                      <div className="text-sm text-muted">{item.phone || 'N/A'}</div>
                      {item.email && <div className="text-sm text-muted">{item.email}</div>}
                    </td>
                    <td>
                      {item.items?.map((it, idx) => (
                        <div key={idx} className="text-sm">{it.name} x{it.quantity}</div>
                      ))}
                    </td>
                    <td className="font-medium">৳{Number(item.totalAmount || 0).toLocaleString()}</td>
                    <td>{item.bkashTransactionId || 'N/A'}</td>
                    <td><span className={`status-badge status-${item.status}`}>{item.status || 'Pending'}</span></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '4px 8px', width: 'auto', fontSize: '0.875rem' }}
                        value={item.status || 'Pending'}
                        onChange={(e) => handleOrderStatusUpdate(item._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  // Modal Form
  const renderModalForm = () => {
    if (activeTab === 'products') {
      return (
        <form onSubmit={handleProductSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Price (৳)</label>
              <input type="number" className="form-control" value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Price (৳)</label>
              <input type="number" className="form-control" value={productForm.discountPrice}
                onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                placeholder="Leave empty for no discount" />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Stock</label>
              <input type="number" className="form-control" value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: '' })} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {filteredSubcategories.length > 0 && (
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select className="form-control" value={productForm.subcategory}
                onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}>
                <option value="">None</option>
                {filteredSubcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Product Image</label>
            <input type="file" className="form-control" accept="image/*"
              onChange={(e) => setProductForm({ ...productForm, image: e.target.files?.[0] || null })} />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={productForm.featured}
                onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} />
              Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={productForm.bestSelling}
                onChange={(e) => setProductForm({ ...productForm, bestSelling: e.target.checked })} />
              Best Selling
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block">Save Product</button>
        </form>
      );
    }

    if (activeTab === 'categories') {
      return (
        <form onSubmit={handleCategorySubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Thumbnail Image</label>
            <input type="file" className="form-control" accept="image/*"
              onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.files?.[0] || null })} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Category</button>
        </form>
      );
    }

    if (activeTab === 'subcategories') {
      return (
        <form onSubmit={handleSubcategorySubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={subcategoryForm.name}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Parent Category</label>
            <select className="form-control" value={subcategoryForm.category}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category: e.target.value })} required>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" value={subcategoryForm.description}
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Thumbnail Image</label>
            <input type="file" className="form-control" accept="image/*"
              onChange={(e) => setSubcategoryForm({ ...subcategoryForm, image: e.target.files?.[0] || null })} />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Subcategory</button>
        </form>
      );
    }
  };

  const getModalTitle = () => {
    const action = modalMode === 'add' ? 'Add' : 'Edit';
    if (activeTab === 'products') return `${action} Product`;
    if (activeTab === 'categories') return `${action} Category`;
    if (activeTab === 'subcategories') return `${action} Subcategory`;
    return '';
  };

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'subcategories', label: 'Subcategories', icon: FolderTree },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Sylbets Admin</h2>
        <button onClick={() => navigate('/')} className="admin-nav-item" style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          <Home size={16} /> Back to Store
        </button>

        <div className="admin-nav">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} /> {tab.label}
            </div>
          ))}
        </div>

        <button onClick={handleLogout} className="admin-nav-item" style={{ marginTop: 'auto', color: '#ffcdd2' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Main */}
      <div className="admin-content">{renderContent()}</div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getModalTitle()}</h2>
              <button onClick={closeModal}><X size={24} /></button>
            </div>
            {renderModalForm()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;