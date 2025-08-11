import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiSearch, 
  FiX, 
  FiChevronDown, 
  FiChevronUp, 
  FiEdit2, 
  FiDollarSign, 
  FiCalendar,
  FiFilter,
  FiTrash2
} from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import './Debts.css';

const Debts = () => {
  const [debts, setDebts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingDebt, setEditingDebt] = useState(null);
  const [expandedDebt, setExpandedDebt] = useState(null);
  const [editForm, setEditForm] = useState({
    customer: '',
    note: '',
    discount: 0,
    total: 0,
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Qarzni yuklash
  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = () => {
    setIsLoading(true);
    try {
      const allSales = JSON.parse(localStorage.getItem('sales')) || [];
      const debtSales = allSales.filter((sale) => sale.paymentMethod === 'debt');
      setDebts(debtSales);
    } catch (error) {
      toast.error('Qarzlarni yuklashda xatolik yuz berdi!');
      console.error('Error loading debts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Umumiy qarz summasi
  const totalDebt = debts.reduce((sum, debt) => sum + debt.total, 0);

  // Qarzni to'lash
  const handlePay = (id) => {
    if (!window.confirm("Bu qarzni to'langan deb belgilamoqchimisiz?")) return;

    try {
      const allSales = JSON.parse(localStorage.getItem('sales')) || [];
      const updatedSales = allSales.map((sale) =>
        sale.id === id ? { ...sale, paymentMethod: 'cash' } : sale
      );
      localStorage.setItem('sales', JSON.stringify(updatedSales));
      setDebts(updatedSales.filter((sale) => sale.paymentMethod === 'debt'));
      setExpandedDebt(null);
      toast.success("Qarz muvaffaqiyatli to'landi!");
    } catch (error) {
      toast.error("Qarzni to'lashda xatolik yuz berdi!");
      console.error('Error paying debt:', error);
    }
  };

  // Qarzni tahrirlashga tayyorlash
  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setEditForm({
      customer: debt.customer,
      note: debt.note,
      discount: debt.discount,
      total: debt.total,
    });
  };

  // Tahrir formidagi o'zgarishlarni olish
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'discount' || name === 'total' ? Number(value) : value,
    }));
  };

  // Qarzni tahrir qilish
  const handleEditSubmit = (e) => {
    e.preventDefault();
    try {
      const allSales = JSON.parse(localStorage.getItem('sales')) || [];
      const updatedSales = allSales.map((sale) =>
        sale.id === editingDebt.id
          ? {
              ...sale,
              customer: editForm.customer,
              note: editForm.note,
              discount: editForm.discount,
              total: editForm.total,
            }
          : sale
      );
      localStorage.setItem('sales', JSON.stringify(updatedSales));
      setDebts(updatedSales.filter((sale) => sale.paymentMethod === 'debt'));
      setEditingDebt(null);
      setExpandedDebt(null);
      toast.success('Qarz muvaffaqiyatli tahrirlandi!');
    } catch (error) {
      toast.error("Qarzni tahrirlashda xatolik yuz berdi!");
      console.error('Error editing debt:', error);
    }
  };

  // Accordion ochish-yopish
  const toggleDebt = (id) => {
    setExpandedDebt(expandedDebt === id ? null : id);
  };

  // Filtrlash va saralash
  const filteredAndSortedDebts = debts
    .filter((debt) => {
      const matchesSearch =
        debt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.note.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate =
        (!dateRange.start || new Date(debt.date) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(debt.date) <= new Date(dateRange.end));
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date) - new Date(b.date));
      }
      if (sortBy === 'amount') {
        return multiplier * (a.total - b.total);
      }
      if (sortBy === 'customer') {
        return multiplier * a.customer.localeCompare(b.customer);
      }
      return 0;
    });

  // Qidiruvni tozalash
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Barcha inputlarni tozalash
  const clearAllInputs = () => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content debts-page">
      <div className="debts-controls">
  {/* Qidiruv va filtr */}
  <div className="controls-row">
    <div className="search-container">
      <FiSearch className="search-icon" />
      <input
        type="text"
        placeholder="Mijoz yoki eslatma bo'yicha qidirish..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      {searchTerm && (
        <button onClick={clearSearch} className="clear-search">
          <FiX />
        </button>
      )}
    </div>
    
    <button onClick={clearAllInputs} className="secondary-btn">
      <FiTrash2 /> Tozalash
    </button>
  </div>
  
  {/* Sana filtr va saralash */}
  <div className="controls-row">
    <div className="date-filter">
      <div className="date-input-group">
        <FiCalendar className="filter-icon" />
        <label>Boshlanish:</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
        />
      </div>
      
      <div className="date-input-group">
        <label>Tugash:</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
        />
      </div>
    </div>
    
    <div className="sort-filter">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="sort-select"
      >
        <option value="date">Sana bo'yicha</option>
        <option value="amount">Summa bo'yicha</option>
        <option value="customer">Mijoz bo'yicha</option>
      </select>
      
      <button 
        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        className="sort-order-btn"
      >
        {sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
      </button>
    </div>
  </div>
</div>

        {/* Umumiy qarz */}
        <div className="debt-summary">
          <div className="summary-card">
            <h3 className="summary-title">Umumiy qarz</h3>
            <p className="summary-amount">{totalDebt.toLocaleString()} so'm</p>
          </div>
        </div>

        {/* Edit Modal */}
        {editingDebt && (
          <div className="edit-modal">
            <div className="edit-modal-content">
              <div className="modal-header">
                <h3>Qarzni tahrirlash</h3>
                <button onClick={() => setEditingDebt(null)} className="close-modal">
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Mijoz</label>
                  <input
                    type="text"
                    name="customer"
                    value={editForm.customer}
                    onChange={handleEditChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Eslatma</label>
                  <textarea
                    name="note"
                    value={editForm.note}
                    onChange={handleEditChange}
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Chegirma (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={editForm.discount}
                      onChange={handleEditChange}
                      className="form-input"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Qarz summasi (so'm)</label>
                    <input
                      type="number"
                      name="total"
                      value={editForm.total}
                      onChange={handleEditChange}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setEditingDebt(null)} className="cancel-btn">
                    Bekor qilish
                  </button>
                  <button type="submit" className="save-btn">
                    Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Qarzdorlar ro'yxati */}
        <div className="debts-list">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : filteredAndSortedDebts.length > 0 ? (
            filteredAndSortedDebts.map((debt) => (
              <div
                key={debt.id}
                className={`debt-item ${expandedDebt === debt.id ? 'expanded' : ''}`}
              >
                <div className="debt-header" onClick={() => toggleDebt(debt.id)}>
                  <div className="debt-info">
                    <span className="debt-date">
                      <FiCalendar className="info-icon" />
                      {new Date(debt.date).toLocaleDateString('uz-UZ')}
                    </span>
                    <span className="debt-customer">
                      {debt.customer || "Noma'lum mijoz"}
                    </span>
                  </div>
                  <div className="debt-amount">
                    {debt.total.toLocaleString()} so'm
                  </div>
                  <span className="accordion-icon">
                    {expandedDebt === debt.id ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </div>
                <div className="debt-details">
                  <div className="details-section">
                    <div className="detail-item">
                      <span className="detail-label">Chegirma:</span>
                      <span className="detail-value">{debt.discount}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Eslatma:</span>
                      <span className="detail-value">{debt.note || 'Mavjud emas'}</span>
                    </div>
                  </div>
                  
                  <div className="items-section">
                    <h4 className="items-title">
                      <span className="title-text">Sotilgan mahsulotlar</span>
                      <span className="items-count">{debt.items.length} ta</span>
                    </h4>
                    <ul className="items-list">
                      {debt.items.map((item) => (
                        <li key={item.id} className="item-row">
                          <span className="item-name">{item.nomi}</span>
                          <span className="item-quantity">x {item.quantity}</span>
                          <span className="item-price">{(item.narx * item.quantity).toLocaleString()} so'm</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="debt-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(debt); }} 
                      className="edit-button"
                    >
                      <FiEdit2 className="action-icon" /> Tahrirlash
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePay(debt.id); }} 
                      className="pay-button"
                    >
                      <FiDollarSign className="action-icon" /> To'lash
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-debts">
              <div className="empty-state">
                <FiDollarSign className="empty-icon" />
                <p>Hech qanday qarz topilmadi</p>
                <small>Yangi qarz qo'shish uchun sotuv qilish bo'limidan foydalaning</small>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Debts;