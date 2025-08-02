import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cashier.css';
import Sidebar from '../components/Sidebar';

const Cashier = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.narx * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    return subtotal - discountAmount;
  };

  const completeSale = () => {
    if (cart.length === 0) {
      alert('Savat bo\'sh! Mahsulot qo\'shing.');
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
      status: 'completed'
    };

    // Save sale to localStorage
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    localStorage.setItem('sales', JSON.stringify([...sales, sale]));

    // Update product quantities
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem) {
        return { ...product, soni: product.soni - cartItem.quantity };
      }
      return product;
    });

    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    // Print receipt (optional)
    printReceipt(sale);

    // Reset form
    setCart([]);
    setCustomer('');
    setDiscount(0);
    setNote('');
    alert('Sotuv muvaffaqiyatli yakunlandi!');
  };

  const printReceipt = (sale) => {
    // This is a basic implementation - you might want to use a proper printing library
    const receiptContent = `
      Savdo #${sale.id}
      Sana: ${new Date(sale.date).toLocaleString()}
      Mijoz: ${sale.customer || 'Noma\'lum'}
      
      Mahsulotlar:
      ${sale.items.map(item => `
        ${item.nomi} - ${item.quantity} x ${item.narx.toLocaleString()} = ${(item.quantity * item.narx).toLocaleString()} UZS
      `).join('')}
      
      Jami: ${sale.total.toLocaleString()} UZS
      Chegirma: ${sale.discount}%
      To'lov usuli: ${sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
      Eslatma: ${sale.note || 'Yo\'q'}
    `;

    console.log('Receipt:', receiptContent);
    // In a real app, you would send this to a printer
  };

  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="cashier-header">
          <h2>Kassa</h2>
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
        
        <div className="cashier-container">
          <div className="product-selection">
            <h3>Mahsulotlar</h3>
            <div className="product-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  {product.rasm && (
                    <img src={product.rasm} alt={product.nomi} className="product-image" />
                  )}
                  <div className="product-info">
                    <h4>{product.nomi}</h4>
                    <p>{product.narx.toLocaleString()} UZS</p>
                    <p>Qoldiq: {product.soni}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="cart-section">
            <div className="cart-header">
              <h3>Savat</h3>
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} ta mahsulot</span>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Savat bo'sh</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <h4>{item.nomi}</h4>
                      <p>{item.narx.toLocaleString()} UZS</p>
                    </div>
                    <div className="item-quantity">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      {(item.narx * item.quantity).toLocaleString()} UZS
                    </div>
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
                <span>{cart.reduce((sum, item) => sum + (item.narx * item.quantity), 0).toLocaleString()} UZS</span>
              </div>
              
              <div className="summary-row">
                <label>Chegirma:</label>
                <div className="discount-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                  <span>%</span>
                </div>
              </div>
              
              <div className="summary-row total">
                <span>To'lanishi kerak:</span>
                <span>{calculateTotal().toLocaleString()} UZS</span>
              </div>
            </div>
            
            <div className="customer-info">
              <div className="form-group">
                <label>Mijoz (ixtiyoriy)</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Mijoz ismi"
                />
              </div>
              
              <div className="form-group">
                <label>To'lov usuli</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Eslatma (ixtiyoriy)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qo'shimcha eslatmalar..."
                />
              </div>
            </div>
            
            <button 
              className="complete-sale-btn"
              onClick={completeSale}
              disabled={cart.length === 0}
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