import React, { useState, useEffect } from 'react';
import './Menu.css';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import Quagga from 'quagga';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts.map(p => ({ ...p, quantity: 0 })));
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (showScanner) {
      setIsScanning(true);
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: document.querySelector('#scanner-container'),
          constraints: {
            facingMode: 'environment'
          }
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader', 'upc_reader']
        }
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          alert('Skaner ishga tushmadi. Iltimos, qaytadan urinib ko\'ring yoki shtrix kodni qo\'lda kiriting.');
          setShowScanner(false);
          setIsScanning(false);
          return;
        }
        Quagga.start();
        Quagga.onDetected((data) => {
          const barcode = data.codeResult.code;
          const product = products.find(p => p.shtrix === barcode);
          if (product) {
            updateQuantity(product.id, 1);
            alert(`Mahsulot topildi: ${product.nomi}`);
            Quagga.stop();
            setShowScanner(false);
            setIsScanning(false);
          } else {
            alert('Bu shtrix kod bilan mahsulot topilmadi! Yangi mahsulot qo\'shish uchun "Tovar qo\'shish" sahifasiga o\'ting.');
            Quagga.stop();
            setShowScanner(false);
            setIsScanning(false);
          }
        });
      });

      return () => {
        Quagga.stop();
        setIsScanning(false);
      };
    }
  }, [showScanner, products]);

  const updateQuantity = (id, change) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        const newQuantity = Math.max(0, p.quantity + change);
        
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
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shtrix?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="login-required flex justify-center items-center h-screen">
        <div className="login-message text-center">
          <h3 className="text-2xl font-semibold mb-2">Kirish talab etiladi</h3>
          <p className="mb-4">Iltimos, tizimga kiring yoki ro'yxatdan o'ting</p>
          <button onClick={() => navigate('/')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Kirish sahifasi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container container mx-auto p-4">
      <Sidebar />
      <div className="content">
        <div className="menu-header flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Salom, {user.ism}! Asosiy sahifa</h2>
          <div className="search-bar relative flex items-center space-x-2">
            <input
              type="text"
              className="border rounded px-3 py-2 w-64"
              placeholder="Mahsulotlarni qidirish (nomi, kodi, shtrix kodi)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setShowScanner(!showScanner)}
              disabled={isScanning}
            >
              {isScanning ? 'Skanerlanmoqda...' : showScanner ? 'Skanerni yopish' : 'Shtrix kod skanerlash'}
            </button>
          </div>
        </div>
        <div className="tabs flex space-x-2 mb-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Tovar jadavali</button>
          <button onClick={() => navigate('/orders')} className="px-4 py-2 bg-gray-200 rounded">Savdo statistikasi</button>
          <button onClick={() => navigate('/add-product')} className="px-4 py-2 bg-gray-200 rounded">Tovar qo'shish</button>
        </div>
        
        {showScanner && (
          <div id="scanner-container" className="scanner-container mb-4 border border-gray-300">
            <video className="w-full h-auto"></video>
          </div>
        )}
        
        <div className="menu-content flex space-x-4">
          <div className="products-section flex-1">
            <h3 className="text-xl font-semibold mb-4">Mahsulotlar ({filteredProducts.length})</h3>
            {filteredProducts.length > 0 ? (
              <div className="products-grid grid grid-cols-3 gap-4">
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
              <div className="no-products p-4 text-center text-gray-500">
                <p>Mahsulotlar topilmadi</p>
                <button onClick={() => navigate('/add-product')} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2">
                  Yangi mahsulot qo'shish
                </button>
              </div>
            )}
          </div>
          
          <div className="cart-section w-1/3 bg-white p-4 rounded shadow">
            <div className="cart-header">
              <h3 className="text-xl font-semibold">Sotuv</h3>
              {lastOrder && <p>Chek raqami: #{lastOrder.receiptNo}</p>}
            </div>
            
            <div className="customer-info mb-4">
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                placeholder="Mijoz ismi (ixtiyoriy)"
                value={customerInfo}
                onChange={(e) => setCustomerInfo(e.target.value)}
              />
            </div>
            
            <div className="cart-items">
              {cart.length > 0 ? (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="cart-item flex justify-between mb-2">
                      <div className="item-info">
                        <span className="item-name">{item.nomi}</span>
                        <span className="item-quantity block text-sm">{item.quantity} x {item.narx.toLocaleString()}</span>
                      </div>
                      <div className="item-total flex items-center">
                        {(item.quantity * item.narx).toLocaleString()} UZS
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="cart-total flex justify-between font-bold mt-4 pt-2 border-t">
                    <span>Jami:</span>
                    <span>{total.toLocaleString()} UZS</span>
                  </div>
                </>
              ) : (
                <div className="empty-cart p-4 text-center text-gray-500">
                  <p>Savat bo'sh</p>
                  <p>Mahsulotlarni savatga qo'shish uchun mahsulot ustiga bosing yoki shtrix kodni skanerlang</p>
                </div>
              )}
            </div>
            
            <div className="cart-actions flex space-x-2 mt-4">
              {!showReceiptOptions ? (
                <>
                  <button
                    onClick={() => setCart([])}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    disabled={cart.length === 0}
                  >
                    Savatni tozalash
                  </button>
                  <button
                    onClick={handleSell}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    disabled={cart.length === 0}
                  >
                    Sotish
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={printReceipt}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Chek chop etish
                  </button>
                  <button
                    onClick={finishOrder}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
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