import React, { useState, useEffect, useRef, useMemo } from 'react';
import jsPDF from 'jspdf';
import './Cashier.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const Cashier = () => {
  // State declarations
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
  const [showCategoryButtons, setShowCategoryButtons] = useState(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Load products
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    searchInputRef.current?.focus();
  }, []);

  // Scanner effect
  useEffect(() => {
    if (showScanner) startScanner();
    else stopScanner();
    return () => stopScanner();
  }, [showScanner]);

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
      alert('Kameraga kirishda xatolik!');
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    videoRef.current?.srcObject?.getTracks().forEach(track => track.stop());
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
          const scannedCode = code.data;
          // Find product by barcode
          const product = products.find(
            p => p.shtrix_kod && p.shtrix_kod.toLowerCase() === scannedCode.toLowerCase()
          );
          if (product) {
            addToCart(product); // Add product to cart
            setShowScanner(false); // Close scanner after successful scan
          } else {
            alert('Skanerlangan shtrix-kodga mos tovar topilmadi!');
            setSearchTerm(scannedCode); // Fallback to setting search term
            searchInputRef.current?.focus();
            setShowScanner(false);
          }
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
      const matchesCategory = activeCategory === 'all' || product.bolim === activeCategory;
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
    if (!product) return;

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
    if (cart.length > 0 && window.confirm('Haqiqatan ham savatni tozalamoqchimisiz?')) {
      setCart([]);
    }
  };

  const { subtotal, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const total = subtotal * (1 - discount / 100);
    return { subtotal, total };
  }, [cart, discount]);

  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Savat bo'sh!");
      return { success: false };
    }

    if (paymentMethod === 'debt' && !customer.trim()) {
      alert('Qarz uchun mijoz ismini kiriting!');
      return { success: false };
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
      const updatedProducts = products.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        return cartItem
          ? { ...product, soni: product.soni - cartItem.quantity }
          : product;
      });
      localStorage.setItem('products', JSON.stringify(updatedProducts));

      const sales = JSON.parse(localStorage.getItem('sales')) || [];
      localStorage.setItem('sales', JSON.stringify([...sales, sale]));

      const currentDate = new Date().toISOString().split('T')[0];
      const dailyReports = JSON.parse(localStorage.getItem('dailyReports')) || {};
      const dailyReport = dailyReports[currentDate] || { date: currentDate, sales: [] };
      dailyReport.sales.push(sale);
      dailyReport.totalAmount = (dailyReport.totalAmount || 0) + sale.total;
      dailyReport.totalItems =
        (dailyReport.totalItems || 0) + sale.items.reduce((sum, item) => sum + item.quantity, 0);
      dailyReports[currentDate] = dailyReport;
      localStorage.setItem('dailyReports', JSON.stringify(dailyReports));

      setCart([]);
      setCustomer('');
      setDiscount(0);
      setNote('');
      setSaleCompleted(true);
      setLastSale(sale);

      setTimeout(() => setSaleCompleted(false), 3000);

      return { success: true, sale };
    } catch (error) {
      console.error('Sotuvda xatolik:', error);
      alert('Sotuvni yakunlashda xatolik yuz berdi. Iltimos, qayta urunib ko\'ring.');
      return { success: false };
    }
  };

  const generateReceiptHTML = (sale) => {
    const formattedDate = new Date(sale.date).toLocaleString('uz-UZ');
    return `
      <div style="font-family: Arial, sans-serif; font-size: 10pt; width: 80mm; margin: 0 auto;">
        <h2 style="text-align: center;">Savdo Tizimi</h2>
        <p style="text-align: center;">Chek #${sale.id}</p>
        <p>Data: ${formattedDate}</p>
        <p>Mijoz: ${sale.customer || "Noma'lum"}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid #000; text-align: left;">Tovar</th>
              <th style="border-bottom: 1px solid #000; text-align: right;">Miqdor</th>
              <th style="border-bottom: 1px solid #000; text-align: right;">Narx</th>
              <th style="border-bottom: 1px solid #000; text-align: right;">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td>${item.nomi}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${item.narx.toLocaleString()} so'm</td>
                <td style="text-align: right;">${(item.narx * item.quantity).toLocaleString()} so'm</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 10px;">Subtotal: ${sale.subtotal.toLocaleString()} so'm</p>
        <p>Chegirma: ${sale.discount}%</p>
        <p style="font-weight: bold;">Yakuniy summa: ${sale.total.toLocaleString()} so'm</p>
        <p>To'lov usuli: ${paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : paymentMethod === 'transfer' ? "O'tkazma" : 'Qarz'}</p>
        <p>Eslatma: ${sale.note || 'Yo\'q'}</p>
        <p style="text-align: center; margin-top: 20px;">Rahmat! Yana kutamiz!</p>
      </div>
    `;
  };

  const generateReceiptPrint = (sale) => {
    const receiptWindow = window.open('', '', 'height=600,width=400');
    if (receiptWindow) {
      receiptWindow.document.write('<html><head><title>Chek</title>');
      receiptWindow.document.write('</head><body>');
      receiptWindow.document.write(generateReceiptHTML(sale));
      receiptWindow.document.write('</body></html>');
      receiptWindow.document.close();
      receiptWindow.focus();
      receiptWindow.print();
      // receiptWindow.close(); // Close after print, but user may need to see
    } else {
      alert('Pop-up bloklangan! Iltimos, pop-upga ruxsat bering.');
    }
  };

  const generatePDF = (sale) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: [80, 200], // Approximate receipt size
    });
    let y = 10;
    const formattedDate = new Date(sale.date).toLocaleString('uz-UZ');

    doc.setFontSize(12);
    doc.text('Savdo Tizimi', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Chek #${sale.id}`, 20, y);
    y += 6;
    doc.text(`Data: ${formattedDate}`, 10, y);
    y += 6;
    doc.text(`Mijoz: ${sale.customer || "Noma'lum"}`, 10, y);
    y += 10;

    doc.text('Tovar', 10, y);
    doc.text('Miqdor', 30, y);
    doc.text('Narx', 45, y);
    doc.text('Jami', 60, y);
    y += 4;
    doc.line(10, y, 70, y);
    y += 4;

    sale.items.forEach(item => {
      doc.text(`${item.nomi.slice(0, 15)}...`, 10, y); // Truncate long names
      doc.text(`${item.quantity}`, 35, y);
      doc.text(`${item.narx.toLocaleString()}`, 45, y);
      doc.text(`${(item.narx * item.quantity).toLocaleString()}`, 60, y);
      y += 6;
    });

    doc.line(10, y, 70, y);
    y += 6;
    doc.text(`Subtotal: ${sale.subtotal.toLocaleString()} so'm`, 10, y);
    y += 6;
    doc.text(`Chegirma: ${sale.discount}%`, 10, y);
    y += 6;
    doc.setFont('bold');
    doc.text(`Yakuniy: ${sale.total.toLocaleString()} so'm`, 10, y);
    y += 6;
    doc.setFont('normal');
    doc.text(`To'lov: ${paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : paymentMethod === 'transfer' ? "O'tkazma" : 'Qarz'}`, 10, y);
    y += 6;
    doc.text(`Eslatma: ${sale.note || 'Yo\'q'}`, 10, y);
    y += 10;
    doc.text('Rahmat! Yana kutamiz!', 15, y);

    doc.save(`chek_${sale.id}.pdf`);
  };

  const completeSaleWithReceipt = async () => {
    const result = await completeSale();
    if (result.success) {
      generateReceiptPrint(result.sale);
      setTimeout(() => setShowPrintConfirmModal(true), 500); // Delay to allow print dialog
      alert('Sotuv muvaffaqiyatli yakunlandi! Chek tayyor.');
    }
  };

  const completeSaleWithoutReceipt = async () => {
    const result = await completeSale();
    if (result.success) {
      alert('Sotuv muvaffaqiyatli yakunlandi!');
    }
  };

  return (
    <div className="cashier-container">
      <Sidebar />
      <div className="cashier-content">
        <div className="cashier-header">
          <h2 className="cashier-title">Kassir</h2>
          <div className="cashier-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cashier-search-input"
            />
            <button
              className="cashier-scan-button"
              onClick={() => setShowScanner(true)}
            >
              <i className="fas fa-barcode"></i> Skaner
            </button>
          </div>
        </div>

        <div className="cashier-tabs">
          <button onClick={() => navigate('/menu')}>Tovarlar</button>
          <button onClick={() => navigate('/orders')}>Sotuvlar</button>
          <button onClick={() => navigate('/stats')}>Hisobot</button>
          <button className="active">Kassir</button>
        </div>

        {saleCompleted && (
          <div className="cashier-success">
            Sotuv muvaffaqiyatli yakunlandi!
          </div>
        )}

        <div className="cashier-main">
          <div className="cashier-products">
            <div className="cashier-categories">
              <div className="category-select-container">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? "Barcha bo'limlar" : category}
                    </option>
                  ))}
                </select>
                <button
                  className="toggle-categories-btn"
                  onClick={() => setShowCategoryButtons(!showCategoryButtons)}
                >
                  {showCategoryButtons ? 'Yashirish' : "Ko'rsatish"}
                </button>
              </div>

              {showCategoryButtons && (
                <div className="category-buttons">
                  {categories.map(category => (
                    <button
                      key={category}
                      className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category === 'all' ? 'Barchasi' : category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showScanner && (
              <div className="cashier-scanner">
                <div className="scanner-content">
                  <h3>Skaner</h3>
                  <video ref={videoRef} className="scanner-video" />
                  <canvas ref={canvasRef} className="scanner-canvas" />
                  <button
                    className="scanner-close"
                    onClick={() => setShowScanner(false)}
                  >
                    Yopish
                  </button>
                </div>
              </div>
            )}

            <div className="cashier-product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="cashier-product-card"
                    onClick={() => addToCart(product)}
                  >
                    {product.rasm && (
                      <img src={product.rasm} alt={product.nomi} className="product-image" />
                    )}
                    <div className="product-info">
                      <h4 className="product-name">{product.nomi}</h4>
                      <p className="product-price">{product.narx.toLocaleString()} so'm</p>
                      <p className="product-stock">Qoldiq: {product.soni}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="cashier-empty">
                  <p>Tovarlar topilmadi</p>
                </div>
              )}
            </div>
          </div>

          <div className="cashier-cart">
            <div className="cart-header">
              <h3 className="cart-title">
                Savat ({cart.reduce((sum, item) => sum + item.quantity, 0)} ta)
              </h3>
              <button
                className="cart-clear"
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
                      <h4 className="item-name">{item.nomi}</h4>
                      <p className="item-price">{item.narx.toLocaleString()} so'm</p>
                    </div>
                    <div className="item-quantity">
                      <button
                        className="quantity-btn minus"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        className="quantity-btn plus"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="item-total">
                      {(item.narx * item.quantity).toLocaleString()} so'm
                    </p>
                    <button
                      className="item-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))
              ) : (
                <div className="cart-empty">
                  <p>Savat bo'sh</p>
                </div>
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span className="summary-label">Jami:</span>
                <span className="summary-value">{subtotal.toLocaleString()} so'm</span>
              </div>
              <div className="summary-row">
                <label className="summary-label">Chegirma (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="discount-input"
                />
              </div>
              <div className="summary-row total">
                <span className="total-label">Yakuniy summa:</span>
                <span className="total-value">{total.toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="customer-info">
              <input
                type="text"
                placeholder="Mijoz ismi (ixtiyoriy, qarz uchun majburiy)"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="customer-input"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="payment-select"
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
                className="note-textarea"
              />
            </div>

            <div className="sale-buttons">
              <button
                className="sale-button receipt"
                onClick={completeSaleWithReceipt}
                disabled={!cart.length}
              >
                Chek bilan yakunlash
              </button>
              <button
                className="sale-button no-receipt"
                onClick={completeSaleWithoutReceipt}
                disabled={!cart.length}
              >
                Cheksiz yakunlash
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPrintConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Aparatda muammo bo'ldimi? Chek muvaffaqiyatli chiqarildi mi?</p>
            <button onClick={() => setShowPrintConfirmModal(false)}>
              Ha
            </button>
            <button
              onClick={() => {
                generatePDF(lastSale);
                setShowPrintConfirmModal(false);
              }}
            >
              Yo'q, PDF qilib ber
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashier;