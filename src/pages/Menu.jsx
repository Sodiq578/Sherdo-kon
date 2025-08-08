import React, { useState, useEffect, useRef } from 'react';
import './Menu.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const haftaKunlari = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const oylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Load products and user data, update time every second
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle barcode scanner lifecycle
  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [showScanner]);

  // Start barcode scanner
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        scanBarcode();
      };
    } catch (err) {
      console.error('Kamera xatosi:', err);
      alert("Kameraga kirishda xatolik yuz berdi. Iltimos, ruxsatlarni tekshiring.");
      setShowScanner(false);
    }
  };

  // Stop barcode scanner
  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Scan barcode from video feed
  const scanBarcode = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setSearchTerm(code.data);
          setShowScanner(false);
        }
      }
      if (showScanner) requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open product detail modal
  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  // Close product detail modal
  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Calculate registration time
 const calculateRegistrationTime = () => {
  if (!user || !user.registrationTime) return "0 daqiqa";
  const regTime = new Date(user.registrationTime);
  const diff = (currentTime - regTime) / 1000; // Difference in seconds

  if (diff < 60) return `${Math.floor(diff)} soniya`;
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
  if (diff < 7776000) return `${Math.floor(diff / 86400)} kun`; // Less than 90 days
  if (diff < 7776000 * 1.5) return "2 oy"; // Between ~60 and ~90 days (2 months ± 0.5 month)
  return `${Math.floor(diff / 86400)} kun`; // Fallback to days for longer durations
};

  // Redirect to login if no user is found
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

        {/* Header and Search Bar */}
        <div className="menu-header">
          <h2>Salom, {user.ism}! Mahsulotlar ro'yxati</h2>
          <div className="search-container">
            <button
              className="barcode-search-btn"
              onClick={() => setShowScanner(true)}
            >
              <i className="fas fa-barcode"></i> Shtrix orqali qidirish
            </button>
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
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className="active">Mahsulotlar ro'yxati</button>
          <button onClick={() => navigate('/orders')}>Sotuv statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Yangi mahsulot qo'shish</button>
          <button onClick={() => navigate('/cashier')}>Kassir</button>
        </div>

        {/* Products Section */}
        <div className="menu-content">
          <div className="products-section">
            <div className="products-header">
              <h3>Mahsulotlar ({filteredProducts.length})</h3>
              <div className="products-actions">
                <button
                  onClick={() => navigate('/add-product')}
                  className="add-product-btn"
                >
                  <i className="fas fa-plus"></i> Yangi mahsulot
                </button>
              </div>
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
                        <span className="price">{product.narx ? product.narx.toLocaleString() + " so'm" : 'Narx belgilanmagan'}</span>
                        <span className={`stock ${product.soni <= 0 ? 'out-of-stock' : ''}`}>
                          Qoldiq: {product.soni} ta
                        </span>
                      </div>
                      {product.shtrix_kod && (
                        <div className="product-barcode">
                          <i className="fas fa-barcode"></i> {product.shtrix_kod}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <i className="fas fa-box-open"></i>
                <p>Hech qanday mahsulot topilmadi</p>
                <button
                  onClick={() => navigate('/add-product')}
                  className="add-product-btn"
                >
                  <i className="fas fa-plus"></i> Yangi mahsulot qo'shish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && selectedProduct && (
        <div className="modal-overlay">
          <div className="product-detail-modal">
            <button className="close-modal" onClick={closeProductDetail}>
              &times;
            </button>
            <div className="modal-header">
              <h3>{selectedProduct.nomi}</h3>
              <span className={`product-status ${selectedProduct.soni <= 0 ? 'out-of-stock' : 'in-stock'}`}>
                {selectedProduct.soni <= 0 ? 'Qolmagan' : 'Sotuvda'}
              </span>
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
                    {selectedProduct.narx ? selectedProduct.narx.toLocaleString() + " so'm" : 'Narx belgilanmagan'}
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
                {selectedProduct.bolim && (
                  <div className="detail-row">
                    <span className="detail-label">Bo'lim:</span>
                    <span className="detail-value">{selectedProduct.bolim}</span>
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
                    {new Date(selectedProduct.createdAt || Date.now()).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => navigate(`/edit-product/${selectedProduct.id}`)}
                className="edit-btn"
              >
                <i className="fas fa-edit"></i> Tahrirlash
              </button>
              <button onClick={closeProductDetail} className="close-btn">
                <i className="fas fa-times"></i> Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="scanner-modal">
          <div className="scanner-content">
            <h3><i className="fas fa-barcode"></i> Shtrix-kodni skanerlash</h3>
            <p>Kameraga shtrix-kodni ko'rsating</p>
            <video ref={videoRef} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <button
              className="close-scanner-btn"
              onClick={() => setShowScanner(false)}
            >
              <i className="fas fa-times"></i> Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;