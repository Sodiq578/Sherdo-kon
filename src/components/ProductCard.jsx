import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onIncrease, onDecrease, onAddToCart }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.rasm ? (
          <img src={product.rasm} alt={product.nomi} />
        ) : (
          <div className="no-image">Rasm yo'q</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.nomi}</h3>
        <p className="product-code">Kodi: {product.kodi}</p>
        <p className="price">{product.narx.toLocaleString()} UZS</p>
        <div className="quantity-controls">
          <button onClick={() => onDecrease(product.id)}>-</button>
          <span>{product.quantity || 0}</span>
          <button onClick={() => onIncrease(product.id)}>+</button>
        </div>
        <button 
          className="add-to-cart" 
          onClick={() => onAddToCart(product)}
          disabled={!product.quantity || product.quantity === 0}
        >
          Savatga qo'shish
        </button>
      </div>
    </div>
  );
};

export default ProductCard;