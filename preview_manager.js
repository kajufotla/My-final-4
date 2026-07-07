// ==========================================
// 3. preview_manager.js - Preview, PDF & Print Handling
// ==========================================

window.PreviewManager = {
  updatePreview: (cache) => {
    if (!cache || !cache.receiptPaper) return;

    // Map regular text fields
    document.querySelectorAll('[data-bind]').forEach(el => {
      const key = el.getAttribute('data-bind');
      const targets = document.querySelectorAll(`[id^="prev${key.charAt(0).toUpperCase() + key.slice(1)}"]`);
      targets.forEach(target => {
        if(el.tagName === 'TEXTAREA') target.textContent = el.value;
        else target.innerHTML = AppUtils.sanitizeHTML(el.value);
      });
    });

    // Formatting Items Table (Fixed Columns order: Serial | Item | Qty | Price | Total)
    cache.prevItemsBody.innerHTML = '';
    let subtotal = 0, indexCounter = 1;
    
    window.appState.items.forEach((item) => {
      let p = parseFloat(item.price) || 0, q = parseFloat(item.qty) || 0;
      if(!item.desc && p === 0) return;
      let t = p * q;
      subtotal += t;
      
      cache.prevItemsBody.innerHTML += `
        <tr>
          <td style="text-align:center; color:#64748b; font-weight:600;">${indexCounter}</td>
          <td style="font-weight:500;">${AppUtils.sanitizeHTML(item.desc)}</td>
          <td style="text-align:center;">${q || ''}</td>
          <td style="text-align:right;">${AppUtils.formatMoney(p, cache.currencySelect.value)}</td>
          <td style="text-align:right; font-weight:700; color:#0f172a;">${AppUtils.formatMoney(t, cache.currencySelect.value)}</td>
        </tr>`;
      indexCounter++;
    });

    // Totals Calculation
    let d = parseFloat(cache.discountVal.value) || 0;
    let tR = parseFloat(cache.taxRate.value) || 0;
    let s = parseFloat(cache.shippingCost.value) || 0;
    let taxAmt = (subtotal - d) * (tR / 100);
    let gTotal = (subtotal - d) + taxAmt + s;

    cache.prevSubtotal.textContent = AppUtils.formatMoney(subtotal, cache.currencySelect.value);
    cache.prevTotal.textContent = AppUtils.formatMoney(gTotal, cache.currencySelect.value);
    
    if(cache.rowDiscount) cache.rowDiscount.style.display = d > 0 ? 'flex' : 'none';
    if(d>0 && cache.prevDiscount) cache.prevDiscount.textContent = `-${AppUtils.formatMoney(d, cache.currencySelect.value)}`;
    
    if(cache.rowTax) cache.rowTax.style.display = taxAmt > 0 ? 'flex' : 'none';
    if(taxAmt>0 && cache.prevTax) cache.prevTax.textContent = AppUtils.formatMoney(taxAmt, cache.currencySelect.value);
    
    if(cache.rowShipping) cache.rowShipping.style.display = s > 0 ? 'flex' : 'none';
    if(s>0 && cache.prevShipping) cache.prevShipping.textContent = AppUtils.formatMoney(s, cache.currencySelect.value);

    // Dynamic QR & Images
    if(window.appState.logoData && cache.prevLogo) { cache.prevLogo.src = window.appState.logoData; cache.prevLogo.style.display = 'block'; }
    if(window.appState.sigData && cache.prevSig) { cache.prevSig.src = window.appState.sigData; cache.prevSig.style.display = 'block'; }
  },

  downloadPDF: (cache) => {
    const element = cache.receiptPaper;
    const fileName = (cache.receiptNumber.value || 'Invoice') + '.pdf';
    
    let scaleVal = 2; // Fixed PDF clipping issues by optimizing scale and bounds
    if(cache.pdfQuality && cache.pdfQuality.value === 'standard') scaleVal = 1.5;
    if(cache.pdfQuality && cache.pdfQuality.value === 'print') scaleVal = 3;

    const opt = {
      margin: 10, 
      filename: fileName,
      image: { type: 'jpeg', quality: 1.0 },
      pagebreak: { mode: ['css', 'legacy'] },
      html2canvas: { 
        scale: scaleVal, 
        useCORS: true, 
        scrollY: 0,
        // clientWidth ensures the PDF engine maps the width dynamically without cutting the left side
        windowWidth: element.clientWidth || 800 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.getElementById('btnDownloadPDF');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Generating PDF...';
    
    html2pdf().set(opt).from(element).save().then(() => {
      btn.innerHTML = originalText;
    }).catch(err => {
      console.error("PDF Error: ", err);
      btn.innerHTML = originalText;
    });
  },

  printInvoice: () => {
    window.print(); // Relies on @media print CSS in your stylesheet
  }
};
