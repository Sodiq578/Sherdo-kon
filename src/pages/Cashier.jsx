import React, { useState, useEffect, useRef } from 'react';
import './Cashier.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

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
    // Cleanup on unmount
    return () => stopScanner();
  }, [showScanner]);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
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
      alert('Failed to access camera. Please check permissions.');
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
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
        
        // Simple barcode detection (replace with proper jsQR implementation)
        // This is a simplified version - in production, use the actual jsQR library
        const code = detectSimpleBarcode(imageData);
        
        if (code) {
          const product = products.find(p => p.shtrix_kod === code);
          if (product) {
            if (product.soni <= 0) {
              alert('Product is out of stock!');
            } else {
              addToCart(product);
            }
            setShowScanner(false);
            stopScanner();
          } else {
            alert('Barcode not found in products!');
          }
        }
      }
      if (showScanner) {
        requestAnimationFrame(scan);
      }
    };
    requestAnimationFrame(scan);
  };

  // Simple barcode detection simulation
  const detectSimpleBarcode = (imageData) => {
    // In a real app, this would be replaced with jsQR library
    // This is just a placeholder to simulate detection
    return '123456789'; // Return a sample barcode
  };

  // Update quantity for a specific product before adding to cart
  const updateProductQuantity = (productId, newQuantity) => {
    const product = products.find((p) => p.id === productId);
    if (newQuantity < 1) {
      setProductQuantities((prev) => ({ ...prev, [productId]: 1 }));
      return;
    }
    if (newQuantity > product.soni) {
      alert(`Only ${product.soni} ${product.nomi} available in stock!`);
      setProductQuantities((prev) => ({ ...prev, [productId]: product.soni }));
      return;
    }
    setProductQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
  };

  // Add product to cart with specified quantity
  const addToCart = (product) => {
    const quantity = productQuantities[product.id] || 1;
    if (product.soni <= 0) {
      alert('Product is out of stock!');
      return;
    }
    if (quantity > product.soni) {
      alert(`Only ${product.soni} ${product.nomi} available in stock!`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.soni) {
        alert(`Only ${product.soni} ${product.nomi} available in stock!`);
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
      alert(`Only ${product.soni} ${product.nomi} available in stock!`);
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
    alert('Cart cleared!');
  };

  // Calculate total with discount
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.narx * item.quantity, 0);
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  // Send sale details to Telegram
  const sendToTelegram = async (sale) => {
    const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
    const CHAT_ID = 'YOUR_CHAT_ID';
    const message = `
      🧾 *New Sale #${sale.id}*
      📅 Date: ${new Date(sale.date).toLocaleString()}
      👤 Customer: ${sale.customer || 'Unknown'}
      💸 Payment Method: ${paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : 'Transfer'}
      🛒 Products:
      ${sale.items.map((item) => `- ${item.nomi}${item.shtrix_kod ? ` [${item.shtrix_kod}]` : ''} (${item.quantity}x): ${(item.narx * item.quantity).toLocaleString()} UZS`).join('\n')}
      💰 Total: ${sale.total.toLocaleString()} UZS
      📉 Discount: ${sale.discount}%
      📝 Note: ${sale.note || 'None'}
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
      if (!response.ok) throw new Error('Telegram API error');
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      alert('Failed to send message to Telegram!');
    }
  };

  // Complete sale with Telegram integration
  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty! Add products first.");
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
    alert('Sale completed successfully and sent to Telegram!');
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
          <h2>Cashier</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, code or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Product Menu</button>
          <button onClick={() => navigate('/orders')}>Sales Statistics</button>
          <button onClick={() => navigate('/add-product')}>Add Product</button>
          <button className="active">Cashier</button>
        </div>

        <div className="cashier-container">
          <div className="product-selection">
            <div className="products-header">
              <h3>Products ({filteredProducts.length})</h3>
              <button
                className="scan-barcode-btn"
                onClick={() => setShowScanner(true)}
              >
                <i className="fas fa-barcode"></i> Scan Barcode
              </button>
            </div>
            {showScanner && (
              <div className="scanner-modal">
                <div className="scanner-content">
                  <h3>Barcode Scanner</h3>
                  <video ref={videoRef} style={{ width: '100%' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <button
                    className="close-scanner-btn"
                    onClick={() => setShowScanner(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            {filteredProducts.length === 0 ? (
              <p className="no-products">No products found</p>
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
                      <p className="price">{product.narx.toLocaleString()} UZS</p>
                      <p className="stock">Stock: {product.soni}</p>
                      {product.shtrix_kod && <p className="barcode">Barcode: {product.shtrix_kod}</p>}
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
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

         // Savat bo'limi
<div className="cart-section">
  {/* Savat sarlavhasi va tozalash tugmasi */}
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

  {/* Savatdagi mahsulotlar ro'yxati */}
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

  {/* Savat jami va chegirma */}
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

  {/* Mijoz ma'lumotlari */}
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

  {/* Savatni yakunlash tugmasi */}
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