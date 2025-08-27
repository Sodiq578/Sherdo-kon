import React, { useState, useEffect, useRef } from 'react';
import './Menu.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);
  const [subscriptionRemaining, setSubscriptionRemaining] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const daysOfWeek = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.bolim).filter(Boolean))];

  // Load products, user data, and update time/subscription every second
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);

    if (currentUser && currentUser.subscription) {
      const endDate = new Date(currentUser.subscription.endDate);
      if (endDate < new Date()) {
        navigate('/subscription-expired');
      }
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (currentUser && currentUser.subscription) {
        const endDate = new Date(currentUser.subscription.endDate);
        const timeDiff = endDate - new Date();
        if (timeDiff <= 0) {
          navigate('/subscription-expired');
        } else {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          setSubscriptionRemaining({ days, hours, minutes, seconds });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((err) => console.error('Video play error:', err));
          scanBarcode();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Kameraga kirishda xatolik yuz berdi. Iltimos, ruxsatlarni tekshiring.');
      setShowScanner(false);
    }
  };

  // Stop barcode scanner
  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
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

  // Filter products based on search term and category
  const filteredProducts = products.filter(
    (product) =>
      (selectedCategory === 'all' || product.bolim === selectedCategory) &&
      (product.nomi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.kodi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Check if image URL is valid
  const checkImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
    });
  };

  // Open product detail modal with image validation
  const openProductDetail = async (product) => {
    const copiedProduct = { ...product };
    if (copiedProduct.rasm) {
      const isValid = await checkImage(copiedProduct.rasm);
      if (!isValid) {
        copiedProduct.rasm = ''; // Set to empty if invalid
      }
    }
    setSelectedProduct(copiedProduct);
    setShowProductDetail(true);
  };

  // Close product detail modal
  const closeProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Calculate registration time
  const calculateRegistrationTime = () => {
    if (!user || !user.subscription?.startDate) return '0 daqiqa';
    const regTime = new Date(user.subscription.startDate);
    const diff = (currentTime - regTime) / 1000; // Difference in seconds

    if (diff < 60) return `${Math.floor(diff)} soniya`;
    if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat`;
    if (diff < 7776000) return `${Math.floor(diff / 86400)} kun`; // Less than 90 days
    return `${Math.floor(diff / 2592000)} oy`; // Months for longer durations
  };

  // Redirect to login if no user is found
  if (!user) {
    return (
      <div className="login-required">
        <div className="login-message">
          <h3>Kirish talab qilinadi</h3>
          <p>Davom etish uchun tizimga kiring yoki ro'yxatdan o'ting</p>
          <button onClick={() => navigate('/')}>
            <i className="fas fa-sign-in-alt"></i> Kirish sahifasi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        {/* Time, User, and Subscription Info in Three Boxes */}
        <div className="time-user-info">
          <div className="info-box time-box">
            <h4>Sana va Vaqt</h4>
            <p>
              <span>{daysOfWeek[currentTime.getDay()]}, </span>
              <span>{currentTime.getDate()} {months[currentTime.getMonth()]} </span>
              <span>{currentTime.getFullYear()} yil</span>
            </p>
            <p>
              <span>{currentTime.getHours().toString().padStart(2, '0')}:</span>
              <span>{currentTime.getMinutes().toString().padStart(2, '0')}:</span>
              <span>{currentTime.getSeconds().toString().padStart(2, '0')}</span>
            </p>
          </div>
          <div className="info-box user-box">
            <h4>Foydalanuvchi</h4>
            <p className="username">{user.ism}</p>
            <p className="registration-time">Ro'yxatdan o'tgan: {calculateRegistrationTime()} oldin</p>
          </div>
          <div className="info-box subscription-box">
            <h4>Obuna Ma'lumotlari</h4>
            {user.subscription ? (
              <>
                <p>Obuna: {user.subscription.duration} oy</p>
                <p>
                  Qolgan vaqt: {subscriptionRemaining ? 
                    `${subscriptionRemaining.days} kun, ${subscriptionRemaining.hours} soat, ${subscriptionRemaining.minutes} daqiqa, ${subscriptionRemaining.seconds} soniya` 
                    : 'Yuklanmoqda...'}
                </p>
              </>
            ) : (
              <p>Obuna ma'lumotlari mavjud emas</p>
            )}
          </div>
        </div>

        {/* Header, Search Bar, Category Dropdown, and Tabs in One Row */}
        <div className="menu-header">
          <div className="header-tabs-container">
            <h2 className='title'>Mahsulotlar ro'yxati</h2>
            <div className="tabs-search-container">
              <div className="search-container">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Mahsulot nomi, kodi yoki shtrix kodi bo'yicha qidiruv..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="barcode-search-btn" onClick={() => setShowScanner(true)}>
                    <i className="fas fa-barcode"></i>
                  </button>
                  <i className="fas fa-search"></i>
                </div>
                <select
                  className="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Barcha bo\'limlar' : category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tabs">
                <button className="active">Mahsulotlar ro'yxati</button>
                <button onClick={() => navigate('/stats')}>Sotuv statistikasi</button>
                <button onClick={() => navigate('/add-product')}>Yangi mahsulot qo'shish</button>
                <button onClick={() => navigate('/cashier')}>Kassir</button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="menu-content">
          <div className="products-section">
            <div className="products-header">
              <h3>Mahsulotlar ({filteredProducts.length})</h3>
              <div className="products-actions">
                <button onClick={() => navigate('/add-product')} className="add-product-btn btn btn-primary">
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
                    {product.rasm && product.rasm !== '' ? (
                      <img src={product.rasm} alt={product.nomi} className="product-image" />
                    ) : (
                      <div className="product-image-placeholder">
                        <i className="fas fa-box-open"></i>
                      </div>
                    )}
                    <div className="product-info">
                      <h4>{product.nomi}</h4>
                      <div className="product-meta">
                        <span className="price">
                          {product.narx ? product.narx.toLocaleString() + " so'm" : 'Narx belgilanmagan'}
                        </span>
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
                <button onClick={() => navigate('/add-product')} className="add-product-btn btn btn-primary">
                  <i className="fas fa-plus"></i> Yangi mahsulot qo'shish
                </button>
              </div>
            )}
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
                <span
                  className={`product-status ${selectedProduct.soni <= 0 ? 'out-of-stock' : 'in-stock'}`}
                >
                  {selectedProduct.soni <= 0 ? 'Qolmagan' : 'Sotuvda'}
                </span>
              </div>
              <div className="modal-body">
                {selectedProduct.rasm && selectedProduct.rasm !== '' ? (
                  <img src={selectedProduct.rasm} alt={selectedProduct.nomi} className="detail-image" />
                ) : (
                  <div className="detail-image-placeholder">
                    <i className="fas fa-box-open"></i>
                  </div>
                )}
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Narxi:</span>
                    <span className="detail-value">
                      {selectedProduct.narx
                        ? selectedProduct.narx.toLocaleString() + " so'm"
                        : 'Narx belgilanmagan'}
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
                <button onClick={closeProductDetail} className="close-btn btn btn-danger">
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
              <h3>
                <i className="fas fa-barcode"></i> Shtrix-kodni skanerlash
              </h3>
              <p>Kameraga shtrix-kodni ko'rsating</p>
              <video ref={videoRef} playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <button className="close-scanner-btn btn btn-danger" onClick={() => setShowScanner(false)}>
                <i className="fas fa-times"></i> Yopish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;