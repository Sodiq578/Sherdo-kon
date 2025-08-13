import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaSignInAlt, FaMoneyBillWave } from 'react-icons/fa';
import { MdErrorOutline, MdPayment } from 'react-icons/md';
import './Login.css'; // Reusing Login.css for consistent styling

const Register = () => {
  const [formData, setFormData] = useState({
    ism: '',
    parol: '',
    showPassword: false,
    subscriptionDuration: '1', // Default to 1 month
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const subscriptionPrices = {
    '1': '50,000 so\'m',
    '2': '90,000 so\'m',
    '6': '250,000 so\'m'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const toggleShowPassword = () => {
    setFormData({
      ...formData,
      showPassword: !formData.showPassword,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.ism.trim() || !formData.parol.trim()) {
      setError('Iltimos, ism va parolni kiriting!');
      setIsLoading(false);
      return;
    }

    try {
      // Simulyatsiya qilingan API so'rovi
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Ro'yxatdan o'tgan foydalanuvchilarni localStorage'dan olish
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Foydalanuvchi allaqachon mavjudligini tekshirish
      if (users.some((u) => u.ism === formData.ism.trim())) {
        setError('Bu ism allaqachon ro\'yxatdan o\'tgan!');
        setIsLoading(false);
        return;
      }

      const startDate = new Date();
      const durationMonths = parseInt(formData.subscriptionDuration);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + durationMonths);

      const newUser = {
        ism: formData.ism.trim(),
        parol: formData.parol.trim(),
        id: Date.now().toString(),
        role: 'admin',
        subscription: {
          startDate: startDate.toISOString(),
          duration: durationMonths,
          endDate: endDate.toISOString(),
          price: subscriptionPrices[formData.subscriptionDuration]
        },
      };

      // Yangi foydalanuvchini saqlash
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      navigate('/menu');
    } catch (err) {
      setError('Ro\'yxatdan o\'tishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1><FaSignInAlt className="header-icon" /> Ro'yxatdan o'tish</h1>
            <p>Iltimos ma'lumotlaringizni kiriting</p>
          </div>

          {error && (
            <div className="error-message">
              <MdErrorOutline className="error-icon" /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="login-form">
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
                  autoComplete="new-password"
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

            <div className="form-group">
              <label htmlFor="subscriptionDuration">
                <FaMoneyBillWave className="input-icon" /> Obuna muddati
              </label>
              <select
                id="subscriptionDuration"
                name="subscriptionDuration"
                value={formData.subscriptionDuration}
                onChange={handleChange}
              >
                <option value="1">1 oy - 50,000 so'm</option>
                <option value="2">2 oy - 90,000 so'm</option>
                <option value="6">6 oy - 250,000 so'm</option>
              </select>
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
                  <FaSignInAlt className="btn-icon" /> Ro'yxatdan o'tish
                </>
              )}
            </button>
          </form>

          <div className="payment-info">
            <h3><MdPayment /> To'lov usullari:</h3>
            <p><strong>Payme:</strong> 1234 5678 9012 3456</p>
            <p><strong>Click:</strong> 1234 5678 9012 3456</p>
            <p><strong>Bank:</strong> TBC Bank, ABDULLAYEV A., 1234 5678 9012 3456</p>
            <p className="note">Eslatma: To'lov qilganingizdan so'ng admin tasdiqlashini kuting (odatda 1 soat ichida).</p>
          </div>

          <div className="register-link">
            <p>
              Hisobingiz bormi?{' '}
              <Link to="/" className="register-link-text">
                Kirish
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="login-image-container"></div>
    </div>
  );
};

export default Register;