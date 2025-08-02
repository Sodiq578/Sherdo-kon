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
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('products');
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    setProducts(storedProducts);

    const storedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(storedOrders);
  }, []);

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
    <>
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
          <button className="active">Savdo statistikasi</button>
          <button onClick={() => navigate('/add-product')}>Tovar qo‘shish</button>
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
          </div>

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
        </div>
      </div>
    </>
  );
};

export default Stats;
