import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Menu from './pages/Menu';
import AddProduct from './pages/AddProduct';
import Orders from './pages/Orders';
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
          <Route path="/" element={<Login />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/orders" element={<Orders />} />
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