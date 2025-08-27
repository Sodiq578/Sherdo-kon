import React, { useState, useEffect, useRef } from 'react';
import './AddProduct.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import Quagga from '@ericblade/quagga2';
import Select from 'react-select';

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
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [user, setUser] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const productListRef = useRef(null);

  // Constants
  const haftaKunlari = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const oylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Load data on component mount
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const enhancedProducts = storedProducts.map(product => ({
      ...product,
      stockStatus: getStockStatus(product.soni),
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
      setScannerLoading(true);
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
          setScannerLoading(false);
          return;
        }
        Quagga.start();
        setScannerLoading(false);
      });

      Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        setFormData(prev => ({ ...prev, shtrix_kod: code }));
        setShowScanner(false);
        Quagga.stop();
      });

      return () => {
        Quagga.stop();
        setScannerLoading(false);
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
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      setFormData({
        ...formData,
        [name]: file,
      });
      
      // Create a preview for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const { nomi, kodi, shtrix_kod, narx, soni, bolim, id } = formData;

    if (!nomi || !kodi || !narx || !soni || !bolim) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    if (isNaN(narx) || narx < 0 || isNaN(soni) || soni < 0) {
      alert("Narx va soni 0 yoki undan katta bo'lishi kerak!");
      return;
    }

    const isDuplicateCode = products.some(
      (p) => (p.kodi === kodi || (shtrix_kod && p.shtrix_kod === shtrix_kod)) && (!isEditing || p.id !== id)
    );

    if (isDuplicateCode) {
      alert("Bu kod yoki shtrix-kod bilan boshqa mahsulot mavjud! Iltimos, boshqa kod kiriting.");
      return;
    }

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

    let updatedProducts;
    if (isEditing) {
      updatedProducts = products.map((p) => (p.id === id ? newProduct : p));
    } else {
      updatedProducts = [...products, newProduct];
    }

    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    alert(`${nomi} muvaffaqiyatli ${isEditing ? "tahrirlandi" : "qo'shildi"}!`);

    resetForm();
    
    if (productListRef.current) {
      productListRef.current.scrollTop = 0;
    }
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

  // Edit category
  const editCategory = () => {
    if (editingCategoryIndex === null || !editedCategoryName.trim()) return;

    const oldCategory = categories[editingCategoryIndex];
    const updatedCategories = [...categories];
    updatedCategories[editingCategoryIndex] = editedCategoryName.trim();

    const updatedProducts = products.map(product => {
      if (product.bolim === oldCategory) {
        return { ...product, bolim: editedCategoryName.trim() };
      }
      return product;
    });

    setCategories(updatedCategories);
    setProducts(updatedProducts);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    if (formData.bolim === oldCategory) {
      setFormData({ ...formData, bolim: editedCategoryName.trim() });
    }

    setEditingCategoryIndex(null);
    setEditedCategoryName('');
    setShowEditCategory(false);
  };

  // Delete category
  const handleDeleteCategory = (index) => {
    const categoryToDelete = categories[index];
    const productsWithCategory = products.filter(p => p.bolim === categoryToDelete);

    if (productsWithCategory.length > 0) {
      alert(`Ushbu bo'limdan ${productsWithCategory.length} ta mahsulot mavjud. Avval ularni o'chiring yoki boshqa bo'limga o'tkazing!`);
      return;
    }

    if (window.confirm(`Haqiqatan ham "${categoryToDelete}" bo'limini o'chirmoqchimisiz?`)) {
      const updatedCategories = categories.filter((_, i) => i !== index);
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));

      if (formData.bolim === categoryToDelete) {
        setFormData({ ...formData, bolim: '' });
      }
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
    
    // Set image preview if product has an image
    if (product.rasm) {
      setImagePreview(product.rasm);
    } else {
      setImagePreview(null);
    }
    
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
    setImagePreview(null);
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
              <span className="registration-time">Ro'yxatdan o'tgan: {calculateRegistrationTime()}</span>
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
              aria-label="Mahsulot qidirish"
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs">
          <button onClick={() => navigate('/menu')} aria-label="Tovar jadvaliga o'tish">Tovar jadvali</button>
          <button onClick={() => navigate('/stats')} aria-label="Savdo statistikasiga o'tish">Savdo statistikasi</button>
          <button className="active" aria-label="Tovar qo'shish sahifasi">Tovar qo'shish</button>
          <button onClick={() => navigate('/cashier')} aria-label="Kassir sahifasiga o'tish">Kassir</button>
        </div>

        {/* Main Content */}
        <div className="add-product-container">
          {/* Product Form */}
          <form className={`add-product-form ${isEditing ? 'editing-form' : ''}`} onSubmit={handleSubmit}>
            <h3>{isEditing ? 'Tovarni tahrirlash' : 'Yangi tovar qo\'shish'}</h3>

            {/* Product Name */}
            <div className="form-group">
              <label htmlFor="nomi">Tovar nomi *</label>
              <input
                id="nomi"
                type="text"
                name="nomi"
                value={formData.nomi}
                onChange={handleChange}
                required
                aria-required="true"
              />
            </div>

            {/* Product Code */}
            <div className="form-group">
              <label htmlFor="kodi">Tovar kodi *</label>
              <input
                id="kodi"
                type="text"
                name="kodi"
                value={formData.kodi}
                onChange={handleChange}
                required
                aria-required="true"
              />
            </div>

            {/* Barcode */}
            <div className="form-group">
              <label htmlFor="shtrix_kod">Shtrix-kod (ixtiyoriy)</label>
              <div className="shtrix-kod-container">
                <input
                  id="shtrix_kod"
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
                  aria-label="Shtrix-kodni skanerlash"
                  disabled={scannerLoading}
                >
                  <i className="fas fa-barcode"></i> {scannerLoading ? 'Yuklanmoqda...' : 'Skanerlash'}
                </button>
              </div>
            </div>

            {/* Price and Quantity */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="narx">Narxi (so'm) *</label>
                <input
                  id="narx"
                  type="number"
                  name="narx"
                  value={formData.narx}
                  onChange={handleChange}
                  min="0"
                  required
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="soni">Soni *</label>
                <input
                  id="soni"
                  type="number"
                  name="soni"
                  value={formData.soni}
                  onChange={handleChange}
                  min="0"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* Category Section */}
            <div className="form-group">
              <label htmlFor="bolim">Bo'lim *</label>
              <div className="category-select-container">
                <button
                  type="button"
                  className="add-category-btn"
                  onClick={() => setShowCategoryInput(!showCategoryInput)}
                  aria-label={showCategoryInput ? "Bo'lim qo'shishni bekor qilish" : "Bo'lim qo'shish"}
                >
                  <i className={`fas ${showCategoryInput ? 'fa-times' : 'fa-plus'}`}></i> Bo'lim qo'shish
                </button>
                <div className="category-select-row">
                  <Select
                    options={categories.map((category) => ({
                      value: category,
                      label: category,
                    }))}
                    value={
                      formData.bolim
                        ? { value: formData.bolim, label: formData.bolim }
                        : null
                    }
                    onChange={(selectedOption) =>
                      setFormData({
                        ...formData,
                        bolim: selectedOption ? selectedOption.value : '',
                      })
                    }
                    placeholder="Bo'limni tanlang yoki kiriting"
                    isClearable
                    isSearchable
                    required
                    aria-required="true"
                    className="category-dropdown"
                    classNamePrefix="react-select"
                    noOptionsMessage={() => "Bo'lim topilmadi"}
                  />
                  <button
                    type="button"
                    className="category-action-btn"
                    onClick={() => setShowCategoryInput(!showCategoryInput)}
                    aria-label={showCategoryInput ? "Bo'lim qo'shishni bekor qilish" : "Yangi bo'lim qo'shish"}
                  >
                    <i className={`fas ${showCategoryInput ? 'fa-times' : 'fa-plus'}`}></i>
                  </button>
                </div>

                {showCategoryInput && (
                  <div className="new-category-form">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Yangi bo'lim nomi"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        aria-label="Yangi bo'lim nomi"
                        className="category-input"
                        autoFocus
                      />
                    </div>
                    <div className="category-form-actions">
                      <button
                        type="button"
                        className="save-category-btn"
                        onClick={addCategory}
                        disabled={!newCategory.trim()}
                        aria-label="Yangi bo'limni saqlash"
                      >
                        <i className="fas fa-save"></i> Saqlash
                      </button>
                      <button
                        type="button"
                        className="cancel-category-btn"
                        onClick={() => {
                          setShowCategoryInput(false);
                          setNewCategory('');
                        }}
                        aria-label="Bekor qilish"
                      >
                        <i className="fas fa-times"></i> Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Management Section */}
              {categories.length > 0 && (
                <div className="category-management">
                  <div className="category-list-header">
                    <span>Mavjud bo'limlar ({categories.length})</span>
                    <button
                      type="button"
                      className="manage-categories-btn"
                      onClick={() => setShowCategoryManagement(!showCategoryManagement)}
                      aria-label="Bo'limlarni boshqarish"
                    >
                      <i className={`fas ${showCategoryManagement ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </button>
                  </div>
                  
                  {showCategoryManagement && (
                    <div className="category-list-container">
                      <ul className="category-list">
                        {categories.map((category, index) => (
                          <li key={index} className="category-item">
                            <span>{category}</span>
                            <div className="category-item-actions">
                              <button
                                type="button"
                                className="edit-category-btn"
                                onClick={() => {
                                  setEditingCategoryIndex(index);
                                  setEditedCategoryName(category);
                                  setShowCategoryInput(true);
                                  setNewCategory(category);
                                }}
                                aria-label={`${category} bo'limini tahrirlash`}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                type="button"
                                className="delete-category-btn"
                                onClick={() => handleDeleteCategory(index)}
                                disabled={products.some(p => p.bolim === category)}
                                aria-label={`${category} bo'limini o'chirish`}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="form-group">
              <label htmlFor="rasm">Rasm (ixtiyoriy)</label>
              <input
                id="rasm"
                type="file"
                name="rasm"
                accept="image/*"
                onChange={handleChange}
                aria-label="Mahsulot rasmini yuklash"
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="current-image">
                  <p>Rasm ko'rinishi:</p>
                  <img src={imagePreview} alt="Mahsulot rasmi" width="120" />
                </div>
              )}
              
              {/* Show current image when editing */}
              {isEditing && formData.rasm && typeof formData.rasm === 'string' && !imagePreview && (
                <div className="current-image">
                  <p>Joriy rasm:</p>
                  <img src={formData.rasm} alt="Joriy mahsulot rasmi" width="120" />
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
                aria-label="Kerakli mahsulot sifatida belgilash"
              />
              <label htmlFor="kerakli">
                Kerakli mahsulot {formData.kerakli && "(Do'konda doim bo'lishi kerak)"}
              </label>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="submit-btn" aria-label={isEditing ? "O'zgarishlarni saqlash" : "Tovar qo'shish"}>
                {isEditing ? "O'zgarishlarni saqlash" : "Tovar qo'shish"}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="cancel-btn" aria-label="Tahrirlashni bekor qilish">
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
                  aria-label="Skanerlash oynasini yopish"
                >
                  Yopish
                </button>
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="product-list" ref={productListRef}>
            <h3>Mavjud mahsulotlar ({filteredProducts.length})</h3>
            <div className="product-items-container">
              {filteredProducts.length > 0 ? (
                <div className="product-items">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`product-item ${product.stockStatus} ${product.kerakli ? 'essential' : ''}`}
                    >
                      <div className="product-details">
                        {product.rasm ? (
                          <img src={product.rasm} alt={product.nomi} className="product-thumbnail" />
                        ) : (
                          <div className="product-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9ecef' }}>
                            <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>Rasm yo'q</span>
                          </div>
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
                          aria-label={`${product.nomi} mahsulotini tahrirlash`}
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          className="delete-btn"
                          aria-label={`${product.nomi} mahsulotini o'chirish`}
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
    </div>
  );
};

export default AddProduct;