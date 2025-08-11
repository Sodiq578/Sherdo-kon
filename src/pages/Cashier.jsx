import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Cashier.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const Cashier = () => {
  // State larni aniqlash
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saleCompleted, setSaleCompleted] = useState(false);
  
  // Ref lar
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Mahsulotlarni yuklash
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    searchInputRef.current?.focus();
  }, []);

  // Skaner effekti
  useEffect(() => {
    if (showScanner) startScanner();
    else stopScanner();
    return () => stopScanner();
  }, [showScanner]);

  // Skanerni boshlash
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
      console.error('Camera error:', err);
      alert("Kameraga kirishda xatolik!");
      setShowScanner(false);
    }
  };

  // Skanerni to'xtatish
  const stopScanner = () => {
    videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
  };

  // Shtrix-kodni skanerlash
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
          searchInputRef.current?.focus();
          setShowScanner(false);
        }
      }
      if (showScanner) requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  };

  // Kategoriyalarni olish
  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.bolim).filter(Boolean))];
  }, [products]);

  // Filtrlangan mahsulotlar
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product => {
      const matchesSearch = 
        product.nomi.toLowerCase().includes(term) ||
        product.kodi.toLowerCase().includes(term) ||
        (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(term));
      const matchesCategory = activeCategory === 'all' || product.bolim === activeCategory;
      return matchesSearch && matchesCategory && product.soni > 0;
    });
  }, [products, searchTerm, activeCategory]);

  // Savatga qo'shish
  const addToCart = (product, quantity = 1) => {
    if (product.soni <= 0) {
      alert(`${product.nomi} omborda mavjud emas!`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.soni) {
          alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > product.soni) {
          alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
          return prevCart;
        }
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  // Savatdagi miqdorni o'zgartirish
  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    const product = products.find(p => p.id === id);
    if (!product) return;

    if (newQuantity > product.soni) {
      alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
      return;
    }

    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Savatdan o'chirish
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Savatni tozalash
  const clearCart = () => {
    if (cart.length > 0 && window.confirm("Haqiqatan ham savatni tozalamoqchimisiz?")) {
      setCart([]);
    }
  };

  // Jami summani hisoblash
  const { subtotal, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const total = subtotal * (1 - discount / 100);
    return { subtotal, total };
  }, [cart, discount]);

  // To'lov usulini nomini olish
  const getPaymentMethodName = (method) => {
    const methods = {
      cash: 'Naqd pul',
      card: 'Plastik karta',
      transfer: "Bank o'tkazmasi",
      debt: 'Qarz'
    };
    return methods[method] || method;
  };

  // Sotuvni yakunlash (asosiy funksiya)
  const completeSale = async (withReceipt = false) => {
    if (cart.length === 0) {
      alert("Savat bo'sh!");
      return false;
    }

    if (paymentMethod === 'debt' && !customer.trim()) {
      alert("Qarz uchun mijoz ismini kiriting!");
      return false;
    }

    const sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer,
      items: cart,
      subtotal,
      total,
      paymentMethod,
      discount,
      note,
    };

    try {
      // Mahsulotlarni yangilash
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        return cartItem 
          ? { ...product, soni: product.soni - cartItem.quantity } 
          : product;
      });
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      // Sotuvlar tarixiga qo'shish
      const sales = JSON.parse(localStorage.getItem('sales')) || [];
      localStorage.setItem('sales', JSON.stringify([...sales, sale]));

      // Kunlik hisobotga qo'shish
      const currentDate = new Date().toISOString().split('T')[0];
      const dailyReports = JSON.parse(localStorage.getItem('dailyReports')) || {};
      const dailyReport = dailyReports[currentDate] || { date: currentDate, sales: [] };
      dailyReport.sales.push(sale);
      dailyReport.totalAmount = (dailyReport.totalAmount || 0) + sale.total;
      dailyReport.totalItems = (dailyReport.totalItems || 0) + sale.items.reduce((sum, item) => sum + item.quantity, 0);
      dailyReports[currentDate] = dailyReport;
      localStorage.setItem('dailyReports', JSON.stringify(dailyReports));

      // Tozalash
      setCart([]);
      setCustomer('');
      setDiscount(0);
      setNote('');
      setSaleCompleted(true);
      
      // 3 soniyadan keyin bildirishni yo'qotish
      setTimeout(() => setSaleCompleted(false), 3000);
      
      return true;
    } catch (error) {
      console.error("Sotuvda xatolik:", error);
      alert("Sotuvni yakunlashda xatolik yuz berdi. Iltimos, qayta urunib ko'ring.");
      return false;
    }
  };

  // Sotuvni chek bilan yakunlash
  const completeSaleWithReceipt = async () => {
    const success = await completeSale(true);
    if (success) {
      // Bu yerda chek yaratish logikasi qo'shilishi mumkin
      alert("Sotuv muvaffaqiyatli yakunlandi! Chek tayyor.");
    }
  };

  // Sotuvni cheksiz yakunlash
  const completeSaleWithoutReceipt = async () => {
    const success = await completeSale(false);
    if (success) {
      alert("Sotuv muvaffaqiyatli yakunlandi!");
    }
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="cashier-header">
          <h2>Kassir</h2>
          <div className="search-bar">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => setShowScanner(true)}>
              <i className="fas fa-barcode"></i> Skaner
            </button>
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovarlar</button>
          <button onClick={() => navigate('/orders')}>Sotuvlar</button>
          <button onClick={() => navigate('/stats')}>Hisobot</button>
          <button className="active">Kassir</button>
        </div>

        {saleCompleted && (
          <div className="success-message">
            Sotuv muvaffaqiyatli yakunlandi!
          </div>
        )}

        <div className="cashier-container">
          <div className="product-selection">
            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category}
                  className={activeCategory === category ? 'active' : ''}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === 'all' ? 'Barchasi' : category}
                </button>
              ))}
            </div>

            {showScanner && (
              <div className="scanner-modal">
                <div className="scanner-content">
                  <h3>Skaner</h3>
                  <video ref={videoRef} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button onClick={() => setShowScanner(false)}>Yopish</button>
                </div>
              </div>
            )}

            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => addToCart(product)}
                  >
                    {product.rasm && (
                      <img src={product.rasm} alt={product.nomi} />
                    )}
                    <div className="product-info">
                      <h4>{product.nomi}</h4>
                      <p className="price">{product.narx.toLocaleString()} so'm</p>
                      <p className="stock">Qoldiq: {product.soni}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products">
                  <p>Tovarlar topilmadi</p>
                </div>
              )}
            </div>
          </div>

          <div className="cart-section">
            <div className="cart-header">
              <h3>Savat ({cart.reduce((sum, item) => sum + item.quantity, 0)} ta)</h3>
              <button onClick={clearCart} disabled={!cart.length}>
                Tozalash
              </button>
            </div>

            <div className="cart-items">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.nomi}</h4>
                      <p>{item.narx.toLocaleString()} so'm</p>
                    </div>
                    <div className="item-quantity">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p className="item-total">
                      {(item.narx * item.quantity).toLocaleString()} so'm
                    </p>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-cart">
                  <p>Savat bo'sh</p>
                </div>
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Jami:</span>
                <span>{subtotal.toLocaleString()} so'm</span>
              </div>
              <div className="summary-row">
                <label>Chegirma (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
              </div>
              <div className="summary-row total">
                <span>Yakuniy summa:</span>
                <span>{total.toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="customer-info">
              <input
                type="text"
                placeholder="Mijoz ismi (ixtiyoriy, qarz uchun majburiy)"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="transfer">O'tkazma</option>
                <option value="debt">Qarz</option>
              </select>
              <textarea
                placeholder="Eslatma (ixtiyoriy)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="sale-buttons">
              <button
                className="complete-sale-btn with-receipt"
                onClick={completeSaleWithReceipt}
                disabled={!cart.length}
              >
                Chek bilan yakunlash
              </button>
              <button
                className="complete-sale-btn without-receipt"
                onClick={completeSaleWithoutReceipt}
                disabled={!cart.length}
              >
                Cheksiz yakunlash
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashier;