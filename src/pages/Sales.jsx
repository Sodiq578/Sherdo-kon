import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa'; // Ko'rish tugmasi uchun ikonka
import Sidebar from '../components/Sidebar';
import './Sales.css'; // CSS faylini import qilish

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Load sales from localStorage
  useEffect(() => {
    try {
      const storedSales = JSON.parse(localStorage.getItem('sales')) || [];
      setSales(storedSales);
      setLoading(false);
    } catch (err) {
      console.error('Sotuvlarni yuklashda xato:', err);
      setError("Sotuvlar ma'lumotlarini yuklashda xatolik yuz berdi!");
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort sales
  const filteredSales = sales
    .filter((sale) => {
      const matchesDate = filterDate
        ? new Date(sale.date).toDateString() === new Date(filterDate).toDateString()
        : true;
      const matchesSearch = searchTerm
        ? sale.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesPayment = paymentMethodFilter
        ? sale.paymentMethod === paymentMethodFilter
        : true;
      return matchesDate && matchesSearch && matchesPayment;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date) - new Date(b.date));
      } else if (sortBy === 'total') {
        return multiplier * (a.total - b.total);
      } else if (sortBy === 'customer') {
        return multiplier * (a.customer || 'N/A').localeCompare(b.customer || 'N/A');
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const viewSaleDetails = (saleId) => {
    navigate(`/sales/${saleId}`);
  };

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="sales-content">
        <div className="sales-header">
          <h2 className="sales-title">Sotuvlar tarixi</h2>
          <div className="sales-filters">
            <div className="filter-group">
              <input
                type="text"
                className="search-input"
                placeholder="Mijoz yoki ID bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <input
                type="date"
                className="date-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <select
                className="payment-select"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="">Barcha to'lov turlari</option>
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="transfer">O'tkazma</option>
              </select>
              <button
                className="clear-filters"
                onClick={() => {
                  setFilterDate('');
                  setSearchTerm('');
                  setPaymentMethodFilter('');
                  setCurrentPage(1);
                }}
                disabled={!filterDate && !searchTerm && !paymentMethodFilter}
              >
                Tozalash
              </button>
            </div>
          </div>
        </div>

        <div className="sales-table-container">
          {loading ? (
            <div className="loading-message">Yuklanmoqda...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : paginatedSales.length > 0 ? (
            <>
              <div className="sort-controls">
                <label htmlFor="sortBy">Saralash:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Sana</option>
                  <option value="total">Jami</option>
                  <option value="customer">Mijoz</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Kamayish</option>
                  <option value="asc">O'sish</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sana</th>
                      <th>Mijoz</th>
                      <th>Mahsulotlar</th>
                      <th>Jami</th>
                      <th>To'lov</th>
             
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>#{sale.id.slice(-6)}</td>
                        <td>{formatDate(sale.date)}</td>
                        <td>{sale.customer || 'Mijoz kiritilmagan'}</td>
                        <td>{sale.items.length} ta</td>
                        <td>{sale.total.toLocaleString('uz-UZ')} UZS</td>
                        <td className={`sale-payment ${sale.paymentMethod}`}>
                          {sale.paymentMethod === 'cash'
                            ? 'Naqd'
                            : sale.paymentMethod === 'card'
                            ? 'Karta'
                            : 'O\'tkazma'}
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Oldingi
                </button>
                <span className="page-info">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Keyingi
                </button>
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>
                {filterDate || searchTerm || paymentMethodFilter
                  ? "Tanlangan filtrlar bo'yicha sotuvlar topilmadi"
                  : 'Sotuvlar topilmadi'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;