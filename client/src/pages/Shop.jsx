import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';

const Shop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get('category');
  const activeSubcategory = queryParams.get('subcategory');
  const searchParam = queryParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync searchQuery when URL search parameter changes
  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [cats, subs] = await Promise.all([
          api.getCategories(),
          api.getSubcategories()
        ]);
        setCategories(cats);
        setSubcategories(subs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page, sort: sortBy, limit: 12 };
        if (activeCategory) params.category = activeCategory;
        if (activeSubcategory) params.subcategory = activeSubcategory;
        if (searchQuery) params.search = searchQuery;

        const res = await api.getProducts(params);
        setProducts(res.products || []);
        setTotalPages(res.pages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [activeCategory, activeSubcategory, searchQuery, sortBy, page]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeSubcategory, searchQuery, sortBy]);

  const handleCategoryClick = (categoryId, subcategoryId = null) => {
    let path = '/shop';
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (subcategoryId) params.set('subcategory', subcategoryId);
    if (params.toString()) path += `?${params.toString()}`;
    navigate(path);
  };

  const activeCategoryName = categories.find(c => c._id === activeCategory)?.name;
  const activeSubcategoryName = subcategories.find(s => s._id === activeSubcategory)?.name;
  const filteredSubs = activeCategory ? subcategories.filter(s => (s.category?._id || s.category) === activeCategory) : [];

  return (
    <div className="shop-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={14} />
            <Link to="/shop">Shop</Link>
            {activeCategoryName && (
              <>
                <ChevronRight size={14} />
                <Link to={`/shop?category=${activeCategory}`}>{activeCategoryName}</Link>
              </>
            )}
            {activeSubcategoryName && (
              <>
                <ChevronRight size={14} />
                <span>{activeSubcategoryName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="shop-header">
          <h1 className="shop-title">
            {activeSubcategoryName || activeCategoryName || 'All Products'}
          </h1>

          <div className="shop-controls">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sort-box">
              <SlidersHorizontal size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category & Subcategory Pills */}
        <div className="filter-section">
          <div className="category-pills">
            <button
              className={`category-pill ${!activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryClick(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`category-pill ${activeCategory === cat._id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat._id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredSubs.length > 0 && (
            <div className="subcategory-pills">
              <button
                className={`subcategory-pill ${!activeSubcategory ? 'active' : ''}`}
                onClick={() => handleCategoryClick(activeCategory)}
              >
                All {activeCategoryName}
              </button>
              {filteredSubs.map(sub => (
                <button
                  key={sub._id}
                  className={`subcategory-pill ${activeSubcategory === sub._id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(activeCategory, sub._id)}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
