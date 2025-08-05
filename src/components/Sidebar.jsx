import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navItems = [
    { section: null, path: '/menu', icon: 'fas fa-home', label: 'Asosiy sahifa' },
    {
      section: 'Ombor boshqaruvi',
      items: [
        { path: '/menu', icon: 'fas fa-boxes', label: 'Tovar jadavali' },
        { path: '/add-product', icon: 'fas fa-plus-circle', label: "Tovar qo'shish" },
      ],
    },
    {
      section: "Sotuv bo'limi",
      items: [
        { path: '/cashier', icon: 'fas fa-cash-register', label: 'Kassa' },
        { path: '/sales', icon: 'fas fa-shopping-cart', label: 'Sotuvlar' },
        { path: '/returns', icon: 'fas fa-exchange-alt', label: 'Qaytarilganlar' },
      ],
    },
    {
      section: 'Hisobotlar',
      items: [
        { path: '/orders', icon: 'fas fa-chart-line', label: 'Savdo statistikasi' },
        { path: '/stats', icon: 'fas fa-file-invoice-dollar', label: 'Kunlik hisobot' },
      ],
    },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path) => {
    try {
      navigate(path);
      if (isMobile) setIsOpen(false);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
    if (isMobile) setIsOpen(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!localStorage.getItem('currentUser')) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <>
      {isMobile && (
        <button
          className={`burger-menu ${isOpen ? 'open' : ''}`}
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}

      <nav className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`} aria-label="Main navigation">
        <div className="logo">
          <img src="/path/to/logo.png" alt="Savdo Tizimi Logo" />
          <span>Savdo Tizimi</span>
        </div>
        <ul className="nav-menu">
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.section && <li className="nav-section-title">{item.section}</li>}
              {(item.items || [item]).map(({ path, icon, label }, idx) => (
                <li
                  key={`${index}-${idx}`}
                  className={`nav-item ${location.pathname === path ? 'active' : ''}`}
                  onClick={() => handleNavigation(path)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigation(path)}
                  tabIndex={0}
                  role="button"
                  aria-label={label}
                >
                  <i className={icon}></i>
                  <span>{label}</span>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
        <div className="sidebar-footer">
          <p>© {new Date().getFullYear()} Savdo Tizimi</p>
          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            <i className="fas fa-sign-out-alt"></i>
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </nav>

      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} aria-hidden="true"></div>
      )}
    </>
  );
};

export default Sidebar;