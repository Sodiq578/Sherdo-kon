import React, { useState, useEffect, useRef } from 'react';
import './AddProduct.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import Quagga from '@ericblade/quagga2';

const AddProduct = () => {
  // State declarations
  const [formData, setFormData] = useState({
    nomi: '',
    kodi: '',
    shtrix_kod: '',
    narx: '',
    soni: '',
    rasm: null,
    kerakli: false,
    bolim: '',
    id: null,
  });
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Constants
  const haftaKunlari = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const oylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Load data on component mount
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Enhance products with stock status
    const enhancedProducts = storedProducts.map(product => ({
      ...product,
      stockStatus: getStockStatus(product.soni)
    }));

    setProducts(enhancedProducts);
    setCategories(storedCategories);
    setUser(currentUser);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Barcode scanner effect
  useEffect(() => {
    if (showScanner) {
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment',
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
          readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'code_39_reader', 'upc_reader'],
        },
        locate: true,
      }, (err) => {
        if (err) {
          console.error('Quagga init error:', err);
          alert("Shtrix-kodni skanerlashda xatolik yuz berdi! Iltimos, kamera ruxsatlarini tekshiring.");
          setShowScanner(false);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        setFormData(prev => ({ ...prev, shtrix_kod: code }));
        setShowScanner(false);
        Quagga.stop();
      });

      return () => {
        Quagga.stop();
      };
    }
  }, [showScanner]);

  // Helper function to determine stock status
  const getStockStatus = (quantity) => {
    if (quantity <= 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  // Calculate registration time
  const calculateRegistrationTime = () => {
    if (!user || !user.createdAt) return "Ma'lumot mavjud emas";

    const regDate = new Date(user.createdAt);
    const diff = Date.now() - regDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} yil ${months % 12} oy`;
    if (months > 0) return `${months} oy ${days % 30} kun`;
    if (days > 0) return `${days} kun ${hours % 24} soat`;
    if (hours > 0) return `${hours} soat ${minutes % 60} daqiqa`;
    if (minutes > 0) return `${minutes} daqiqa ${seconds % 60} soniya`;
    return `${seconds} soniya`;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    });
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const { nomi, kodi, shtrix_kod, narx, soni, id, bolim } = formData;

    // Validation
    if (!nomi || !kodi || !narx || !soni || !bolim) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    if (isNaN(narx) || narx < 0 || isNaN(soni) || soni < 0) {
      alert("Narx va soni 0 yoki undan katta bo'lishi kerak!");
      return;
    }

    // Check for duplicate codes
    const isDuplicateCode = products.some(
      (p) => (p.kodi === kodi || (shtrix_kod && p.shtrix_kod === shtrix_kod)) && (!isEditing || p.id !== id)
    );

    if (isDuplicateCode) {
      alert("Bu kod yoki shtrix-kod bilan boshqa mahsulot mavjud! Iltimos, boshqa kod kiriting.");
      return;
    }

    // Create new product object
    const newProduct = {
      id: id || Date.now().toString(),
      nomi,
      kodi,
      shtrix_kod: shtrix_kod || null,
      narx: parseInt(narx),
      soni: parseInt(soni),
      stockStatus: getStockStatus(parseInt(soni)),
      rasm: formData.rasm
        ? typeof formData.rasm === 'string'
          ? formData.rasm
          : URL.createObjectURL(formData.rasm)
        : null,
      kerakli: formData.kerakli,
      bolim,
      createdAt: id ? products.find((p) => p.id === id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update products list
    let updatedProducts;
    if (isEditing) {
      updatedProducts = products.map((p) => (p.id === id ? newProduct : p));
    } else {
      updatedProducts = [...products, newProduct];
    }

    // Save to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    alert(`${nomi} muvaffaqiyatli ${isEditing ? "tahrirlandi" : "qo'shildi"}!`);

    // Reset form
    resetForm();
  };

  // Add new category
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      setFormData({ ...formData, bolim: newCategory.trim() });
      setNewCategory('');
      setShowCategoryInput(false);
    } else if (!newCategory.trim()) {
      alert("Iltimos, bo'lim nomini kiriting!");
    } else {
      alert("Bu bo'lim allaqachon mavjud!");
    }
  };

  // Edit product
  const editProduct = (product) => {
    setFormData({
      nomi: product.nomi,
      kodi: product.kodi,
      shtrix_kod: product.shtrix_kod || '',
      narx: product.narx,
      soni: product.soni,
      rasm: product.rasm,
      kerakli: product.kerakli,
      bolim: product.bolim,
      id: product.id,
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete product
  const deleteProduct = (product) => {
    if (window.confirm(`Haqiqatan ham "${product.nomi}" mahsulotini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!`)) {
      const updatedProducts = products.filter((p) => p.id !== product.id);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      if (isEditing && formData.id === product.id) {
        resetForm();
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nomi: '',
      kodi: '',
      shtrix_kod: '',
      narx: '',
      soni: '',
      rasm: null,
      kerakli: false,
      bolim: '',
      id: null,
    });
    setIsEditing(false);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.bolim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        {/* Time and User Info */}
        <div className="time-user-info">
          <div className="current-time">
            <span>{haftaKunlari[currentTime.getDay()]}, </span>
            <span>{currentTime.getDate()} {oylar[currentTime.getMonth()]} </span>
            <span>{currentTime.getFullYear()} yil, </span>
            <span>{currentTime.getHours().toString().padStart(2, '0')}:</span>
            <span>{currentTime.getMinutes().toString().padStart(2, '0')}:</span>
            <span>{currentTime.getSeconds().toString().padStart(2, '0')}</span>
          </div>
          {user && (
            <div className="user-info">
              <span className="username">{user.ism}</span>
              <span className="registration-time">Ro'yxatdan o'tgan: {calculateRegistrationTime()} oldin</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="menu-header">
          <h2>Tovar qo'shish</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Nomi, kodi, shtrix-kod yoki bo'lim bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovar jadvali</button>
          <button onClick={() => navigate('/orders')}>Savdo statistikasi</button>
          <button className="active">Tovar qo'shish</button>
          <button onClick={() => navigate('/cashier')}>Kassir</button>
        </div>

        {/* Main Content */}
        <div className={`add-product-container ${isEditing ? 'editing-mode' : ''}`}>
          {/* Product Form */}
          <form className={`add-product-form ${isEditing ? 'editing-form' : ''}`} onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Tovarni tahrirlash' : 'Yangi tovar qo\'shish'}</h3>

            {/* Product Name */}
            <div className="form-group">
              <label>Tovar nomi *</label>
              <input
                type="text"
                name="nomi"
                value={formData.nomi}
                onChange={handleChange}
                required
              />
            </div>

            {/* Product Code */}
            <div className="form-group">
              <label>Tovar kodi *</label>
              <input
                type="text"
                name="kodi"
                value={formData.kodi}
                onChange={handleChange}
                required
              />
            </div>

            {/* Barcode */}
            <div className="form-group">
              <label>Shtrix-kod (ixtiyoriy)</label>
              <div className="shtrix-kod-container">
                <input
                  type="text"
                  name="shtrix_kod"
                  value={formData.shtrix_kod}
                  onChange={handleChange}
                  placeholder="Shtrix-kodni kiriting yoki skanerlang"
                />
                <button
                  type="button"
                  className="scan-btn"
                  onClick={() => setShowScanner(true)}
                >
                  <i className="fas fa-barcode"></i> Skanerlash
                </button>
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="form-row">
              <div className="form-group">
                <label>Narxi (so'm) *</label>
                <input
                  type="number"
                  name="narx"
                  value={formData.narx}
                  onChange={handleChange}
                  min="0"
                  required
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
                />
              </div>
            </div>

            {/* Category */}
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
                    placeholder="Yangi bo'lim nomi"
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

            {/* Image */}
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

            {/* Essential Product Checkbox */}
            <div className="form-checkbox">
              <input
                type="checkbox"
                name="kerakli"
                checked={formData.kerakli}
                onChange={handleChange}
                id="kerakli"
              />
              <label htmlFor="kerakli">
                Kerakli mahsulot {formData.kerakli && "(Do'konda doim bo'lishi kerak)"}
              </label>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {isEditing ? "O'zgarishlarni saqlash" : "Tovar qo'shish"}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Bekor qilish
                </button>
              )}
            </div>
          </form>

          {/* Barcode Scanner Modal */}
          {showScanner && (
            <div className="scanner-modal">
              <div className="scanner-content">
                <h3>Shtrix-kodni skanerlash</h3>
                <div ref={videoRef} className="scanner-video"></div>
                <button
                  className="close-scanner-btn"
                  onClick={() => setShowScanner(false)}
                >
                  Yopish
                </button>
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="product-list">
            <h3>Mavjud mahsulotlar ({filteredProducts.length})</h3>
            {filteredProducts.length > 0 ? (
              <div className="product-items">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`product-item ${product.stockStatus} ${product.kerakli ? 'essential' : ''}`}
                  >
                    <div className="product-details">
                      {product.rasm && (
                        <img src={product.rasm} alt={product.nomi} className="product-thumbnail" />
                      )}
                      <div className="product-info">
                        <h4>
                          {product.nomi}
                          {product.kerakli && <span className="essential-badge">Kerakli</span>}
                        </h4>
                        <p>Kodi: {product.kodi}</p>
                        {product.shtrix_kod && <p>Shtrix-kod: {product.shtrix_kod}</p>}
                        <p>Narxi: {product.narx.toLocaleString()} so'm</p>
                        <p className="stock-info">
                          Soni: {product.soni} {product.stockStatus === 'out-of-stock' && '(Tugagan)'}
                          {product.stockStatus === 'low-stock' && '(Kam qolgan)'}
                        </p>
                        <p>Bo'lim: {product.bolim}</p>
                        <p className="date-info">
                          Qo'shilgan: {new Date(product.createdAt).toLocaleDateString('uz-UZ')}
                          {product.createdAt !== product.updatedAt && (
                            <span>, Tahrirlangan: {new Date(product.updatedAt).toLocaleDateString('uz-UZ')}</span>
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