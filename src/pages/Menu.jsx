import React, { useState, useEffect } from 'react';
import './Menu.css';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts.map(p => ({ ...p, quantity: 0 })));
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);
  }, []);

  const updateQuantity = (id, change) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const newQuantity = Math.max(0, p.quantity + change);
        
        // Automatically add to cart if quantity increased
        if (change > 0) {
          addToCart({ ...p, quantity: 1 });
        }
        
        return { ...p, quantity: newQuantity };
      }
      return p;
    }));
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + product.quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...product }]);
    }
    
    setProducts(products.map(p => 
      p.id === product.id ? { ...p, quantity: 0 } : p
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + (item.narx * item.quantity), 0);

  const handleSell = () => {
    if (cart.length === 0) {
      alert('Savat bo\'sh!');
      return;
    }
    
    const order = {
      id: Date.now().toString(),
      receiptNo: Math.floor(1000 + Math.random() * 9000),
      customer: customerInfo || "Noma'lum mijoz",
      items: cart,
      total,
      date: new Date().toISOString(),
      status: 'completed'
    };
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    localStorage.setItem('orders', JSON.stringify([...orders, order]));
    
    setLastOrder(order);
    setShowReceiptOptions(true);
  };

  const printReceipt = () => {
    if (!lastOrder) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Chek #${lastOrder.receiptNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt { width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 15px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { margin-top: 15px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>Sherbek do'kon</h2>
              <p>Chek raqami: #${lastOrder.receiptNo}</p>
              <p>Sana: ${new Date(lastOrder.date).toLocaleString()}</p>
              ${lastOrder.customer !== "Noma'lum mijoz" ? `<p>Mijoz: ${lastOrder.customer}</p>` : ''}
            </div>
            ${lastOrder.items.map(item => `
              <div class="item">
                <span>${item.nomi} (${item.quantity} x ${item.narx.toLocaleString()})</span>
                <span>${(item.quantity * item.narx).toLocaleString()} UZS</span>
              </div>
            `).join('')}
            <div class="item total">
              <span>Jami:</span>
              <span>${lastOrder.total.toLocaleString()} UZS</span>
            </div>
            <div class="footer">
              <p>Rahmat!</p>
              <p>Qaytib kelishingizni kutamiz</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const finishOrder = () => {
    setCart([]);
    setCustomerInfo('');
    setShowReceiptOptions(false);
    setLastOrder(null);
  };

  if (!user) {
    return (
      <div className="login-required">
        <div className="login-message">
          <h3>Kirish talab etiladi</h3>
          <p>Iltimos, tizimga kiring yoki ro'yxatdan o'ting</p>
          <button onClick={() => navigate('/')}>Kirish sahifasi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="menu-header">
          <h2>Salom, {user.ism}! Asosiy sahifa</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Mahsulotlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>
        <div className="tabs">
          <button className="active">Tovar jadavali</button>
          <button onClick={() => navigate('/orders')}>Savdo statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Tovar qo'shish</button>
        </div>
        
        <div className="menu-content">
          <div className="products-section">
            <h3>Mahsulotlar ({filteredProducts.length})</h3>
            {filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onIncrease={(id) => updateQuantity(id, 1)}
                    onDecrease={(id) => updateQuantity(id, -1)}
                    onClick={() => {
                      if (product.quantity === 0) {
                        updateQuantity(product.id, 1);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>Mahsulotlar topilmadi</p>
                <button onClick={() => navigate('/add-product')}>
                  Yangi mahsulot qo'shish
                </button>
              </div>
            )}
          </div>
          
          <div className="cart-section">
            <div className="cart-header">
              <h3>Sotuv</h3>
              {lastOrder && <p>Chek raqami: #{lastOrder.receiptNo}</p>}
            </div>
            
            <div className="customer-info">
              <input
                type="text"
                placeholder="Mijoz ismi (ixtiyoriy)"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
              />
            </div>
            
            <div className="cart-items">
              {cart.length > 0 ? (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <span className="item-name">{item.nomi}</span>
                        <span className="item-quantity">{item.quantity} x {item.narx.toLocaleString()}</span>
                      </div>
                      <div className="item-total">
                        {(item.quantity * item.narx).toLocaleString()} UZS
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="remove-item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="cart-total">
                    <span>Jami:</span>
                    <span>{total.toLocaleString()} UZS</span>
                  </div>
                </>
              ) : (
                <div className="empty-cart">
                  <p>Savat bo'sh</p>
                  <p>Mahsulotlarni savatga qo'shish uchun mahsulot ustiga bosing</p>
                </div>
              )}
            </div>
            
            <div className="cart-actions">
              {!showReceiptOptions ? (
                <>
                  <button
                    onClick={() => setCart([])}
                    className="clear-cart-btn"
                    disabled={cart.length === 0}
                  >
                    Savatni tozalash
                  </button>
                  <button
                    onClick={handleSell}
                    className="place-order-btn"
                    disabled={cart.length === 0}
                  >
                    Sotish
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={printReceipt}
                    className="print-receipt-btn"
                  >
                    Chek chop etish
                  </button>
                  <button
                    onClick={finishOrder}
                    className="finish-order-btn"
                  >
                    Tugatish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;