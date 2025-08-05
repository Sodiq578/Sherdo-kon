import React, { useState, useEffect, useRef } from 'react';
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
  const [productQuantities, setProductQuantities] = useState({});
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // Load products from localStorage
  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    const initialQuantities = storedProducts.reduce((acc, product) => ({
      ...acc,
      [product.id]: 1,
    }), {});
    setProductQuantities(initialQuantities);
  }, []);

  // Handle scanner visibility
  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [showScanner]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanBarcode();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert("Kameraga kirishda xatolik yuz berdi. Iltimos, ruxsatlarni tekshiring.");
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Use jsQR to detect barcode
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          const product = products.find((p) => p.shtrix_kod === code.data);
          if (product) {
            if (product.soni <= 0) {
              alert(`${product.nomi} omborda mavjud emas!`);
            } else {
              addToCart(product);
              setShowScanner(false);
              stopScanner();
            }
          } else {
            alert("Shtrix-kod ro'yxatda topilmadi!");
          }
        }
      }
      if (showScanner) {
        requestAnimationFrame(scan);
      }
    };
    requestAnimationFrame(scan);
  };

  // Update quantity for a specific product before adding to cart
  const updateProductQuantity = (productId, newQuantity) => {
    const product = products.find((p) => p.id === productId);
    if (newQuantity < 1) {
      setProductQuantities((prev) => ({ ...prev, [productId]: 1 }));
      return;
    }
    if (newQuantity > product.soni) {
      alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
      setProductQuantities((prev) => ({ ...prev, [productId]: product.soni }));
      return;
    }
    setProductQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
  };

  // Add product to cart with specified quantity
  const addToCart = (product) => {
    const quantity = productQuantities[product.id] || 1;
    if (product.soni <= 0) {
      alert(`${product.nomi} omborda mavjud emas!`);
      return;
    }
    if (quantity > product.soni) {
      alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.soni) {
        alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    setProductQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  // Update cart item quantity
  const updateCartQuantity = (id, newQuantity) => {
    const product = products.find((p) => p.id === id);
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    if (newQuantity > product.soni) {
      alert(`Omborda faqat ${product.soni} ta ${product.nomi} mavjud!`);
      return;
    }
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    alert("Savat tozalandi!");
  };

  // Calculate total with discount
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  // Send sale details to Telegram
  const sendToTelegram = async (sale) => {
    const TELEGRAM_BOT_TOKEN = '7929537269:AAFLIzihE_M1CZz5jAxTVAlFya8_GCnbEsU';
    const CHAT_ID = '-4771629083';
    const message = `
      🧾 *Yangi sotuv #${sale.id}*
      📅 Sana: ${new Date(sale.date).toLocaleString()}
      👤 Mijoz: ${sale.customer || 'Noma\'lum'}
      💸 To'lov usuli: ${paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : 'O\'tkazma'}
      🛒 Mahsulotlar:
      ${sale.items.map((item) => `- ${item.nomi}${item.shtrix_kod ? ` [${item.shtrix_kod}]` : ''} (${item.quantity}x): ${(item.narx * item.quantity).toLocaleString()} so'm`).join('\n')}
      💰 Jami: ${sale.total.toLocaleString()} so'm
      📉 Chegirma: ${sale.discount}%
      📝 Eslatma: ${sale.note || 'Yo\'q'}
    `;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      );
      if (!response.ok) throw new Error('Telegram API xatosi');
      alert("Sotuv muvaffaqiyatli yakunlandi va Telegramga yuborildi!");
    } catch (error) {
      console.error('Telegramga yuborishda xato:', error);
      alert("Telegramga xabar yuborishda xatolik yuz berdi!");
    }
  };

  // Complete sale with Telegram integration
  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Savat bo'sh! Avval mahsulot qo'shing.");
      return;
    }

    const sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customer,
      items: cart,
      total: calculateTotal(),
      paymentMethod,
      discount,
      note,
      status: 'completed',
    };

    // Save sale to localStorage
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    localStorage.setItem('sales', JSON.stringify([...sales, sale]));

    // Update product stock
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id);
      if (cartItem) {
        return { ...product, soni: product.soni - cartItem.quantity };
      }
      return product;
    });

    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    // Send sale details to Telegram
    await sendToTelegram(sale);

    // Reset state
    setCart([]);
    setCustomer('');
    setDiscount(0);
    setNote('');
  };

  // Filter products by search term
  const filteredProducts = products.filter(
    (product) =>
      product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.shtrix_kod && product.shtrix_kod.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="cashier-header">
          <h2>Kassir</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Nomi, kodi yoki shtrix-kod bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovarlar menyusi</button>
          <button onClick={() => navigate('/orders')}>Sotuv statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Tovar qo'shish</button>
          <button className="active">Kassir</button>
        </div>

        <div className="cashier-container">
          <div className="product-selection">
            <div className="products-header">
              <h3>Tovarlar ({filteredProducts.length})</h3>
              <button
                className="scan-barcode-btn"
                onClick={() => setShowScanner(true)}
              >
                <i className="fas fa-barcode"></i> Shtrix-kodni skanerlash
              </button>
            </div>
            {showScanner && (
              <div className="scanner-modal">
                <div className="scanner-content">
                  <h3>Shtrix-kodni skanerlash</h3>
                  <video ref={videoRef} style={{ width: '100%' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button
                    className="close-scanner-btn"
                    onClick={() => setShowScanner(false)}
                  >
                    Yopish
                  </button>
                </div>
              </div>
            )}
            {filteredProducts.length === 0 ? (
              <p className="no-products">Tovarlar topilmadi</p>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`product-card ${product.soni <= 0 ? 'disabled' : ''}`}
                  >
                    {product.rasm && (
                      <img
                        src={product.rasm}
                        alt={product.nomi}
                        className="product-image"
                      />
                    )}
                    <div className="product-info">
                      <h4>{product.nomi}</h4>
                      <p className="price">{product.narx.toLocaleString()} so'm</p>
                      <p className="stock">Omborda: {product.soni}</p>
                      {product.shtrix_kod && <p className="barcode">Shtrix-kod: {product.shtrix_kod}</p>}
                      <div className="product-quantity-control">
                        <button
                          onClick={() => updateProductQuantity(product.id, (productQuantities[product.id] || 1) - 1)}
                          disabled={product.soni <= 0}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={productQuantities[product.id] || 1}
                          onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value, 10) || 1)}
                          min="1"
                          max={product.soni}
                          disabled={product.soni <= 0}
                        />
                        <button
                          onClick={() => updateProductQuantity(product.id, (productQuantities[product.id] || 1) + 1)}
                          disabled={product.soni <= 0}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="add-to-cart-btn"
                        onClick={() => addToCart(product)}
                        disabled={product.soni <= 0}
                      >
                        Savatga qo'shish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cart-section">
            <div className="cart-header">
              <h3>Savat ({cart.reduce((sum, item) => sum + item.quantity, 0)} ta mahsulot)</h3>
              <button
                className="clear-cart-btn"
                onClick={clearCart}
                disabled={!cart.length}
              >
                Savatni tozalash
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <i className="fas fa-shopping-cart"></i>
                  <p>Savat bo'sh. Mahsulot qo'shing yoki shtrix-kodni skanerlang.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>
                        {item.nomi} {item.shtrix_kod && `[${item.shtrix_kod}]`}
                      </h4>
                      <p>{item.narx.toLocaleString()} so'm</p>
                    </div>
                    <div className="item-quantity">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                        min="1"
                        max={products.find((p) => p.id === item.id)?.soni}
                      />
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
              )}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Jami:</span>
                <span>{cart.reduce((sum, item) => sum + item.narx * item.quantity, 0).toLocaleString()} so'm</span>
              </div>
              <div className="summary-row">
                <label>Chegirma (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="summary-row total">
                <span>Yakuniy jami:</span>
                <span>{calculateTotal().toLocaleString()} so'm</span>
              </div>
            </div>

            <div className="customer-info">
              <label>
                Mijoz ismi:
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Mijoz ismi (ixtiyoriy)"
                />
              </label>
              <label>
                To'lov usuli:
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </label>
              <label>
                Eslatma:
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qo'shimcha eslatmalar (ixtiyoriy)"
                />
              </label>
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