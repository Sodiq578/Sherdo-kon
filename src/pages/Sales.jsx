import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sales.css';
import Sidebar from '../components/Sidebar';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedSales = JSON.parse(localStorage.getItem('sales')) || [];
    setSales(storedSales);
  }, []);

  const filteredSales = filterDate
    ? sales.filter(sale => new Date(sale.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString())
    : sales;

  const viewSaleDetails = (saleId) => {
    navigate(`/sales/${saleId}`);
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="sales-header">
          <h2>Sotuvlar tarixi</h2>
          <div className="sales-filter">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button onClick={() => setFilterDate('')}>Tozalash</button>
          </div>
        </div>
        
        <div className="sales-container">
          {filteredSales.length > 0 ? (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sana</th>
                  <th>Mijoz</th>
                  <th>Mahsulotlar</th>
                  <th>Jami</th>
                  <th>To'lov</th>
                  <th>Harakatlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>#{sale.id.slice(-6)}</td>
                    <td>{new Date(sale.date).toLocaleString()}</td>
                    <td>{sale.customer || 'N/A'}</td>
                    <td>{sale.items.length} ta</td>
                    <td>{sale.total.toLocaleString()} UZS</td>
                    <td>{sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => viewSaleDetails(sale.id)}
                      >
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-sales">
              <p>Sotuvlar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;