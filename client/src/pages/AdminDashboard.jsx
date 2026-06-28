import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Edit, Trash2, X, Home, Package, Layers, FolderTree, ShoppingBag, MessageSquare, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import VariantBuilder from '../components/VariantBuilder';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('products');
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);

  // Form States
  const [productForm, setProductForm] = useState({
    name: '', price: '', discountPrice: '', description: '',
    category: '', subcategory: '', stock: '', deliveryCharge: '',
    featured: false, bestSelling: false, images: [], existingImages: [],
    productType: 'simple', variantOptions: [], variants: [],
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: null });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '', category: '', image: null });
  const [reviewForm, setReviewForm] = useState({
    customerName: '', location: '', text: '', rating: 5, images: [],
    existingImages: [], product: '', reviewDate: '', status: 'published',
    featured: false
  });

  useEffect(() => {
    fetchData();
    if (activeTab === 'products' || activeTab === 'subcategories') {
      fetchCategories();
    }
    if (activeTab === 'products' || activeTab === 'reviews') {
      fetchSubcategories();
    }
    if (activeTab === 'reviews') {
      fetchAllProducts();
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

  const fetchAllProducts = async () => {
    try {
      const result = await api.getProducts({ limit: 200 });
      setAllProducts(result.products || []);
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
      } else if (activeTab === 'reviews') {
        res = await api.getAdminReviews(token);
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
          deliveryCharge: item.deliveryCharge != null ? item.deliveryCharge : '',
          featured: item.featured || false, bestSelling: item.bestSelling || false, images: [], existingImages: item.images || (item.image ? [item.image] : []),
          productType: item.productType || 'simple',
          variantOptions: item.variantOptions || [],
          variants: item.variants || [],
        });
      } else {
        setProductForm({
          name: '', price: '', discountPrice: '', description: '',
          category: categories[0]?._id || '', subcategory: '', stock: 0,
          deliveryCharge: '',
          featured: false, bestSelling: false, images: [], existingImages: [],
          productType: 'simple', variantOptions: [], variants: [],
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

    if (activeTab === 'reviews') {
      if (mode === 'edit' && item) {
        setReviewForm({
          customerName: item.customerName || '',
          location: item.location || '',
          text: item.text || '',
          rating: item.rating || 5,
          images: [],
          existingImages: item.images || [],
          product: item.product?._id || item.product || '',
          reviewDate: item.reviewDate ? item.reviewDate.split('T')[0] : '',
          status: item.status || 'published',
          featured: item.featured || false,
        });
      } else {
        setReviewForm({
          customerName: '', location: '', text: '', rating: 5, images: [],
          existingImages: [], product: '', reviewDate: '', status: 'published',
          featured: false
        });
      }
    }

    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Product Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    // Client-side guard mirroring the server validator. Required on create,
    // optional on edit (empty string means "leave existing value").
    const dc = productForm.deliveryCharge;
    if (modalMode === 'add' && (dc === '' || dc === null || dc === undefined)) {
      showToast.error('Delivery charge is required');
      return;
    }
    if (dc !== '' && dc !== null && dc !== undefined) {
      const parsed = Number(dc);
      if (Number.isNaN(parsed) || parsed < 0) {
        showToast.error('Delivery charge must be a non-negative number');
        return;
      }
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('price', productForm.price);
    if (productForm.discountPrice) formData.append('discountPrice', productForm.discountPrice);
    formData.append('description', productForm.description);
    formData.append('category', productForm.category);
    if (productForm.subcategory) formData.append('subcategory', productForm.subcategory);
    formData.append('stock', productForm.stock);
    if (dc !== '' && dc !== null && dc !== undefined) {
      formData.append('deliveryCharge', dc);
    }
    formData.append('featured', productForm.featured);
    formData.append('bestSelling', productForm.bestSelling);
    formData.append('productType', productForm.productType);

    if (productForm.productType === 'variable') {
      formData.append('variantOptions', JSON.stringify(productForm.variantOptions));
      const cleanedVariants = productForm.variants.map(v => ({
        ...v,
        price: Number(v.price) || 0,
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        stock: Number(v.stock) || 0,
        deliveryCharge: v.deliveryCharge !== '' && v.deliveryCharge != null ? Number(v.deliveryCharge) : null,
      }));
      formData.append('variants', JSON.stringify(cleanedVariants));
    }
    
    if (modalMode === 'edit') {
      formData.append('existingImages', JSON.stringify(productForm.existingImages));
    }

    if (productForm.images && productForm.images.length > 0) {
      productForm.images.forEach(img => {
        formData.append('images', img);
      });
    }

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

      console.log('Subcategory form data:', {
        name: subcategoryForm.name,
        description: subcategoryForm.description,
        category: subcategoryForm.category,
        hasImage: !!subcategoryForm.image,
        imageType: subcategoryForm.image?.constructor?.name,
        imageSize: subcategoryForm.image?.size
      });

      if (subcategoryForm.image) {
        formData.append('image', subcategoryForm.image);
        console.log('Image appended to FormData');
      } else {
        console.log('NO IMAGE - subcategoryForm.image is:', subcategoryForm.image);
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
      fetchSubcategories();
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
      else if (activeTab === 'reviews') await api.deleteReview(id, token);
      showToast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error deleting item');
    }
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('customerName', reviewForm.customerName);
    formData.append('location', reviewForm.location);
    formData.append('text', reviewForm.text);
    formData.append('rating', reviewForm.rating);
    formData.append('status', reviewForm.status);
    formData.append('featured', reviewForm.featured);
    if (reviewForm.product) formData.append('product', reviewForm.product);
    if (reviewForm.reviewDate) formData.append('reviewDate', reviewForm.reviewDate);

    if (modalMode === 'edit') {
      formData.append('existingImages', JSON.stringify(reviewForm.existingImages));
    }

    if (reviewForm.images && reviewForm.images.length > 0) {
      reviewForm.images.forEach(img => formData.append('images', img));
    }

    try {
      if (modalMode === 'add') {
        await api.createReview(formData, token);
        showToast.success('Review created!');
      } else {
        await api.updateReview(currentItem._id, formData, token);
        showToast.success('Review updated!');
      }
      closeModal();
      fetchData();
    } catch (error) {
      showToast.error(error.message || 'Error saving review');
    }
  };

  // Review Reorder
  const handleReviewMove = async (index, direction) => {
    const items = [...data];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const tempOrder = items[index].sortOrder;
    items[index].sortOrder = items[swapIndex].sortOrder;
    items[swapIndex].sortOrder = tempOrder;

    try {
      await api.reorderReviews([
        { id: items[index]._id, sortOrder: items[index].sortOrder },
        { id: items[swapIndex]._id, sortOrder: items[swapIndex].sortOrder }
      ], token);
      fetchData();
    } catch (error) {
      showToast.error('Error reordering reviews');
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
                  <th>Delivery</th>
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
                    <td>৳{Number(item.deliveryCharge || 0).toLocaleString()}</td>
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
                  <th>Date</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Delivery</th><th>Total</th><th>bKash TxID</th><th>Status</th><th>Actions</th>
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
                        <div key={idx} className="text-sm">
                          {it.name} x{it.quantity}
                          {it.variantOptions && (
                            <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>
                              {Object.entries(typeof it.variantOptions === 'object' && it.variantOptions !== null ? it.variantOptions : {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>৳{Number(item.subtotal || 0).toLocaleString()}</td>
                    <td>৳{Number(item.deliveryChargeTotal || 0).toLocaleString()}</td>
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

    // REVIEWS
    if (activeTab === 'reviews') {
      return (
        <div>
          <div className="admin-header">
            <h2>Reviews Management</h2>
            <button className="btn btn-primary" onClick={() => openModal('add')}><Plus size={16} /> Add Review</button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(data) && data.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          className="admin-action-btn edit"
                          onClick={() => handleReviewMove(index, -1)}
                          disabled={index === 0}
                          style={{ padding: '2px' }}
                        ><ChevronUp size={14} /></button>
                        <button
                          className="admin-action-btn edit"
                          onClick={() => handleReviewMove(index, 1)}
                          disabled={index === data.length - 1}
                          style={{ padding: '2px' }}
                        ><ChevronDown size={14} /></button>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{item.customerName}</div>
                      {item.location && <div className="text-sm text-muted">{item.location}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '1px', color: 'var(--color-accent)' }}>
                        {Array.from({ length: item.rating || 0 }).map((_, j) => (
                          <Star key={j} size={14} fill="currentColor" />
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.text}
                      </div>
                      {item.product?.name && <div className="text-sm text-muted">Product: {item.product.name}</div>}
                    </td>
                    <td>
                      {item.images?.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {item.images.slice(0, 3).map((img, idx) => (
                            <img key={idx} src={img} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                          ))}
                          {item.images.length > 3 && <span className="text-sm text-muted">+{item.images.length - 3}</span>}
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`status-badge status-${item.status === 'published' ? 'Delivered' : item.status === 'draft' ? 'Pending' : 'Cancelled'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.featured ? '⭐' : '—'}</td>
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

          <div className="form-group">
            <label className="form-label">Product Type</label>
            <div className="product-type-toggle">
              <button type="button"
                className={`product-type-btn ${productForm.productType === 'simple' ? 'active' : ''}`}
                onClick={() => setProductForm({ ...productForm, productType: 'simple' })}>
                Simple Product
              </button>
              <button type="button"
                className={`product-type-btn ${productForm.productType === 'variable' ? 'active' : ''}`}
                onClick={() => setProductForm({ ...productForm, productType: 'variable' })}>
                Variable Product
              </button>
            </div>
          </div>

          {productForm.productType === 'simple' && (
            <>
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
                  <label className="form-label">Delivery Charge (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={productForm.deliveryCharge}
                    onChange={(e) => setProductForm({ ...productForm, deliveryCharge: e.target.value })}
                    placeholder="e.g. 60 (use 0 for free delivery)"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {productForm.productType === 'variable' && (
            <>
              <div className="form-group">
                <label className="form-label">Default Delivery Charge (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={productForm.deliveryCharge}
                  onChange={(e) => setProductForm({ ...productForm, deliveryCharge: e.target.value })}
                  placeholder="Inherited by variants without their own charge"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (৳)</label>
                <input type="number" className="form-control" value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="Fallback price" required />
              </div>
              <VariantBuilder
                variantOptions={productForm.variantOptions}
                variants={productForm.variants}
                onChange={({ variantOptions, variants }) =>
                  setProductForm({ ...productForm, variantOptions, variants })
                }
                productName={productForm.name}
                token={token}
              />
            </>
          )}

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: '' })} required>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
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
            <textarea
              className="form-control"
              rows={12}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder={`Use bracketed markers to add structured sections (optional):\n\n[FEATURES]\nPremium Burma Cane\nHandmade Construction\n\n[DESCRIPTION]\nBeautiful handcrafted cane chair...\n\n[MATERIALS]\nBurma Cane\nFoam Cushion\n\n[DIMENSIONS]\nSeat Height: 16-18 inches\n\n[DELIVERY]\nEstimated Delivery: 5-6 Days\n\n[NOTES]\nCustomization available.`}
              required
            />
            <small className="text-muted" style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem' }}>
              Tip: wrap content with <code>[FEATURES]</code>, <code>[DESCRIPTION]</code>, <code>[MATERIALS]</code>, <code>[DIMENSIONS]</code>, <code>[DELIVERY]</code>, <code>[NOTES]</code> on their own lines. Plain text without markers still works.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Product Images (Max 4)</label>
            <input type="file" className="form-control" accept="image/*" multiple
              onChange={(e) => {
                const files = Array.from(e.target.files).slice(0, 4); // Max 4 new images
                setProductForm({ ...productForm, images: files });
              }} />
            
            {modalMode === 'edit' && productForm.existingImages?.length > 0 && (
              <div className="existing-images-preview mt-2" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {productForm.existingImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={img} alt={`Preview ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                    <button type="button" 
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        const newExisting = [...productForm.existingImages];
                        newExisting.splice(idx, 1);
                        setProductForm({ ...productForm, existingImages: newExisting });
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
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

    if (activeTab === 'reviews') {
      return (
        <form onSubmit={handleReviewSubmit}>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input type="text" className="form-control" value={reviewForm.customerName}
                onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input type="text" className="form-control" value={reviewForm.location}
                onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                placeholder="e.g. Dhaka, Sylhet" />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Rating *</label>
              <select className="form-control" value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={reviewForm.status}
                onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Review Text *</label>
            <textarea className="form-control" rows={4} value={reviewForm.text}
              onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
              placeholder="Customer review text..." required />
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Product Reference</label>
              <select className="form-control" value={reviewForm.product}
                onChange={(e) => setReviewForm({ ...reviewForm, product: e.target.value })}>
                <option value="">None</option>
                {allProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Review Date</label>
              <input type="date" className="form-control" value={reviewForm.reviewDate}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Review Images (Max 5)</label>
            <input type="file" className="form-control" accept="image/*" multiple
              onChange={(e) => {
                const files = Array.from(e.target.files).slice(0, 5);
                setReviewForm({ ...reviewForm, images: files });
              }} />

            {modalMode === 'edit' && reviewForm.existingImages?.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {reviewForm.existingImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={img} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                    <button type="button"
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--color-danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        const updated = [...reviewForm.existingImages];
                        updated.splice(idx, 1);
                        setReviewForm({ ...reviewForm, existingImages: updated });
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={reviewForm.featured}
                onChange={(e) => setReviewForm({ ...reviewForm, featured: e.target.checked })} />
              Featured Review
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block">Save Review</button>
        </form>
      );
    }
  };

  const getModalTitle = () => {
    const action = modalMode === 'add' ? 'Add' : 'Edit';
    if (activeTab === 'products') return `${action} Product`;
    if (activeTab === 'categories') return `${action} Category`;
    if (activeTab === 'subcategories') return `${action} Subcategory`;
    if (activeTab === 'reviews') return `${action} Review`;
    return '';
  };

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'subcategories', label: 'Subcategories', icon: FolderTree },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
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