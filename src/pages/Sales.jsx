import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './Sales.css';
import Sidebar from '../components/Sidebar';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedSales = JSON.parse(localStorage.getItem('sales')) || [];
    setSales(storedSales);
  }, []);

  const filteredSales = filterDate
    ? sales.filter(sale => new Date(sale.date).toLocaleDateString() === new Date(filterDate).toLocaleDateString())
    : sales;

  const viewSaleDetails = (saleId) => {
    navigate(`/sales/${saleId}`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Sotuvlar tarixi', 14, 15);
    
    // Add filter info if applied
    if (filterDate) {
      doc.setFontSize(12);
      doc.text(`Sana: ${new Date(filterDate).toLocaleDateString()}`, 14, 25);
    }
    
    // Prepare data for the table
    const tableData = filteredSales.map(sale => [
      `#${sale.id.slice(-6)}`,
      new Date(sale.date).toLocaleString(),
      sale.customer || 'N/A',
      `${sale.items.length} ta`,
      `${sale.total.toLocaleString()} UZS`,
      sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'
    ]);
    
    // Add table
    doc.autoTable({
      head: [['ID', 'Sana', 'Mijoz', 'Mahsulotlar', 'Jami', 'To\'lov turi']],
      body: tableData,
      startY: 30,
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 20 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Sahifa ${i}/${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`Sotuvlar_tarixi_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <div className="sales-header">
          <h2>Sotuvlar tarixi</h2>
          <div className="sales-actions">
            <div className="sales-filter">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="filter-input"
              />
              <button 
                onClick={() => setFilterDate('')}
                className="clear-btn"
              >
                Tozalash
              </button>
            </div>
            <button 
              onClick={exportToPDF}
              className="export-btn"
              disabled={filteredSales.length === 0}
            >
              PDF ga yuklash
            </button>
          </div>
        </div>
        
        <div className="sales-container">
          {filteredSales.length > 0 ? (
            <div className="table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sana</th>
                    <th>Mijoz</th>
                    <th>Mahsulotlar</th>
                    <th>Jami</th>
                    <th>To'lov</th>
                    <th>Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale, index) => (
                    <tr key={sale.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td>#{sale.id.slice(-6)}</td>
                      <td>{new Date(sale.date).toLocaleString()}</td>
                      <td>{sale.customer || 'N/A'}</td>
                      <td>{sale.items.length} ta</td>
                      <td className="total-cell">{sale.total.toLocaleString()} UZS</td>
                      <td>
                        <span className={`payment-method ${sale.paymentMethod}`}>
                          {sale.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => viewSaleDetails(sale.id)}
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-sales">
              <p>Sotuvlar topilmadi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;