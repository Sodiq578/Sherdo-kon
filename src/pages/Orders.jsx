import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Orders.css';
import Sidebar from '../components/Sidebar';
import OrderRow from '../components/OrderRow';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('today');
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);
    
    const storedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(storedOrders);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.items.some(item => 
      item.nomi.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (timeRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return order.date.includes(today) && matchesSearch;
    }
    
    if (timeRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(order.date) >= oneWeekAgo && matchesSearch;
    }
    
    return matchesSearch;
  });

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = filteredOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const getChartData = () => {
    if (timeRange === 'today') {
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      const salesByHour = hours.map((_, index) => {
        return filteredOrders
          .filter(order => new Date(order.date).getHours() === index)
          .reduce((sum, order) => sum + order.total, 0);
      });
      
      return {
        labels: hours,
        datasets: [{
          label: 'Soatlik savdo (UZS)',
          data: salesByHour,
          backgroundColor: '#10b981',
          borderColor: '#388E3C',
          borderWidth: 1
        }]
      };
    } else {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('uz-UZ', { weekday: 'short' });
      });
      
      const salesByDay = days.map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dateStr = date.toISOString().split('T')[0];
        
        return filteredOrders
          .filter(order => order.date.includes(dateStr))
          .reduce((sum, order) => sum + order.total, 0);
      });
      
      return {
        labels: days,
        datasets: [{
          label: 'Haftalik savdo (UZS)',
          data: salesByDay,
          backgroundColor: '#2196F3',
          borderColor: '#1976D2',
          borderWidth: 1
        }]
      };
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString()} UZS`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value.toLocaleString() + ' UZS'
        }
      }
    }
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="menu-header">
          <h2>Savdo statistikasi</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buyurtmalarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
        </div>
        <div className="tabs">
          <button onClick={() => navigate('/menu')}>Tovar jadavali</button>
          <button className="active">Savdo statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Tovar qo'shish</button>
        </div>
        
        <div className="stats-filters">
          <div className="time-range">
            <button
              className={timeRange === 'today' ? 'active' : ''}
              onClick={() => setTimeRange('today')}
            >
              Bugun
            </button>
            <button
              className={timeRange === 'week' ? 'active' : ''}
              onClick={() => setTimeRange('week')}
            >
              Hafta
            </button>
          </div>
          
          <div className="stats-summary">
            <div className="summary-card">
              <h4>Buyurtmalar soni</h4>
              <p>{filteredOrders.length}</p>
            </div>
            <div className="summary-card">
              <h4>Jami savdo</h4>
              <p>{totalSales.toLocaleString()} UZS</p>
            </div>
            <div className="summary-card">
              <h4>Sotilgan mahsulotlar</h4>
              <p>{totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="stats-content">
          <div className="chart-container">
            <Bar data={getChartData()} options={chartOptions} />
          </div>
          
          <div className="orders-list">
            <h3>So'ngi buyurtmalar</h3>
            {filteredOrders.length > 0 ? (
              <div className="orders-table">
                <div className="table-header">
                  <span>Buyurtma raqami</span>
                  <span>Stol</span>
                  <span>Mahsulotlar</span>
                  <span>Jami</span>
                  <span>Sana</span>
                </div>
                {filteredOrders.slice(0, 10).map(order => (
                  <div key={order.id} className="order-row">
                    <span>#{order.id.slice(-6)}</span>
                    <span>{order.table}-stol</span>
                    <span className="order-items">
                      {order.items.slice(0, 2).map(item => (
                        <span key={item.id}>{item.nomi} ({item.quantity})</span>
                      ))}
                      {order.items.length > 2 && <span>+{order.items.length - 2} ta</span>}
                    </span>
                    <span className="order-total">{order.total.toLocaleString()} UZS</span>
                    <span>{new Date(order.date).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-orders">
                <p>Buyurtmalar topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;