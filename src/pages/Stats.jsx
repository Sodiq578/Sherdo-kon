import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import './Stats.css';

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
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();

  // Ma'lumotlarni yuklash
  useEffect(() => {
    const storedSales = JSON.parse(localStorage.getItem('sales')) || [];
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setSales(storedSales);
    setProducts(storedProducts);
  }, []);

  // Filtrlangan sotuvlar
  const filteredSales = useMemo(() => {
    const now = new Date();
    let fromDate = new Date();

    switch (timeRange) {
      case 'day':
        fromDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        fromDate = new Date(0); // Barcha vaqt
    }

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const matchesTime = saleDate >= fromDate;
      const matchesCategory = categoryFilter === 'all' || 
        sale.items.some(item => item.bolim === categoryFilter);
      return matchesTime && matchesCategory;
    });
  }, [sales, timeRange, categoryFilter]);

  // Sotilgan mahsulotlar statistikasi
  const productStats = useMemo(() => {
    const stats = {};

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!stats[item.id]) {
          stats[item.id] = {
            ...item,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        stats[item.id].totalQuantity += item.quantity;
        stats[item.id].totalRevenue += item.quantity * item.narx;
      });
    });

    return Object.values(stats).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredSales]);

  // Kategoriyalar ro'yxati
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    products.forEach(product => {
      if (product.bolim) uniqueCategories.add(product.bolim);
    });
    return ['all', ...uniqueCategories];
  }, [products]);

  // Diagrammalar uchun ma'lumotlar
  const chartData = {
    topProducts: {
      labels: productStats.slice(0, 5).map(p => p.nomi),
      datasets: [{
        label: 'Sotuvlar soni',
        data: productStats.slice(0, 5).map(p => p.totalQuantity),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderWidth: 1
      }]
    },
    revenueByCategory: {
      labels: categories.filter(c => c !== 'all'),
      datasets: [{
        label: 'Daromad (so\'m)',
        data: categories.filter(c => c !== 'all').map(category => {
          return productStats
            .filter(p => p.bolim === category)
            .reduce((sum, p) => sum + p.totalRevenue, 0);
        }),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    }
  };

  // Umumiy statistikalar
  const totalStats = {
    salesCount: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    totalProducts: productStats.reduce((sum, p) => sum + p.totalQuantity, 0),
    uniqueProducts: productStats.length
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="menu-header">
          <h2 className="stats-title">Sotuv statistikasi</h2>
        </div>
        
        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovar jadvali</button>
          <button className="active">Statistika</button>
          <button onClick={() => navigate('/add-product')}>Tovar qo'shish</button>
        </div>

        {/* Filtrlash paneli */}
        <div className="stats-filters">
          <div className="filter-group">
            <label>Vaqt oralig'i:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="day">Oxirgi 24 soat</option>
              <option value="week">Oxirgi 7 kun</option>
              <option value="month">Oxirgi 30 kun</option>
              <option value="year">Oxirgi 1 yil</option>
              <option value="all">Barcha vaqt</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Kategoriya:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Barcha kategoriyalar' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Umumiy statistikalar */}
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Jami sotuvlar</h4>
            <p>{totalStats.salesCount}</p>
          </div>
          <div className="summary-card">
            <h4>Jami daromad</h4>
            <p>{totalStats.totalRevenue.toLocaleString()} so'm</p>
          </div>
          <div className="summary-card">
            <h4>Sotilgan mahsulotlar</h4>
            <p>{totalStats.totalProducts}</p>
          </div>
          <div className="summary-card">
            <h4>Turli mahsulotlar</h4>
            <p>{totalStats.uniqueProducts}</p>
          </div>
        </div>

        {/* Diagrammalar */}
        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>Eng ko'p sotilgan 5 mahsulot</h3>
            <Pie 
              data={chartData.topProducts} 
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'right' }
                }
              }} 
            />
          </div>
          
          <div className="chart-wrapper">
            <h3>Kategoriyalar bo'yicha daromad</h3>
            <Bar 
              data={chartData.revenueByCategory} 
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => value.toLocaleString() + ' so\'m'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Sotilgan mahsulotlar jadvali */}
        <div className="stats-table">
          <h3>Sotilgan mahsulotlar</h3>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Mahsulot</th>
                <th>Kategoriya</th>
                <th>Sotildi</th>
                <th>Jami summa</th>
              </tr>
            </thead>
            <tbody>
              {productStats.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>{product.nomi}</td>
                  <td>{product.bolim || '-'}</td>
                  <td>{product.totalQuantity} ta</td>
                  <td>{product.totalRevenue.toLocaleString()} so'm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stats;