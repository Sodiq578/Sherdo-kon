import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    nomi: '',
    kodi: '',
    narx: '',
    soni: '',
    rasm: null,
    kerakli: false,
    bolim: '',
    id: null
  });
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState(['Ichimliklar', 'Shirinliklar', 'Meva va sabzavotlar', 'Go\'sht mahsulotlari']);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || categories;
    setProducts(storedProducts);
    setCategories(storedCategories);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nomi, kodi, narx, soni, id, bolim } = formData;
    
    if (!nomi || !kodi || !narx || !soni || !bolim) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring!');
      return;
    }
    
    const isDuplicateCode = products.some(
      p => p.kodi === kodi && (!isEditing || p.id !== id)
    );
    
    if (isDuplicateCode) {
      alert('Bu kod bilan boshqa mahsulot mavjud! Iltimos, boshqa kod kiriting.');
      return;
    }
    
    const newProduct = {
      id: id || Date.now().toString(),
      nomi,
      kodi,
      narx: parseInt(narx),
      soni: parseInt(soni),
      rasm: formData.rasm ? 
        (typeof formData.rasm === 'string' ? formData.rasm : URL.createObjectURL(formData.rasm)) : 
        null,
      kerakli: formData.kerakli,
      bolim,
      createdAt: id ? 
        products.find(p => p.id === id)?.createdAt || new Date().toISOString() : 
        new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedProducts;
    if (isEditing) {
      updatedProducts = products.map(p => p.id === id ? newProduct : p);
    } else {
      updatedProducts = [...products, newProduct];
    }

    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    alert(`${nomi} muvaffaqiyatli ${isEditing ? 'tahrirlandi' : 'qo\'shildi'}!`);
    
    resetForm();
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      setFormData({ ...formData, bolim: newCategory.trim() });
      setNewCategory('');
      setShowCategoryInput(false);
    } else if (categories.includes(newCategory.trim())) {
      alert('Bu bo\'lim allaqachon mavjud!');
    }
  };

  const editProduct = (product) => {
    setFormData({
      nomi: product.nomi,
      kodi: product.kodi,
      narx: product.narx,
      soni: product.soni,
      rasm: product.rasm,
      kerakli: product.kerakli,
      bolim: product.bolim,
      id: product.id
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (product) => {
    if (window.confirm(`Haqiqatan ham "${product.nomi}" mahsulotini o\'chirmoqchimisiz?\nBu amalni ortga qaytarib bo\'lmaydi!`)) {
      const updatedProducts = products.filter(p => p.id !== product.id);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      if (isEditing && formData.id === product.id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nomi: '',
      kodi: '',
      narx: '',
      soni: '',
      rasm: null,
      kerakli: false,
      bolim: '',
      id: null
    });
    setIsEditing(false);
  };

  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.bolim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="menu-header">
          <h2>Tovar qo'shish</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Mahsulotlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>
        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovar jadavali</button>
          <button onClick={() => navigate('/orders')}>Savdo statistikasi</button>
          <button className="active">Tovar qo'shish</button>
        </div>
        
        <div className="add-product-container">
          <form className="add-product-form" onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Tovarni tahrirlash' : 'Yangi tovar qo\'shish'}</h3>
            <div className="form-group">
              <label>Tovar nomi *</label>
              <input
                type="text"
                name="nomi"
                value={formData.nomi}
                onChange={handleChange}
                required
                placeholder="Masalan: Coca Cola"
              />
            </div>
            <div className="form-group">
              <label>Tovar kodi *</label>
              <input
                type="text"
                name="kodi"
                value={formData.kodi}
                onChange={handleChange}
                required
                placeholder="Masalan: CC001"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Narxi (UZS) *</label>
                <input
                  type="number"
                  name="narx"
                  value={formData.narx}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="Masalan: 10000"
                />
              </div>
              <div className="form-group">
                <label>Soni *</label>
                <input
                  type="number"
                  name="soni"
                  value={formData.soni}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="Masalan: 50"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Bo'lim *</label>
              <div className="category-select">
                <select
                  name="bolim"
                  value={formData.bolim}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bo'limni tanlang</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="add-category-btn"
                  onClick={() => setShowCategoryInput(!showCategoryInput)}
                >
                  {showCategoryInput ? 'Bekor qilish' : '+ Yangi bo\'lim'}
                </button>
              </div>
              {showCategoryInput && (
                <div className="new-category-input">
                  <input
                    type="text"
                    placeholder="Yangi bo'lim nomi kiriting"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="save-category-btn"
                    onClick={addCategory}
                    disabled={!newCategory.trim()}
                  >
                    Saqlash
                  </button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Rasm (ixtiyoriy)</label>
              <input
                type="file"
                name="rasm"
                accept="image/*"
                onChange={handleChange}
              />
              {formData.rasm && typeof formData.rasm === 'string' && (
                <div className="current-image">
                  <p>Joriy rasm:</p>
                  <img src={formData.rasm} alt="Current product" width="100" />
                </div>
              )}
            </div>
            <div className="form-checkbox">
              <input
                type="checkbox"
                name="kerakli"
                checked={formData.kerakli}
                onChange={handleChange}
                id="kerakli"
              />
              <label htmlFor="kerakli">
                Kerakli mahsulot {formData.kerakli && '(Do\'konda doim bo\'lishi kerak)'}
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {isEditing ? 'O\'zgarishlarni saqlash' : 'Tovar qo\'shish'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Bekor qilish
                </button>
              )}
            </div>
          </form>

          <div className="product-list">
            <h3>Mavjud mahsulotlar ({filteredProducts.length})</h3>
            {filteredProducts.length > 0 ? (
              <div className="product-items">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`product-item ${product.kerakli ? 'essential' : ''}`}
                  >
                    <div className="product-details">
                      {product.rasm && (
                        <img src={product.rasm} alt={product.nomi} className="product-thumbnail" />
                      )}
                      <div>
                        <h4>
                          {product.nomi} 
                          {product.kerakli && <span className="essential-badge">Kerakli</span>}
                        </h4>
                        <p>Kodi: {product.kodi}</p>
                        <p>Narxi: {product.narx.toLocaleString()} UZS</p>
                        <p>Soni: {product.soni}</p>
                        <p>Bo'lim: {product.bolim}</p>
                        <p className="date-info">
                          Qo'shilgan: {new Date(product.createdAt).toLocaleDateString()}
                          {product.createdAt !== product.updatedAt && (
                            <span>, Tahrirlangan: {new Date(product.updatedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="product-actions">
                      <button
                        onClick={() => editProduct(product)}
                        className="edit-btn"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        className="delete-btn"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>Mahsulotlar topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;