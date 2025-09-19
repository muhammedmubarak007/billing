// Global variables
let itemCounter = 0;
let invoiceData = {
    items: [],
    client: {},
    totals: {
        subtotal: 0,
        discount: 0,
        tax: 0,
        grandTotal: 0,
        advance: 0,
        balance: 0
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-date').value = today;
    generateInvoiceNumber();
    addItem();
    setupEventListeners();
    updateAddButtonVisibility();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('invoice-num').addEventListener('blur', function () {
        if (!this.value) {
            generateInvoiceNumber();
        }
    });

    const inputs = document.querySelectorAll('#discount-percent, #discount-amount, #advance-amount');
    inputs.forEach(input => {
        input.addEventListener('input', updateSummary);
    });
}

// Generate invoice number
function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNum = `INV-${year}${month}${day}-${random}`;
    document.getElementById('invoice-num').value = invoiceNum;
}

// Add new item row
function addItem() {
    // Check if we already have 10 items
    const currentItemCount = Object.keys(invoiceData.items).length;
    if (currentItemCount >= 10) {
        alert('Maximum 10 items allowed per invoice.');
        return;
    }

    const tbody = document.getElementById('items-body');
    const row = document.createElement('tr');
    row.id = `item-${itemCounter}`;

    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="Item name" onchange="updateItem(${itemCounter})"></td>
        <td><input type="text" class="item-unit" placeholder="Unit" onchange="updateItem(${itemCounter})"></td>
        <td><input type="number" class="item-quantity" value="1" min="0" step="0.01" onchange="updateItem(${itemCounter})"></td>
        <td><input type="number" class="item-price" value="0" min="0" step="0.01" onchange="updateItem(${itemCounter})"></td>
        <td class="total-cell item-total">₹0.00</td>
        <td><button type="button" class="btn btn-danger" onclick="removeItem(${itemCounter})"><i class="fas fa-trash"></i></button></td>
    `;

    tbody.appendChild(row);
    invoiceData.items[itemCounter] = { name: '', unit: '', quantity: 1, price: 0, total: 0 };
    itemCounter++;
    updateSummary();

    // Hide add button if we now have 10 items
    updateAddButtonVisibility();
}

// Update item data and calculations
function updateItem(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    if (!row) return;

    const name = row.querySelector('.item-name').value;
    const unit = row.querySelector('.item-unit').value;
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;

    row.querySelector('.item-total').textContent = `₹${total.toFixed(2)}`;
    invoiceData.items[itemId] = { name, unit, quantity, price, total };
    updateSummary();
}

// Remove item
function removeItem(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    if (row) {
        row.remove();
        delete invoiceData.items[itemId];
        updateSummary();

        // Show add button since we removed an item
        updateAddButtonVisibility();
    }
}

// Update Add Item button visibility based on item count
function updateAddButtonVisibility() {
    const addButton = document.querySelector('button[onclick="addItem()"]');
    const currentItemCount = Object.keys(invoiceData.items).length;

    if (addButton) {
        if (currentItemCount >= 10) {
            addButton.style.display = 'none';
        } else {
            addButton.style.display = 'inline-block';
        }
    }
}

// Update summary calculations
function updateSummary() {
    let subtotal = 0;
    Object.values(invoiceData.items).forEach(item => {
        if (item && item.total) {
            subtotal += item.total;
        }
    });

    const discountPercent = parseFloat(document.getElementById('discount-percent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('discount-amount').value) || 0;
    const advanceAmount = parseFloat(document.getElementById('advance-amount').value) || 0;

    const calculatedDiscount = (subtotal * discountPercent) / 100;
    const finalDiscount = Math.max(calculatedDiscount, discountAmount);
    const taxableAmount = subtotal - finalDiscount;
    const tax = 0;
    const grandTotal = subtotal - finalDiscount;
    const balance = grandTotal - advanceAmount;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('discount-total').textContent = `₹${finalDiscount.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
    document.getElementById('advance-total').textContent = `₹${advanceAmount.toFixed(2)}`;
    document.getElementById('balance-due').textContent = `₹${balance.toFixed(2)}`;
    document.getElementById('amount-words').textContent = convertToWords(Math.abs(balance));

    invoiceData.totals = { subtotal, discount: finalDiscount, tax, grandTotal, advance: advanceAmount, balance };
    invoiceData.client = {
        name: document.getElementById('client-name').value,
        address: document.getElementById('client-address').value,
        phone: document.getElementById('client-phone').value,
        email: document.getElementById('client-email').value
    };
}

// Convert number to words
function convertToWords(num) {
    if (num === 0) return "Zero Rupees Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    function convertHundreds(n) {
        let result = "";
        if (n > 99) {
            result += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n > 19) {
            result += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        } else if (n > 9) {
            result += teens[n - 10] + " ";
            return result;
        }
        if (n > 0) {
            result += ones[n] + " ";
        }
        return result;
    }

    if (num < 0) return "Negative " + convertToWords(-num);

    let result = "";
    if (num >= 10000000) {
        result += convertHundreds(Math.floor(num / 10000000)) + "Crore ";
        num %= 10000000;
    }
    if (num >= 100000) {
        result += convertHundreds(Math.floor(num / 100000)) + "Lakh ";
        num %= 100000;
    }
    if (num >= 1000) {
        result += convertHundreds(Math.floor(num / 1000)) + "Thousand ";
        num %= 1000;
    }
    if (num >= 100) {
        result += convertHundreds(Math.floor(num / 100)) + "Hundred ";
        num %= 100;
    }
    if (num > 0) {
        result += convertHundreds(num);
    }

    return result.trim() + " Rupees Only";
}

// Clear invoice
function clearInvoice() {
    if (confirm('Are you sure you want to clear the entire invoice? This action cannot be undone.')) {
        document.getElementById('invoice-num').value = '';
        document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('client-name').value = '';
        document.getElementById('client-address').value = '';
        document.getElementById('client-phone').value = '';
        document.getElementById('client-email').value = '';
        document.getElementById('discount-percent').value = '0';
        document.getElementById('discount-amount').value = '0';
        document.getElementById('advance-amount').value = '0';
        document.getElementById('notes').value = '';

        document.getElementById('items-body').innerHTML = '';
        invoiceData = { items: [], client: {}, totals: { subtotal: 0, discount: 0, tax: 0, grandTotal: 0, advance: 0, balance: 0 } };
        itemCounter = 0;
        generateInvoiceNumber();
        addItem();
        updateSummary();
        updateAddButtonVisibility();
    }
}

// Preview invoice
function previewInvoice() {
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    previewContent.innerHTML = createPreviewHTML();
    modal.style.display = 'block';
}

// Create preview HTML
function createPreviewHTML() {
    const invoiceNum = document.getElementById('invoice-num').value;
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('client-name').value;
    const clientAddress = document.getElementById('client-address').value;
    const clientPhone = document.getElementById('client-phone').value;
    const clientEmail = document.getElementById('client-email').value;
    const notes = document.getElementById('notes').value;

    let itemsHTML = '';
    Object.values(invoiceData.items).forEach(item => {
        if (item && item.name) {
            itemsHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.unit || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        }
    });

    return `
        <div class="preview-invoice">
            <div class="preview-header">
                <div class="preview-logo-section">
                    <div class="preview-logo">
                        <img src="assets/logo.jpeg" alt="Smart Steel Logo" style="height: 50px; width: auto; object-fit: contain;">
                    </div>
                    <div class="preview-company">
                        <h1>Smart Steel</h1>
                        <h2>Fabrication</h2>
                    </div>
                </div>
                <div class="preview-contact">
                    <p>smartsteel.f@gmail.com</p>
                </div>
            </div>
            <div class="preview-header-line"></div>
            
            <div class="preview-invoice-header">
                <h2>INVOICE</h2>
                <div class="preview-invoice-details">
                    <p><strong>Invoice #:</strong> ${invoiceNum}</p>
                    <p><strong>Date:</strong> ${new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
            
            <div class="preview-client">
                <h3>Bill To:</h3>
                <div class="preview-client-info">
                    <p><strong>${clientName || 'Client Name'}</strong></p>
                    ${clientAddress ? `<p>${clientAddress}</p>` : ''}
                    ${clientPhone ? `<p>Phone: ${clientPhone}</p>` : ''}
                    ${clientEmail ? `<p>Email: ${clientEmail}</p>` : ''}
                </div>
            </div>
            
            <div class="preview-items">
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Unit</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
            </div>
            
            <div class="preview-summary">
                <div class="preview-totals">
                    <div class="preview-total-row">
                        <span>Subtotal:</span>
                        <span>₹${invoiceData.totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="preview-total-row">
                        <span>Discount:</span>
                        <span>₹${invoiceData.totals.discount.toFixed(2)}</span>
                    </div>
                    <div class="preview-total-row preview-grand-total">
                        <span>Grand Total:</span>
                        <span>₹${invoiceData.totals.grandTotal.toFixed(2)}</span>
                    </div>
                    <div class="preview-total-row">
                        <span>Advance Paid:</span>
                        <span>₹${invoiceData.totals.advance.toFixed(2)}</span>
                    </div>
                    <div class="preview-total-row preview-balance">
                        <span>Balance Due:</span>
                        <span>₹${invoiceData.totals.balance.toFixed(2)}</span>
                    </div>
                </div>
                <div class="preview-amount-words">
                    <p><strong>Amount in Words:</strong> ${convertToWords(Math.abs(invoiceData.totals.balance))}</p>
                </div>
            </div>
            
            ${notes ? `
                <div class="preview-notes">
                    <h3>Notes:</h3>
                    <p>${notes}</p>
                </div>
            ` : ''}
            
            <div class="preview-footer">
                <div class="preview-footer-content">
                    <div class="preview-phone">
                        <i class="fas fa-phone"></i>
                        <span>+91 75580 10767</span>
                        <span>+91 73065 96979</span>
                    </div>
                    <div class="preview-separator"></div>
                    <div class="preview-address">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <span>Mannur Valavu, Calicut</span>
                            <span>Kerala, India - 673328</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .preview-invoice { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; background: white; color: #333; }
            .preview-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; }
            .preview-logo-section { display: flex; align-items: center; gap: 15px; }
            .preview-logo { display: flex; align-items: center; justify-content: center; position: relative; }
            .preview-company h1 { color: #5b675b; font-size: 24px; margin: 0; font-weight: bold; }
            .preview-company h2 { color: #5b675b; font-size: 16px; margin: 0; font-weight: 300; }
            .preview-contact p { color: #5b675b; margin: 0; font-size: 14px; }
            .preview-header-line { height: 2px; background: #5b675b; margin-bottom: 20px; }
            .preview-invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef; }
            .preview-invoice-header h2 { color: #5b675b; font-size: 28px; margin: 0; }
            .preview-invoice-details p { margin: 5px 0; font-size: 14px; }
            .preview-client { margin-bottom: 20px; }
            .preview-client h3 { color: #5b675b; margin-bottom: 10px; font-size: 16px; }
            .preview-client-info p { margin: 5px 0; font-size: 14px; }
            .preview-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .preview-table th { background: #5b675b; color: white; padding: 10px; text-align: left; font-size: 14px; }
            .preview-table td { padding: 10px; border-bottom: 1px solid #e9ecef; font-size: 14px; }
            .preview-summary { margin-bottom: 20px; }
            .preview-totals { float: right; width: 300px; background: #f8f9fa; padding: 15px; border-radius: 4px; }
            .preview-total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .preview-grand-total { font-weight: bold; border-top: 1px solid #5b675b; margin-top: 10px; padding-top: 10px; }
            .preview-balance { font-weight: bold; color: #dc3545; background: #f8d7da; padding: 8px; border-radius: 4px; margin-top: 10px; }
            .preview-amount-words { clear: both; margin-top: 20px; padding: 10px; background: #e9ecef; border-radius: 4px; font-size: 14px; }
            .preview-notes { margin-bottom: 20px; }
            .preview-notes h3 { color: #5b675b; margin-bottom: 10px; font-size: 16px; }
            .preview-notes p { font-size: 14px; line-height: 1.5; }
            .preview-footer { background: #5b675b; color: white; padding: 15px; margin-top: 30px; }
            .preview-footer-content { display: flex; align-items: center; gap: 20px; }
            .preview-phone { display: flex; align-items: center; gap: 10px; }
            .preview-phone span { font-size: 14px; }
            .preview-separator { width: 1px; height: 20px; background: white; }
            .preview-address { display: flex; align-items: center; gap: 8px; }
            .preview-address span { font-size: 14px; display: block; }
        </style>
    `;
}

// Close preview modal
function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
}

// Download PDF
function downloadPDF() {
    try {
        // Show loading indicator
        const downloadBtn = document.querySelector('button[onclick="downloadPDF()"]');
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
        downloadBtn.disabled = true;

        // Create a temporary container for PDF generation
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '800px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.padding = '20px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.fontSize = '14px';
        tempContainer.style.lineHeight = '1.4';
        tempContainer.style.color = '#333';

        // Generate the invoice HTML for PDF
        const invoiceHTML = generateInvoiceHTML();
        tempContainer.innerHTML = invoiceHTML;

        // Add to body temporarily
        document.body.appendChild(tempContainer);

        // Wait a bit for fonts to load
        setTimeout(() => {
            // Try html2canvas first
            if (typeof html2canvas !== 'undefined') {
                html2canvas(tempContainer, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: 800,
                    height: tempContainer.scrollHeight,
                    logging: false
                }).then(canvas => {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF('p', 'mm', 'a4');

                    const imgData = canvas.toDataURL('image/png', 1.0);
                    const imgWidth = 210; // A4 width in mm
                    const pageHeight = 295; // A4 height in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // Add image to PDF
                    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                    // Generate filename
                    const invoiceNum = document.getElementById('invoice-num').value || 'INVOICE';
                    const clientName = document.getElementById('client-name').value || 'Client';
                    const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
                    const filename = `${invoiceNum}_${cleanClientName}.pdf`;

                    // Save PDF
                    doc.save(filename);

                    // Clean up
                    document.body.removeChild(tempContainer);
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.disabled = false;

                }).catch(error => {
                    console.error('html2canvas error:', error);
                    // Fallback to text-based PDF
                    generateTextPDF(tempContainer, downloadBtn, originalText);
                });
            } else {
                // Fallback to text-based PDF
                generateTextPDF(tempContainer, downloadBtn, originalText);
            }
        }, 1000);

    } catch (error) {
        console.error('Error in downloadPDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Generate invoice HTML for PDF
function generateInvoiceHTML() {
    const invoiceNum = document.getElementById('invoice-num').value;
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('client-name').value;
    const clientAddress = document.getElementById('client-address').value;
    const clientPhone = document.getElementById('client-phone').value;
    const clientEmail = document.getElementById('client-email').value;
    const notes = document.getElementById('notes').value;

    let itemsHTML = '';
    Object.values(invoiceData.items).forEach(item => {
        if (item && item.name) {
            itemsHTML += `
                <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-size: 12px;">${item.name}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-size: 12px;">${item.unit || '-'}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: center; font-size: 12px;">${item.quantity}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-size: 12px;">₹${item.price.toFixed(2)}</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; text-align: right; font-size: 12px;">₹${item.total.toFixed(2)}</td>
                </tr>
            `;
        }
    });

    return `
        <div style="max-width: 800px; margin: 0 auto; background: white; min-height: 1050px; display: flex; flex-direction: column;">
            <!-- Main Content -->
            <div style="flex: 1;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 3px solid #5b675b;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="display: flex; align-items: center; justify-content: center; position: relative;">
                        <img src="assets/logo.jpeg" alt="Smart Steel Logo" style="height: 50px; width: auto; object-fit: contain;">
                    </div>
                    <div>
                        <h1 style="color: #5b675b; font-size: 24px; margin: 0; font-weight: bold;">Smart Steel</h1>
                        <h2 style="color: #5b675b; font-size: 16px; margin: 0; font-weight: 300;">Fabrication</h2>
                    </div>
                </div>
                <div>
                    <p style="color: #5b675b; margin: 0; font-size: 14px;">smartsteel.f@gmail.com</p>
                </div>
            </div>
            
            <!-- Bill To -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin: 30px 0; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                <div>
                    <h3 style="color: #5b675b; margin-bottom: 10px; font-size: 14px;">Bill To:</h3>
                    <p style="margin: 5px 0; font-size: 14px;"><strong>${clientName || 'Client Name'}</strong></p>
                    ${clientAddress ? `<p style="margin: 5px 0; font-size: 14px;">${clientAddress}</p>` : ''}
                    ${clientPhone ? `<p style="margin: 5px 0; font-size: 14px;">Phone: ${clientPhone}</p>` : ''}
                    ${clientEmail ? `<p style="margin: 5px 0; font-size: 14px;">Email: ${clientEmail}</p>` : ''}
                </div>
                <div>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Invoice #:</strong> ${invoiceNum}</p>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Date:</strong> ${new Date(invoiceDate).toLocaleDateString('en-IN')}</p>
                </div>
            </div>
            
            <!-- Items Table -->
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #5b675b; color: white;">
                            <th style="padding: 8px; text-align: left; font-size: 12px;">Item Name</th>
                            <th style="padding: 8px; text-align: left; font-size: 12px;">Unit</th>
                            <th style="padding: 8px; text-align: center; font-size: 12px;">Quantity</th>
                            <th style="padding: 8px; text-align: right; font-size: 12px;">Unit Price</th>
                            <th style="padding: 8px; text-align: right; font-size: 12px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>
            
            <!-- Summary -->
            <div style="margin-bottom: 30px;">
                <div style="float: right; width: 300px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 14px;">
                        <span>Subtotal:</span>
                        <span>₹${invoiceData.totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; font-size: 14px;">
                        <span>Discount:</span>
                        <span>₹${invoiceData.totals.discount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #5b675b; font-size: 16px; font-weight: bold; color: #5b675b;">
                        <span>Grand Total:</span>
                        <span>₹${invoiceData.totals.grandTotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
                        <span>Advance Paid:</span>
                        <span>₹${invoiceData.totals.advance.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold; color: #dc3545;">
                        <span>Balance Due:</span>
                        <span>₹${invoiceData.totals.balance.toFixed(2)}</span>
                    </div>
                </div>
                <div style="clear: both; margin-top: 20px; font-size: 14px;">
                    <p style="margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(Math.abs(invoiceData.totals.balance))}</p>
                </div>
            </div>
            
            <!-- Notes -->
            ${notes ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #5b675b; margin-bottom: 15px; font-size: 18px;">Notes:</h3>
                    <p style="font-size: 14px; line-height: 1.5;">${notes}</p>
                </div>
            ` : ''}
            </div>

            <!-- Footer -->
            <div style="background: #5b675b; color: white; padding: 20px; margin-top: auto;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 16px;">📞</span>
                        <span style="font-size: 14px;">+91 75580 10767</span>
                        <span style="font-size: 14px;">+91 73065 96979</span>
                    </div>
                    <div style="width: 1px; height: 20px; background: white;"></div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">📍</span>
                        <div>
                            <span style="font-size: 14px; display: block;">Mannur Valavu, Calicut , Kerala, India - 673328</span>
                           
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Fallback text-based PDF generation
function generateTextPDF(tempContainer, downloadBtn, originalText) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Set font
        doc.setFont('helvetica');

        // Header
        doc.setFontSize(20);
        doc.setTextColor(45, 90, 39); // Smart Steel green
        doc.text('Smart Steel Fabrication', 20, 20);

        // Draw simple logo representation
        doc.setFontSize(12);
        doc.setTextColor(45, 90, 39);
        doc.text('LOGO', 15, 30); // Logo text without border

        doc.setFontSize(12);
        doc.text('smartsteel.f@gmail.com', 150, 20);

        // Invoice title
        doc.setFontSize(20);
        doc.text('INVOICE', 20, 40);

        // Invoice details
        const invoiceNum = document.getElementById('invoice-num').value || 'INVOICE';
        const invoiceDate = document.getElementById('invoice-date').value;
        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoiceNum}`, 150, 35);
        doc.text(`Date: ${new Date(invoiceDate).toLocaleDateString('en-IN')}`, 150, 42);

        // Client info
        const clientName = document.getElementById('client-name').value;
        const clientAddress = document.getElementById('client-address').value;
        const clientPhone = document.getElementById('client-phone').value;
        const clientEmail = document.getElementById('client-email').value;

        doc.setFontSize(14);
        doc.text('Bill To:', 20, 60);
        doc.setFontSize(12);
        doc.text(clientName || 'Client Name', 20, 70);
        if (clientAddress) doc.text(clientAddress, 20, 78);
        if (clientPhone) doc.text(`Phone: ${clientPhone}`, 20, 86);
        if (clientEmail) doc.text(`Email: ${clientEmail}`, 20, 94);

        // Items table header
        let yPos = 110;
        doc.setFontSize(12);
        doc.text('Item Name', 20, yPos);
        doc.text('Qty', 100, yPos);
        doc.text('Price', 120, yPos);
        doc.text('Total', 150, yPos);

        // Items
        yPos += 10;
        Object.values(invoiceData.items).forEach(item => {
            if (item && item.name) {
                doc.text(item.name.substring(0, 30), 20, yPos);
                doc.text(item.quantity.toString(), 100, yPos);
                doc.text(`₹${item.price.toFixed(2)}`, 120, yPos);
                doc.text(`₹${item.total.toFixed(2)}`, 150, yPos);
                yPos += 8;
            }
        });

        // Summary
        yPos += 10;
        doc.text('Subtotal:', 120, yPos);
        doc.text(`₹${invoiceData.totals.subtotal.toFixed(2)}`, 150, yPos);
        yPos += 8;

        doc.text('Discount:', 120, yPos);
        doc.text(`₹${invoiceData.totals.discount.toFixed(2)}`, 150, yPos);
        yPos += 8;

        doc.setFontSize(14);
        doc.text('Grand Total:', 120, yPos);
        doc.text(`₹${invoiceData.totals.grandTotal.toFixed(2)}`, 150, yPos);
        yPos += 8;

        doc.setFontSize(12);
        doc.text('Advance Paid:', 120, yPos);
        doc.text(`₹${invoiceData.totals.advance.toFixed(2)}`, 150, yPos);
        yPos += 8;

        doc.setFontSize(14);
        doc.text('Balance Due:', 120, yPos);
        doc.text(`₹${invoiceData.totals.balance.toFixed(2)}`, 150, yPos);
        yPos += 15;

        // Amount in words
        doc.setFontSize(10);
        doc.text(`Amount in Words: ${convertToWords(Math.abs(invoiceData.totals.balance))}`, 20, yPos);

        // Footer
        yPos = 280;
        doc.setFontSize(10);
        doc.text('Phone: +91 75580 10767, +91 73065 96979', 20, yPos);
        doc.text('Address: Mannur Valavu, Calicut, Kerala, India - 673328', 20, yPos + 8);

        // Generate filename and save
        const cleanClientName = (clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${invoiceNum}_${cleanClientName}.pdf`;
        doc.save(filename);

        // Clean up
        document.body.removeChild(tempContainer);
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;

    } catch (error) {
        console.error('Error in text PDF generation:', error);
        alert('Error generating PDF. Please try again.');
        document.body.removeChild(tempContainer);
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('preview-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        previewInvoice();
    }
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        previewInvoice();
    }
    if (event.key === 'Escape') {
        closePreview();
    }
});
