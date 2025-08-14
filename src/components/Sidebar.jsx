 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiCube, 
  HiPlusCircle, 
  HiShoppingCart, 
  HiReceiptRefund,
  HiCreditCard,
  HiChartBar,
  HiDocumentReport,
  HiOutlineLogout,
  HiPhone
} from 'react-icons/hi';
import { FiMenu, FiX } from 'react-icons/fi';
import './Sidebar.css';
import logo from '../logo.png'; // Logo import

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navItems = [
    { section: null, path: '/menu', icon: <HiHome size={20} />, label: 'Asosiy sahifa' },
    {
      section: 'Ombor boshqaruvi',
      items: [
        { path: '/menu', icon: <HiCube size={20} />, label: 'Tovar jadvali' },
        { path: '/add-product', icon: <HiPlusCircle size={20} />, label: "Tovar qo'shish" },
      ],
    },
    {
      section: "Sotuv bo'limi",
      items: [
        { path: '/cashier', icon: <HiShoppingCart size={20} />, label: 'Kassa', highlight: true },
       
        { path: '/returns', icon: <HiReceiptRefund size={20} />, label: 'Qaytarilganlar' },
        { path: '/debts', icon: <HiDocumentReport size={20} />, label: 'Qarzlar' },
      ],
    },
    {
      section: 'Hisobotlar',
      items: [
        { path: '/sales', icon: <HiCreditCard size={20} />, label: 'Sotuvlar' },
        { path: '/stats', icon: <HiDocumentReport size={20} />, label: 'Kunlik hisobot' },
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
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMobile && isOpen) ? 'hidden' : 'auto';
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
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      <nav 
        className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`} 
        aria-label="Main navigation"
      >
        <div className="logo">
          <img src={logo} alt="Savdo Tizimi Logo" />
          <span>Savdo Tizimi</span>
        </div>
        <ul className="nav-menu">
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.section && (
                <li className="nav-section-title">
                  {item.section}
                </li>
              )}
              {(item.items || [item]).map((navItem, idx) => (
                <li
                  key={`${index}-${idx}`}
                  className={`nav-item ${location.pathname === navItem.path ? 'active' : ''} ${navItem.highlight ? 'highlight' : ''}`}
                  onClick={() => handleNavigation(navItem.path)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigation(navItem.path)}
                  tabIndex={0}
                  role="button"
                  aria-label={navItem.label}
                >
                  <span className="nav-icon">{navItem.icon}</span>
                  <span className="nav-label">{navItem.label}</span>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={handleLogout} 
            aria-label="Log out"
          >
            <HiOutlineLogout size={20} />
            <span>Tizimdan chiqish</span>
          </button>
          <p className="support-contact">
            <HiPhone size={16} /> Qo'llab-quvvatlash: <a href="tel:+998974634455">97 463-44-55</a>
          </p>
          <p>© {new Date().getFullYear()} Savdo Tizimi</p>
        </div>
      </nav>

      {isMobile && isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar} 
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
