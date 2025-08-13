import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaFilter, FaSearch, FaCalendarAlt, FaMoneyBillWave, FaUndo, FaTimes, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Sidebar from '../components/Sidebar';
import './Sales.css';

// Sales komponenti: Sotuvlar tarixini ko'rsatadi va filtr, saralash, sahifalash va modal oynani boshqaradi
const Sales = () => {
  // Holatlar (states)
  const [sales, setSales] = useState([]); // Sotuvlar ro'yxati
  const [filterDate, setFilterDate] = useState(''); // Sana bo'yicha filtr
  const [searchTerm, setSearchTerm] = useState(''); // Qidiruv so'zi
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(''); // To'lov usuli bo'yicha filtr
  const [sortBy, setSortBy] = useState('date'); // Saralash mezonlari (sana, jami, mijoz)
  const [sortOrder, setSortOrder] = useState('desc'); // Saralash tartibi (kamayish/osish)
  const [currentPage, setCurrentPage] = useState(1); // Joriy sahifa
  const [loading, setLoading] = useState(true); // Yuklanish holati
  const [error, setError] = useState(null); // Xatolik xabari
  const [selectedSale, setSelectedSale] = useState(null); // Modal uchun tanlangan sotuv
  const itemsPerPage = 10; // Har bir sahifadagi yozuvlar soni
  const navigate = useNavigate(); // Sahifalar o'rtasida navigatsiya uchun

  // Komponent yuklanganda localStorage dan ma'lumotlarni olish
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

  // Sana formatlash funksiyasi
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Agar sana bo'lmasa
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sotuvlarni filtr va saralash
  const filteredSales = sales
    .filter((sale) => {
      const matchesDate = filterDate
        ? new Date(sale.date).toDateString() === new Date(filterDate).toDateString()
        : true;
      const matchesSearch = searchTerm
        ? (sale.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchesPayment = paymentMethodFilter
        ? sale.paymentMethod === paymentMethodFilter
        : true;
      return matchesDate && matchesSearch && matchesPayment;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date || 0) - new Date(b.date || 0));
      } else if (sortBy === 'total') {
        return multiplier * ((a.total || 0) - (b.total || 0));
      } else if (sortBy === 'customer') {
        return multiplier * ((a.customer || 'N/A').localeCompare(b.customer || 'N/A'));
      }
      return 0;
    });

  // Sahifalash uchun umumiy sahifalar soni va ko'rsatiladigan yozuvlar
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Sahifa o'zgartirish funksiyasi
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Sotuv tafsilotlarini modalda ko'rsatish
  const viewSaleDetails = (saleId) => {
    const sale = sales.find((s) => s.id === saleId);
    setSelectedSale(sale);
  };

  // Modalni yopish
  const closeModal = () => {
    setSelectedSale(null);
  };

  // To'lov usulini formatlash
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Naqd';
      case 'card': return 'Karta';
      case 'transfer': return "O'tkazma";
      default: return method || 'N/A';
    }
  };

  

  // Excel yuklab olish funksiyasi (edit qilish mumkin)
  const downloadExcel = () => {
    const data = filteredSales.map(sale => ({
      ID: sale.id || 'N/A',
      Sana: formatDate(sale.date),
      Mijoz: sale.customer || 'N/A',
      'Mahsulotlar soni': sale.items?.length || 0,
      Jami: sale.total || 0,
      "To'lov": getPaymentMethodLabel(sale.paymentMethod)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sotuvlar');
    XLSX.writeFile(wb, 'sotuvlar_tarixi.xlsx');
  };

  return (
    <div className="sales-page">
      <Sidebar />
      <div className="sales-content">
        <div className="sales-header">
          <h2 className="sales-title">
            <FaMoneyBillWave className="title-icon" />
            Sotuvlar tarixi
          </h2>
          <div className="sales-filters">
            <div className="filter-group">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Mijoz yoki ID bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="date-input-container">
                <FaCalendarAlt className="date-icon" />
                <input
                  type="date"
                  className="date-input"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              
              <div className="select-container">
                <FaFilter className="filter-icon" />
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
              </div>
              
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
                <FaUndo className="reset-icon" />
                Tozalash
              </button>
            </div>
          </div>
        </div>

        <div className="sales-table-container">
          {loading ? (
            <div className="loading-message">
              <div className="spinner"></div>
              Yuklanmoqda...
            </div>
          ) : error ? (
            <div className="error-message">
              <div className="error-icon">!</div>
              {error}
            </div>
          ) : paginatedSales.length > 0 ? (
            <>
              <div className="sort-controls">
                <label htmlFor="sortBy">
                  <FaFilter className="sort-icon" />
                  Saralash:
                </label>
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
                      <th>Harakatlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.map((sale) => (
                      <tr key={sale.id || Math.random()}>
                        <td>#{sale.id ? sale.id.slice(-6) : 'N/A'}</td>
                        <td>{formatDate(sale.date)}</td>
                        <td>{sale.customer || 'Mijoz kiritilmagan'}</td>
                        <td>{sale.items?.length || 0} ta</td>
                        <td>{sale.total ? sale.total.toLocaleString('uz-UZ') : 'N/A'} UZS</td>
                        <td className={`sale-payment ${sale.paymentMethod || ''}`}>
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </td>
                        <td>
                          <button
                            className="view-button"
                            onClick={() => viewSaleDetails(sale.id)}
                            data-tooltip="Sotuv tafsilotlari"
                          >
                            <FaEye />
                            Ko'rish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="pagination-container">
                <div className="total-info">
                  Jami: {filteredSales.length} ta yozuv
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    Birinchi
                  </button>
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
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Oxirgi
                  </button>
                </div>
                {/* Yuklab olish tugmalari */}
                <div className="download-buttons">
                  
                  <button className="download-button excel" onClick={downloadExcel}>
                    <FaFileExcel /> Excel yuklab olish
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">😕</div>
              <p>
                {filterDate || searchTerm || paymentMethodFilter
                  ? "Tanlangan filtrlar bo'yicha sotuvlar topilmadi"
                  : 'Sotuvlar topilmadi'}
              </p>
              <button
                className="refresh-button"
                onClick={() => window.location.reload()}
              >
                Yangilash
              </button>
            </div>
          )}
        </div>

        {/* Modal oynasi */}
        {selectedSale && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
              <h3 className="modal-title">Sotuv Tafsilotlari - #{selectedSale.id ? selectedSale.id.slice(-6) : 'N/A'}</h3>
              <div className="modal-body">
                <p><strong>Sana:</strong> {formatDate(selectedSale.date)}</p>
                <p><strong>Mijoz:</strong> {selectedSale.customer || 'Mijoz kiritilmagan'}</p>
                <p><strong>To'lov usuli:</strong> {getPaymentMethodLabel(selectedSale.paymentMethod)}</p>
                <p><strong>Jami:</strong> {selectedSale.total ? selectedSale.total.toLocaleString('uz-UZ') : 'N/A'} UZS</p>
                <h4>Mahsulotlar:</h4>
                <ul className="modal-items">
                  {selectedSale.items && selectedSale.items.length > 0 ? (
                    selectedSale.items.map((item, index) => (
                      <li key={index}>
                        {item.name || 'Nomalum mahsulot'} - {item.quantity || 0} ta, 
                        Narxi: {item.price ? item.price.toLocaleString('uz-UZ') : 'N/A'} UZS
                      </li>
                    ))
                  ) : (
                    <p>Mahsulotlar mavjud emas</p>
                  )}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="modal-button secondary" onClick={closeModal}>
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;