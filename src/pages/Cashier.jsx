import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Cashier.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const Cashier = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Load products and categories from localStorage
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    
    // Focus search input on load
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Scanner effect
  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [showScanner]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus search on Ctrl+F
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Open scanner on Ctrl+B
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setShowScanner(true);
      }
      // Clear cart on Ctrl+D
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        clearCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        scanBarcode();
      };
    } catch (err) {
      console.error('Camera error:', err);
      alert("Kameraga kirishda xatolik yuz berdi!");
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

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
          const product = products.find(p => p.shtrix_kod === code.data);
          if (product) {
            if (product.soni <= 0) {
              alert(`${product.nomi} omborda mavjud emas!`);
            } else {
              addToCart(product);
              setShowScanner(false);
            }
          } else {
            alert("Shtrix-kod ro'yxatda topilmadi!");
          }
        }
      }
      if (showScanner) requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  };

  // Get unique categories
  const categories = useMemo(() => {
    const allCategories = ['all', ...new Set(products.map(p => p.bolim).filter(Boolean))];
    return allCategories;
  }, [products]);

  // Filter products by search term and category
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(product => {
      const matchesSearch = 
        product.nomi.toLowerCase().includes(term) ||
        product.kodi.toLowerCase().includes(term) ||
        (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(term));
      
      const matchesCategory = 
        activeCategory === 'all' || product.bolim === activeCategory;
      
      return matchesSearch && matchesCategory && product.soni > 0;
    });
  }, [products, searchTerm, activeCategory]);

  // Add product to cart
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

  // Update cart quantity
  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }

    const product = products.find(p => p.id === id);
    if (newQuantity > product.soni) {
      alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
      return;
    }

    setCart(cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length > 0 && window.confirm("Haqiqatan ham savatni tozalamoqchimisiz?")) {
      setCart([]);
    }
  };

  // Calculate totals
  const { subtotal, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const total = subtotal * (1 - discount / 100);
    return { subtotal, total };
  }, [cart, discount]);

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Savat bo'sh!");
      return;
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

    // Update products stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      return cartItem 
        ? { ...product, soni: product.soni - cartItem.quantity } 
        : product;
    });

    // Save to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    localStorage.setItem('sales', JSON.stringify([...sales, sale]));

    // Send to Telegram (optional)
    await sendToTelegram(sale);

    // Reset and notify
    setCart([]);
    setCustomer('');
    setDiscount(0);
    setNote('');
    alert("Sotuv muvaffaqiyatli yakunlandi!");
  };

  const sendToTelegram = async (sale) => {
    // Your Telegram bot implementation here
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
              placeholder="Nomi, kodi yoki shtrix-kod bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="scan-btn"
              onClick={() => setShowScanner(true)}
            >
              <i className="fas fa-barcode"></i> Skaner
            </button>
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovarlar</button>
          <button onClick={() => navigate('/orders')}>Sotuvlar</button>
          <button className="active">Kassir</button>
        </div>

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
                  <h3>Shtrix-kodni skanerlash</h3>
                  <video ref={videoRef} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button onClick={() => setShowScanner(false)}>
                    Yopish
                  </button>
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
              <button 
                onClick={clearCart}
                disabled={!cart.length}
              >
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
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
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
                placeholder="Mijoz ismi (ixtiyoriy)"
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
              </select>
              <textarea
                placeholder="Eslatma (ixtiyoriy)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button
              className="complete-sale-btn"
              onClick={completeSale}
              disabled={!cart.length}
            >
              Sotuvni yakunlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashier;