import React, { useState, useEffect } from 'react';
import './Menu.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const haftaKunlari = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const oylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);

    // Vaqtni yangilash
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  const calculateRegistrationTime = () => {
    if (!user || !user.registrationTime) return "0 daqiqa";
    
    const regTime = new Date(user.registrationTime);
    const diff = (currentTime - regTime) / 1000; // soniyalarda
    
    if (diff < 60) return `${Math.floor(diff)} soniya`;
    if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
    return `${Math.floor(diff / 86400)} kun`;
  };

  if (!user) {
    return (
      <div className="login-required">
        <div className="login-message">
          <h3>Kirish talab qilinadi</h3>
          <p>Davom etish uchun tizimga kiring yoki ro'yxatdan o'ting</p>
          <button onClick={() => navigate('/')}>Kirish sahifasi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
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
        <div className="menu-header">
          <h2>Salom, {user.ism}! Asosiy sahifa</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Mahsulot nomi, kodi yoki shtrix kodi bo'yicha qidiruv..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>
        
        <div className="tabs">
          <button className="active">Mahsulotlar ro'yxati</button>
          <button onClick={() => navigate('/orders')}>Sotuv statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Yangi mahsulot qo'shish</button>
        </div>
        
        <div className="menu-content">
          <div className="products-section">
            <div className="products-header">
              <h3>Mahsulotlar ({filteredProducts.length})</h3>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`product-card ${product.soni <= 0 ? 'disabled' : ''}`}
                    onClick={() => product.soni > 0 && openProductDetail(product)}
                  >
                    {product.rasm ? (
                      <img
                        src={product.rasm}
                        alt={product.nomi}
                        className="product-image"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <i className="fas fa-box-open"></i>
                      </div>
                    )}
                    <div className="product-info">
                      <h4>{product.nomi}</h4>
                      <div className="product-meta">
                        <span className="price">{product.narx ? product.narx.toLocaleString() + ' UZS' : 'Narx belgilanmagan'}</span>
                        <span className={`stock ${product.soni <= 0 ? 'out-of-stock' : ''}`}>
                          Qoldiq: {product.soni} ta
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>Hech qanday mahsulot topilmadi</p>
                <button onClick={() => navigate('/add-product')}>
                  Yangi mahsulot qo'shish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mahsulot haqida batafsil ma'lumot modal oynasi */}
      {showProductDetail && selectedProduct && (
        <div className="modal-overlay">
          <div className="product-detail-modal">
            <button className="close-modal" onClick={closeProductDetail}>
              &times;
            </button>
            
            <div className="modal-header">
              <h3>{selectedProduct.nomi}</h3>
            </div>
            
            <div className="modal-body">
              {selectedProduct.rasm ? (
                <img
                  src={selectedProduct.rasm}
                  alt={selectedProduct.nomi}
                  className="detail-image"
                />
              ) : (
                <div className="detail-image-placeholder">
                  <i className="fas fa-box-open"></i>
                </div>
              )}
              
              <div className="detail-info">
                <div className="detail-row">
                  <span className="detail-label">Narxi:</span>
                  <span className="detail-value">
                    {selectedProduct.narx ? selectedProduct.narx.toLocaleString() + ' UZS' : 'Narx belgilanmagan'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Qoldiq:</span>
                  <span className={`detail-value ${selectedProduct.soni <= 0 ? 'out-of-stock' : ''}`}>
                    {selectedProduct.soni} ta
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Mahsulot kodi:</span>
                  <span className="detail-value">{selectedProduct.kodi || 'Belgilanmagan'}</span>
                </div>
                
                {selectedProduct.shtrix_kod && (
                  <div className="detail-row">
                    <span className="detail-label">Shtrix kod:</span>
                    <span className="detail-value">{selectedProduct.shtrix_kod}</span>
                  </div>
                )}
                
                {selectedProduct.izoh && (
                  <div className="detail-row">
                    <span className="detail-label">Qo'shimcha ma'lumot:</span>
                    <span className="detail-value">{selectedProduct.izoh}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <span className="detail-label">Yaratilgan sana:</span>
                  <span className="detail-value">
                    {new Date(selectedProduct.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => navigate(`/edit-product/${selectedProduct.id}`)}
                className="edit-btn"
              >
                Tahrirlash
              </button>
              <button onClick={closeProductDetail} className="close-btn">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;