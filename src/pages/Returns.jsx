import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Returns.css';
import Sidebar from '../components/Sidebar';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedReturns = JSON.parse(localStorage.getItem('returns')) || [];
    const storedSales = JSON.parse(localStorage.getItem('sales')) || [];
    setReturns(storedReturns);
    setSales(storedSales);
  }, []);

  const processReturn = () => {
    if (!selectedSale || returnItems.length === 0) {
      alert('Iltimos, qaytariladigan mahsulotlarni tanlang!');
      return;
    }

    const newReturn = {
      id: Date.now().toString(),
      saleId: selectedSale.id,
      date: new Date().toISOString(),
      items: returnItems,
      reason,
      total: returnItems.reduce((sum, item) => sum + (item.narx * item.quantity), 0)
    };

    // Save return
    localStorage.setItem('returns', JSON.stringify([...returns, newReturn]));

    // Update product quantities
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const updatedProducts = products.map(product => {
      const returnItem = returnItems.find(item => item.id === product.id);
      if (returnItem) {
        return { ...product, soni: product.soni + returnItem.quantity };
      }
      return product;
    });

    localStorage.setItem('products', JSON.stringify(updatedProducts));

    alert('Mahsulot muvaffaqiyatli qaytarildi!');
    setSelectedSale(null);
    setReturnItems([]);
    setReason('');
    setReturns([...returns, newReturn]);
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="returns-header">
          <h2>Qaytarilgan mahsulotlar</h2>
        </div>
        
        <div className="returns-container">
          <div className="new-return">
            <h3>Yangi qaytarish</h3>
            
            <div className="form-group">
              <label>Sotuvni tanlang</label>
              <select
                value={selectedSale?.id || ''}
                onChange={(e) => {
                  const sale = sales.find(s => s.id === e.target.value);
                  setSelectedSale(sale);
                  setReturnItems([]);
                }}
              >
                <option value="">Sotuvni tanlang</option>
                {sales.map(sale => (
                  <option key={sale.id} value={sale.id}>
                    #{sale.id.slice(-6)} - {new Date(sale.date).toLocaleString()} - {sale.total.toLocaleString()} UZS
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSale && (
              <>
                <div className="form-group">
                  <label>Qaytariladigan mahsulotlar</label>
                  <div className="return-items">
                    {selectedSale.items.map(item => {
                      const existingReturn = returnItems.find(ri => ri.id === item.id);
                      const maxQuantity = item.quantity - (existingReturn?.quantity || 0);
                      
                      return (
                        <div key={item.id} className="return-item">
                          <div className="item-info">
                            <h4>{item.nomi}</h4>
                            <p>{item.narx.toLocaleString()} UZS</p>
                            <p>Maksimal: {maxQuantity} ta</p>
                          </div>
                          <div className="item-quantity">
                            <input
                              type="number"
                              min="0"
                              max={maxQuantity}
                              value={existingReturn?.quantity || 0}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 0;
                                if (quantity > 0) {
                                  const existingIndex = returnItems.findIndex(ri => ri.id === item.id);
                                  if (existingIndex >= 0) {
                                    const updated = [...returnItems];
                                    updated[existingIndex].quantity = quantity;
                                    setReturnItems(updated);
                                  } else {
                                    setReturnItems([...returnItems, { ...item, quantity }]);
                                  }
                                } else {
                                  setReturnItems(returnItems.filter(ri => ri.id !== item.id));
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Sabab</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Qaytarish sababi..."
                  />
                </div>
                
                <button 
                  className="process-return-btn"
                  onClick={processReturn}
                  disabled={returnItems.length === 0}
                >
                  Qaytarishni tasdiqlash
                </button>
              </>
            )}
          </div>
          
          <div className="returns-history">
            <h3>Qaytarishlar tarixi</h3>
            {returns.length > 0 ? (
              <table className="returns-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sana</th>
                    <th>Sotuv ID</th>
                    <th>Mahsulotlar</th>
                    <th>Jami</th>
                    <th>Sabab</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(ret => (
                    <tr key={ret.id}>
                      <td>#{ret.id.slice(-6)}</td>
                      <td>{new Date(ret.date).toLocaleString()}</td>
                      <td>#{ret.saleId.slice(-6)}</td>
                      <td>{ret.items.length} ta</td>
                      <td>{ret.total.toLocaleString()} UZS</td>
                      <td>{ret.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-returns">
                <p>Qaytarilgan mahsulotlar yo'q</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Returns;
