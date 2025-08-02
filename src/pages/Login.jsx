import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    ism: '',
    parol: '',
    showPassword: false
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const toggleShowPassword = () => {
    setFormData({
      ...formData,
      showPassword: !formData.showPassword
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (formData.ism && formData.parol) {
      const user = { 
        ism: formData.ism, 
        id: Date.now().toString(),
        role: 'admin'
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/menu');
    } else {
      alert('Iltimos, ism va parolni kiriting!');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Kirish</h1>
            <p>Iltimos ism va parolingizni kiriting</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Ism</label>
              <input
                type="text"
                name="ism"
                value={formData.ism}
                onChange={handleChange}
                placeholder="Juraqulov Abdulbosit"
                required
              />
            </div>
            <div className="form-group">
              <label>Parol</label>
              <div className="password-input">
                <input
                  type={formData.showPassword ? "text" : "password"}
                  name="parol"
                  value={formData.parol}
                  onChange={handleChange}
                  placeholder="Parolingizni kiriting"
                  required
                />
                <span 
                  className="toggle-password"
                  onClick={toggleShowPassword}
                >
                  {formData.showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                </span>
              </div>
            </div>
            <button type="submit" className="login-btn">Kirish</button>
          </form>
        </div>
      </div>
      <div className="login-image-container">
        <img 
          src="https://images.unsplash.com/photo-1660242164955-c6e208b0e43c?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Login background" 
          className="login-image"
        />
      </div>
      
      
    </div>
  );
};

export default Login;