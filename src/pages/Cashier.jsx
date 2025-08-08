import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Cashier.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

  // Mahsulotlarni localStorage'dan yuklash
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Skaner effekti
  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [showScanner]);

  // Klaviatura qisqa yo'llari
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setShowScanner(true);
      }
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
          setSearchTerm(code.data);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
          setShowScanner(false);
        }
      }
      if (showScanner) requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
  };

  const categories = useMemo(() => {
    return ['all', ...new Set(products.map(p => p.bolim).filter(Boolean))];
  }, [products]);

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

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm("Haqiqatan ham savatni tozalamoqchimisiz?")) {
      setCart([]);
    }
  };

  const { subtotal, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const total = subtotal * (1 - discount / 100);
    return { subtotal, total };
  }, [cart, discount]);

  const generateReceipt = (sale) => {
    const doc = new jsPDF();
    const date = new Date(sale.date).toLocaleString();
    
    // Do'kon sarlavhasi
    doc.setFontSize(18);
    doc.text("MY SHOP", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("123 Main Street, Tashkent", 105, 22, { align: 'center' });
    doc.text("Tel: +998901234567", 105, 28, { align: 'center' });
    
    // Chek ma'lumotlari
    doc.setFontSize(10);
    doc.text(`Chek #: ${sale.id}`, 14, 40);
    doc.text(`Sana: ${date}`, 14, 46);
    if (sale.customer) {
      doc.text(`Mijoz: ${sale.customer}`, 14, 52);
    }
    
    // Chiziq ajratgich
    doc.line(10, 58, 200, 58);
    
    // Jadval sarlavhalari
    const headers = [['Nomi', 'Narx', 'Soni', 'Jami']];
    
    // Jadval ma'lumotlari
    const data = sale.items.map(item => [
      item.nomi,
      `${item.narx.toLocaleString()} so'm`,
      item.quantity,
      `${(item.narx * item.quantity).toLocaleString()} so'm`
    ]);
    
    // Jadval qo'shish
    doc.autoTable({
      startY: 60,
      head: headers,
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 }
      }
    });
    
    // Umumiy hisob
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Jami: ${sale.subtotal.toLocaleString()} so'm`, 14, finalY);
    if (sale.discount > 0) {
      doc.text(`Chegirma: ${sale.discount}%`, 14, finalY + 6);
      doc.text(`Yakuniy summa: ${sale.total.toLocaleString()} so'm`, 14, finalY + 12);
    }
    doc.text(`To'lov usuli: ${getPaymentMethodName(sale.paymentMethod)}`, 14, finalY + 18);
    
    // Footer
    doc.setFontSize(10);
    doc.text("Rahmat sotib olganingiz uchun!", 105, finalY + 30, { align: 'center' });
    doc.text("Qaytib kelishingizni kutamiz", 105, finalY + 36, { align: 'center' });
    
    // PDF ni saqlash
    doc.save(`chek_${sale.id}.pdf`);
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'cash': return 'Naqd';
      case 'card': return 'Karta';
      case 'transfer': return "O'tkazma";
      default: return method;
    }
  };

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

    // Mahsulotlar zahirasini yangilash
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      return cartItem 
        ? { ...product, soni: product.soni - cartItem.quantity } 
        : product;
    });

    // Yangilangan mahsulotlarni localStorage'ga saqlash
    localStorage.setItem('products', JSON.stringify(updatedProducts));

    // Sotuvni sotuvlar tarixiga saqlash
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    localStorage.setItem('sales', JSON.stringify([...sales, sale]));

    // Kunlik hisobotga saqlash
    const currentDate = new Date().toISOString().split('T')[0];
    const dailyReports = JSON.parse(localStorage.getItem('dailyReports')) || {};
    const dailyReport = dailyReports[currentDate] || { date: currentDate, sales: [] };
    dailyReport.sales.push(sale);
    dailyReport.totalAmount = dailyReport.sales.reduce((sum, s) => sum + s.total, 0);
    dailyReport.totalItems = dailyReport.sales.reduce((sum, s) => sum + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);
    dailyReports[currentDate] = dailyReport;
    localStorage.setItem('dailyReports', JSON.stringify(dailyReports));

    // Chek generatsiya qilish va saqlash
    generateReceipt(sale);

    // Tozalash va bildirish
    setCart([]);
    setCustomer('');
    setDiscount(0);
    setNote('');
    alert("Sotuv muvaffaqiyatli yakunlandi! Chek yuklab olindi.");
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
          <button onClick={() => navigate('/daily-report')}>Kunlik Hisobot</button>
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