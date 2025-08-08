import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import './Stats.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Stats = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailyReports, setDailyReports] = useState({});
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('products');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);

    const storedOrders = JSON.parse(localStorage.getItem('sales')) || [];
    setOrders(storedOrders);

    const storedReports = JSON.parse(localStorage.getItem('dailyReports')) || {};
    setDailyReports(storedReports);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getTopProducts = () => {
    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.id]) {
          productSales[item.id] += item.quantity;
        } else {
          productSales[item.id] = item.quantity;
        }
      });
    });

    return Object.entries(productSales)
      .map(([id, quantity]) => {
        const product = products.find(p => p.id === id);
        return product ? { ...product, sold: quantity } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  };

  const getSalesData = () => {
    if (timeRange === 'day') {
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      const salesByHour = hours.map((_, index) => {
        return orders
          .filter(order => new Date(order.date).getHours() === index)
          .reduce((sum, order) => sum + order.total, 0);
      });

      return {
        labels: hours,
        datasets: [
          {
            label: 'Soatlik savdo (UZS)',
            data: salesByHour,
            backgroundColor: '#4CAF50',
            borderColor: '#388E3C',
            borderWidth: 1,
          },
        ],
      };
    } else if (timeRange === 'week') {
      const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
      const salesByDay = days.map((_, index) => {
        const today = new Date();
        const targetDay = new Date();
        targetDay.setDate(today.getDate() - today.getDay() + index);
        const dateStr = targetDay.toISOString().split('T')[0];

        return orders
          .filter(order => order.date.includes(dateStr))
          .reduce((sum, order) => sum + order.total, 0);
      });

      return {
        labels: days,
        datasets: [
          {
            label: 'Haftalik savdo (UZS)',
            data: salesByDay,
            backgroundColor: '#2196F3',
            borderColor: '#1976D2',
            borderWidth: 1,
          },
        ],
      };
    } else {
      const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('uz-UZ', { day: 'numeric' });
      });

      const salesByDay = days.map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - index));
        const dateStr = date.toISOString().split('T')[0];
        return orders
          .filter(order => order.date.includes(dateStr))
          .reduce((sum, order) => sum + order.total, 0);
      });

      return {
        labels: days,
        datasets: [
          {
            label: 'Oylik savdo (UZS)',
            data: salesByDay,
            backgroundColor: '#FF9800',
            borderColor: '#F57C00',
            borderWidth: 1,
          },
        ],
      };
    }
  };

  const getTopProductsPieData = () => {
    const topProducts = getTopProducts();
    return {
      labels: topProducts.map(p => p.nomi),
      datasets: [
        {
          data: topProducts.map(p => p.sold),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
          ],
          borderColor: '#fff',
          borderWidth: 1,
        },
      ],
    };
  };

  // Daily Reports Data
  const reportList = Object.keys(dailyReports).map(date => ({
    date,
    ...dailyReports[date],
  }));

  const filteredReports = reportList
    .filter(report => 
      filterDate ? report.date === filterDate : true
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date) - new Date(b.date));
      } else if (sortBy === 'totalAmount') {
        return multiplier * (a.totalAmount - b.totalAmount);
      } else if (sortBy === 'totalItems') {
        return multiplier * (a.totalItems - b.totalItems);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label.includes('savdo')) {
              return `${context.dataset.label}: ${context.raw.toLocaleString()} UZS`;
            }
            return `${context.label}: ${context.raw} dona`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString() + ' UZS',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: context => `${context.label}: ${context.raw} dona`,
        },
      },
    },
  };

  return (
    <div className="stats-page">
      <Sidebar />
      <div className="content">
        <div className="menu-header">
          <h2>Statistika</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Ma'lumotlarni qidirish..."
              onChange={(e) => {
                // Qidiruv funksiyasi keyinchalik qo‘shiladi
              }}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovar jadvali</button>
          <button className={activeTab === 'products' || activeTab === 'sales' || activeTab === 'daily' ? 'active' : ''}>
            Savdo statistikasi
          </button>
          <button onClick={() => navigate('/add-product')}>Tovar qo‘shish</button>
          <button onClick={() => navigate('/cashier')}>Kassir</button>
        </div>

        <div className="stats-controls">
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab('products')}
              className={activeTab === 'products' ? 'active' : ''}
            >
              Top mahsulotlar
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={activeTab === 'sales' ? 'active' : ''}
            >
              Savdo ko‘rsatkichlari
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={activeTab === 'daily' ? 'active' : ''}
            >
              Kunlik hisobotlar
            </button>
          </div>

          {activeTab === 'sales' && (
            <div className="time-range">
              <button
                onClick={() => setTimeRange('day')}
                className={timeRange === 'day' ? 'active' : ''}
              >
                Kun
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={timeRange === 'week' ? 'active' : ''}
              >
                Hafta
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={timeRange === 'month' ? 'active' : ''}
              >
                Oy
              </button>
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="filters">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <button
                onClick={() => setFilterDate('')}
                disabled={!filterDate}
              >
                Tozalash
              </button>
            </div>
          )}
        </div>

        <div className="stats-content">
          {activeTab === 'products' && (
            <div className="chart-container">
              <h3>Eng ko‘p sotilgan mahsulotlar</h3>
              <Pie data={getTopProductsPieData()} options={pieOptions} />
            </div>
          )}
          {activeTab === 'sales' && (
            <div className="chart-container">
              <h3>
                {timeRange === 'day'
                  ? 'Soatlik'
                  : timeRange === 'week'
                  ? 'Haftalik'
                  : 'Oylik'}{' '}
                savdo
              </h3>
              <Bar data={getSalesData()} options={chartOptions} />
            </div>
          )}
          {activeTab === 'daily' && (
            <div className="daily-report-table-container">
              {paginatedReports.length > 0 ? (
                <>
                  <div className="sort-controls">
                    <label>Saralash:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date">Sana</option>
                      <option value="totalAmount">Jami summa</option>
                      <option value="totalItems">Jami mahsulotlar</option>
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
                    <table className="daily-report-table">
                      <thead>
                        <tr>
                          <th>Sana</th>
                          <th>Sotuvlar soni</th>
                          <th>Jami mahsulotlar</th>
                          <th>Jami summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedReports.map((report) => (
                          <tr key={report.date}>
                            <td>{formatDate(report.date)}</td>
                            <td>{report.sales.length}</td>
                            <td>{report.totalItems}</td>
                            <td>{report.totalAmount.toLocaleString('uz-UZ')} UZS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Oldingi
                    </button>
                    <span>{currentPage} / {totalPages}</span>
                    <button
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
                    {filterDate ? "Tanlangan sana bo'yicha hisobot topilmadi" : "Hisobotlar topilmadi"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;