import React from 'react';
import './OrderRow.css';

const OrderRow = ({ order, onAdd, onEdit }) => {
  return (
    <div className="order-row">
      <div className="order-info">
        <span className="order-name">{order.nomi}</span>
        <span className="order-quantity">{order.dona} dona</span>
        <span className="order-price">{parseInt(order.summa).toLocaleString()} UZS</span>
      </div>
      <div className="order-actions">
        <button className="add-btn" onClick={() => onAdd(order.id)}>+</button>
        <button className="edit-btn" onClick={() => onEdit(order)}>Tahrirlash</button>
      </div>
    </div>
  );
};

export default OrderRow;