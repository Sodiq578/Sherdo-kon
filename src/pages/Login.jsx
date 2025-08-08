import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { MdErrorOutline } from 'react-icons/md';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    ism: '',
    parol: '',
    showPassword: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const toggleShowPassword = () => {
    setFormData({
      ...formData,
      showPassword: !formData.showPassword
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.ism.trim() || !formData.parol.trim()) {
      setError('Iltimos, ism va parolni kiriting!');
      setIsLoading(false);
      return;
    }
    
    try {
      // Simulyatsiya qilingan API so'rovi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = { 
        ism: formData.ism.trim(), 
        id: Date.now().toString(),
        role: 'admin'
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/menu');
    } catch (err) {
      setError('Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1><FaSignInAlt className="header-icon" /> Kirish</h1>
            <p>Iltimos ism va parolingizni kiriting</p>
          </div>
          
          {error && (
            <div className="error-message">
              <MdErrorOutline className="error-icon" /> {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="ism">
                <FaUser className="input-icon" /> Ism
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="ism"
                  name="ism"
                  value={formData.ism}
                  onChange={handleChange}
                  placeholder="Ismingizni kiriting"
                  required
                  autoComplete="username"
                  className={error && !formData.ism.trim() ? 'error' : ''}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="parol">
                <FaLock className="input-icon" /> Parol
              </label>
              <div className="input-wrapper password-input">
                <input
                  type={formData.showPassword ? "text" : "password"}
                  id="parol"
                  name="parol"
                  value={formData.parol}
                  onChange={handleChange}
                  placeholder="Parolingizni kiriting"
                  required
                  autoComplete="current-password"
                  className={error && !formData.parol.trim() ? 'error' : ''}
                />
                <span 
                  className="toggle-password"
                  onClick={toggleShowPassword}
                  tabIndex="0"
                  onKeyPress={(e) => e.key === 'Enter' && toggleShowPassword()}
                >
                  {formData.showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="loader"></span> Kuting...
                </span>
              ) : (
                <>
                  <FaSignInAlt className="btn-icon" /> Kirish
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="login-image-container">
        <img 
          src="https://images.unsplash.com/photo-1660242164955-c6e208b0e43c?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Login background" 
          className="login-image"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default Login;