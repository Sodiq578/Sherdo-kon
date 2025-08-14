import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import AddProduct from './pages/AddProduct';
 
import Stats from './pages/Stats';
import Sales from './pages/Sales';
import Cashier from './pages/Cashier';
import Returns from './pages/Returns';
import Debts from './pages/Debts';
import SubscriptionExpired from './pages/SubscriptionExpired';
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/add-product" element={<AddProduct />} />
    
          <Route path="/stats" element={<Stats />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/subscription-expired" element={<SubscriptionExpired />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;