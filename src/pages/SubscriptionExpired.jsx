import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SubscriptionExpired.css';

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="subscription-expired">
      <div className="expired-message">
        <h3>Obuna muddati tugadi</h3>
        <p>Iltimos, obunangizni yangilang yoki qayta ro'yxatdan o'ting</p>
        <button onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Chiqish va qayta kirish
        </button>
      </div>
    </div>
  );
};

export default SubscriptionExpired;