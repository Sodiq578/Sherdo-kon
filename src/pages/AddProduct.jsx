import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import Quagga from 'quagga';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    nomi: '',
    kodi: '',
    shtrix: '',
    narx: '',
    soni: '',
    rasm: null,
    kerakli: false,
    bolim: '',
    id: null
  });
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState(['Ichimliklar', 'Shirinliklar', 'Meva va sabzavotlar', 'Go\'sht mahsulotlari']);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    const storedCategories = JSON.parse(localStorage.getItem('categories')) || categories;
    setProducts(storedProducts);
    setCategories(storedCategories);
  }, []);

  useEffect(() => {
    if (showScanner) {
      setIsScanning(true);
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: document.querySelector('#scanner-container'),
          constraints: {
            facingMode: 'environment'
          }
        },
        decoder: {
          readers: ['ean_reader', 'code_128_reader', 'upc_reader']
        }
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          alert('Skaner ishga tushmadi. Iltimos, qaytadan urinib ko\'ring yoki shtrix kodni qo\'lda kiriting.');
          setShowScanner(false);
          setIsScanning(false);
          return;
        }
        Quagga.start();
        Quagga.onDetected((data) => {
          const barcode = data.codeResult.code;
          const existingProduct = products.find(p => p.shtrix === barcode);
          if (existingProduct && !isEditing) {
            alert('Bu shtrix kod bilan mahsulot allaqachon mavjud!');
          } else {
            setFormData({ ...formData, shtrix: barcode });
            alert(`Shtrix kod skanerlandi: ${barcode}`);
          }
          Quagga.stop();
          setShowScanner(false);
          setIsScanning(false);
        });
      });

      return () => {
        Quagga.stop();
        setIsScanning(false);
      };
    }
  }, [showScanner, products, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { nomi, kodi, shtrix, narx, soni, id, bolim } = formData;
    
    if (!nomi || !kodi || !shtrix || !narx || !soni || !bolim) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring!');
      return;
    }
    
    const isDuplicateCode = products.some(
      p => p.kodi === kodi && (!isEditing || p.id !== id)
    );
    const isDuplicateBarcode = products.some(
      p => p.shtrix === shtrix && (!isEditing || p.id !== id)
    );
    
    if (isDuplicateCode) {
      alert('Bu kod bilan boshqa mahsulot mavjud! Iltimos, boshqa kod kiriting.');
      return;
    }
    
    if (isDuplicateBarcode) {
      alert('Bu shtrix kod bilan boshqa mahsulot mavjud! Iltimos, boshqa shtrix kod kiriting.');
      return;
    }
    
    const newProduct = {
      id: id || Date.now().toString(),
      nomi,
      kodi,
      shtrix,
      narx: parseInt(narx),
      soni: parseInt(soni),
      rasm: formData.rasm ? 
        (typeof formData.rasm === 'string' ? formData.rasm : URL.createObjectURL(formData.rasm)) : 
        null,
      kerakli: formData.kerakli,
      bolim,
      createdAt: id ? 
        products.find(p => p.id === id)?.createdAt || new Date().toISOString() : 
        new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedProducts;
    if (isEditing) {
      updatedProducts = products.map(p => p.id === id ? newProduct : p);
    } else {
      updatedProducts = [...products, newProduct];
    }

    localStorage.setItem('products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);
    alert(`${nomi} muvaffaqiyatli ${isEditing ? 'tahrirlandi' : 'qo\'shildi'}!`);
    
    resetForm();
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      setFormData({ ...formData, bolim: newCategory.trim() });
      setNewCategory('');
      setShowCategoryInput(false);
    } else if (categories.includes(newCategory.trim())) {
      alert('Bu bo\'lim allaqachon mavjud!');
    }
  };

  const editProduct = (product) => {
    setFormData({
      nomi: product.nomi,
      kodi: product.kodi,
      shtrix: product.shtrix || '',
      narx: product.narx,
      soni: product.soni,
      rasm: product.rasm,
      kerakli: product.kerakli,
      bolim: product.bolim,
      id: product.id
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = (product) => {
    if (window.confirm(`Haqiqatan ham "${product.nomi}" mahsulotini o\'chirmoqchimisiz?\nBu amalni ortga qaytarib bo\'lmaydi!`)) {
      const updatedProducts = products.filter(p => p.id !== product.id);
      setProducts(updatedProducts);
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      if (isEditing && formData.id === product.id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nomi: '',
      kodi: '',
      shtrix: '',
      narx: '',
      soni: '',
      rasm: null,
      kerakli: false,
      bolim: '',
      id: null
    });
    setIsEditing(false);
    setShowScanner(false);
  };

  const filteredProducts = products.filter(product =>
    product.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.kodi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shtrix?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.bolim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="main-container container mx-auto p-4">
      <Sidebar />
      <div className="content">
        <div className="menu-header flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tovar qo'shish</h2>
          <div className="search-bar relative">
            <input
              type="text"
              className="border rounded px-3 py-2 w-64"
              placeholder="Mahsulotlarni qidirish (nomi, kodi, shtrix kodi, bo'lim)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
          </div>
        </div>
        <div className="tabs flex space-x-2 mb-4">
          <button onClick={() => navigate('/menu')} className="px-4 py-2 bg-gray-200 rounded">Tovar jadavali</button>
          <button onClick={() => navigate('/orders')} className="px-4 py-2 bg-gray-200 rounded">Savdo statistikasi</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Tovar qo'shish</button>
        </div>
        
        <div className="add-product-container">
          <form className="add-product-form bg-white p-6 rounded shadow" onSubmit={handleSubmit}>
            <h3 className="text-xl font-semibold mb-4">{isEditing ? 'Tovarni tahrirlash' : 'Yangi tovar qo\'shish'}</h3>
            <div className="form-group mb-4">
              <label className="block mb-1">Tovar nomi *</label>
              <input
                type="text"
                name="nomi"
                className="border rounded px-3 py-2 w-full"
                value={formData.nomi}
                onChange={handleChange}
                required
                placeholder="Masalan: Coca Cola"
              />
            </div>
            <div className="form-group mb-4">
              <label className="block mb-1">Tovar kodi *</label>
              <input
                type="text"
                name="kodi"
                className="border rounded px-3 py-2 w-full"
                value={formData.kodi}
                onChange={handleChange}
                required
                placeholder="Masalan: CC001"
              />
            </div>
            <div className="form-group mb-4">
              <label className="block mb-1">Shtrix kod *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  name="shtrix"
                  className="border rounded px-3 py-2 w-full"
                  value={formData.shtrix}
                  onChange={handleChange}
                  required
                  placeholder="Masalan: 1234567890123"
                />
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => setShowScanner(!showScanner)}
                  disabled={isScanning}
                >
                  {isScanning ? 'Skanerlanmoqda...' : showScanner ? 'Skanerni yopish' : 'Skanerlash'}
                </button>
              </div>
            </div>
            {showScanner && (
              <div id="scanner-container" className="scanner-container mb-4 border border-gray-300">
                <video className="w-full h-auto"></video>
              </div>
            )}
            <div className="form-row flex space-x-4 mb-4">
              <div className="form-group flex-1">
                <label className="block mb-1">Narxi (UZS) *</label>
                <input
                  type="number"
                  name="narx"
                  className="border rounded px-3 py-2 w-full"
                  value={formData.narx}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="Masalan: 10000"
                />
              </div>
              <div className="form-group flex-1">
                <label className="block mb-1">Soni *</label>
                <input
                  type="number"
                  name="soni"
                  className="border rounded px-3 py-2 w-full"
                  value={formData.soni}
                  onChange={handleChange}
                  min="0"
                  required
                  placeholder="Masalan: 50"
                />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="block mb-1">Bo'lim *</label>
              <div className="category-select flex space-x-2">
                <select
                  name="bolim"
                  className="border rounded px-3 py-2 w-full"
                  value={formData.bolim}
                  onChange={handleChange}
                  required
                >
                  <option value="">Bo'limni tanlang</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => setShowCategoryInput(!showCategoryInput)}
                >
                  {showCategoryInput ? 'Bekor qilish' : '+ Yangi bo\'lim'}
                </button>
              </div>
              {showCategoryInput && (
                <div className="new-category-input flex space-x-2 mt-2">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Yangi bo'lim nomi kiriting"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    onClick={addCategory}
                    disabled={!newCategory.trim()}
                  >
                    Saqlash
                  </button>
                </div>
              )}
            </div>
            <div className="form-group mb-4">
              <label className="block mb-1">Rasm (ixtiyoriy)</label>
              <input
                type="file"
                name="rasm"
                className="border rounded px-3 py-2 w-full"
                accept="image/*"
                onChange={handleChange}
              />
              {formData.rasm && typeof formData.rasm === 'string' && (
                <div className="current-image mt-2">
                  <p>Joriy rasm:</p>
                  <img src={formData.rasm} alt="Current product" className="w-24 h-auto" />
                </div>
              )}
            </div>
            <div className="form-checkbox mb-4">
              <input
                type="checkbox"
                name="kerakli"
                className="mr-2"
                checked={formData.kerakli}
                onChange={handleChange}
                id="kerakli"
              />
              <label htmlFor="kerakli">
                Kerakli mahsulot {formData.kerakli && '(Do\'konda doim bo\'lishi kerak)'}
              </label>
            </div>
            <div className="form-actions flex space-x-2">
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                {isEditing ? 'O\'zgarishlarni saqlash' : 'Tovar qo\'shish'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                  Bekor qilish
                </button>
              )}
            </div>
          </form>

          <div className="product-list mt-6">
            <h3 className="text-xl font-semibold mb-4">Mavjud mahsulotlar ({filteredProducts.length})</h3>
            {filteredProducts.length > 0 ? (
              <div className="product-items space-y-4">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`product-item p-4 border rounded ${product.kerakli ? 'border-green-500' : ''}`}
                  >
                    <div className="product-details flex space-x-4">
                      {product.rasm && (
                        <img src={product.rasm} alt={product.nomi} className="product-thumbnail w-16 h-16 object-cover" />
                      )}
                      <div>
                        <h4 className="font-semibold">
                          {product.nomi} 
                          {product.kerakli && <span className="ml-2 text-green-500 text-sm">Kerakli</span>}
                        </h4>
                        <p>Kodi: {product.kodi}</p>
                        <p>Shtrix kod: {product.shtrix || 'N/A'}</p>
                        <p>Narxi: {product.narx.toLocaleString()} UZS</p>
                        <p>Soni: {product.soni}</p>
                        <p>Bo'lim: {product.bolim}</p>
                        <p className="date-info text-sm text-gray-500">
                          Qo'shilgan: {new Date(product.createdAt).toLocaleDateString()}
                          {product.createdAt !== product.updatedAt && (
                            <span>, Tahrirlangan: {new Date(product.updatedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="product-actions flex space-x-2 mt-2">
                      <button
                        onClick={() => editProduct(product)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products p-4 text-center text-gray-500">
                <p>Mahsulotlar topilmadi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;