// ==========================================
// i18n Translation Dictionary (Foundation)
// ==========================================
const translations = {
    en: { nav_home: "Home", nav_invoice: "Invoice Builder", nav_history: "History", nav_contact: "Contact", nav_login: "Login", nav_signup: "Sign Up", tab_editor: "📝 Editor", tab_preview: "👁️ Preview", side_doc: "Document", side_company: "Company", side_customer: "Customer", side_items: "Items & Tax", side_payment: "Payment", side_extras: "Extras", side_history: "History", act_save: "💾 Save To History", act_print: "🖨️ Print PDF", act_reset: "↺ Reset", tot_due: "TOTAL DUE:", card_bank: "BANK DETAILS", card_scan: "SCAN TO PAY", card_terms: "TERMS & CONDITIONS", card_notes: "NOTES", foot_sig: "Authorized Signature", foot_thx: "Thank you for your business!", err_req: "Required field" },
    ur: { nav_home: "ہوم", nav_invoice: "انوائس بلڈر", nav_history: "ہسٹری", nav_contact: "رابطہ", nav_login: "لاگ ان", nav_signup: "سائن اپ", tab_editor: "📝 ایڈیٹر", tab_preview: "👁️ پیش نظارہ", side_doc: "دستاویز", side_company: "کمپنی", side_customer: "گاہک", side_items: "اشیاء اور ٹیکس", side_payment: "ادائیگی", side_extras: "اضافی معلومات", side_history: "ہسٹری", act_save: "💾 محفوظ کریں", act_print: "🖨️ پرنٹ", act_reset: "↺ ری سیٹ", tot_due: "کل رقم:", card_bank: "بینک کی تفصیلات", card_scan: "اسکین کریں", card_terms: "شرائط و ضوابط", card_notes: "نوٹس", foot_sig: "مجاز دستخط", foot_thx: "آپ کے کاروبار کا شکریہ!", err_req: "مطلوبہ فیلڈ" },
    ar: { nav_home: "الرئيسية", nav_invoice: "صانع الفواتير", nav_history: "السجل", nav_contact: "اتصل بنا", nav_login: "تسجيل الدخول", nav_signup: "اشتراك", tab_editor: "📝 محرر", tab_preview: "👁️ معاينة", side_doc: "وثيقة", side_company: "شركة", side_customer: "عميل", side_items: "عناصر وضريبة", side_payment: "دفع", side_extras: "إضافات", side_history: "سجل", act_save: "💾 حفظ", act_print: "🖨️ طباعة", act_reset: "↺ إعادة تعيين", tot_due: "الإجمالي:", card_bank: "تفاصيل البنك", card_scan: "مسح للدفع", card_terms: "الشروط والأحكام", card_notes: "ملاحظات", foot_sig: "توقيع معتمد", foot_thx: "شكرا لتعاملكم معنا!", err_req: "حقل مطلوب" },
};

function setLanguage(lang) {
    localStorage.setItem('rgp_lang', lang);
    const isRtl = ['ur', 'ar'].includes(lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    
    const dict = translations[lang] || translations['en'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(dict[key]) {
            if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = dict[key];
            else el.innerHTML = el.innerHTML.replace(/^[^\<]+/, dict[key] + ' '); 
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Robust Initialization
    let state = { 
        items: [{ id: Date.now(), desc: '', qty: '', price: '' }], 
        logoData: localStorage.getItem('rgp_logoData') || null, 
        sigData: localStorage.getItem('rgp_sigData') || null, 
        qrData: localStorage.getItem('rgp_qrData') || null 
    };
    
    let historyLogs = JSON.parse(localStorage.getItem('rgp_history') || '[]');
    let savedClients = JSON.parse(localStorage.getItem('rgp_clients') || '[]');
    let savedPayments = JSON.parse(localStorage.getItem('rgp_payments') || '[]');
    let itemMemory = JSON.parse(localStorage.getItem('rgp_item_memory') || '[]');

    // --- START: Company Profile Persistence ---
    const savedProfile = JSON.parse(localStorage.getItem('rgp_company_profile') || '{}');
    if(savedProfile.bizName) document.getElementById('bizName').value = savedProfile.bizName;
    if(savedProfile.bizEmail) document.getElementById('bizEmail').value = savedProfile.bizEmail;
    if(savedProfile.bizPhone) document.getElementById('bizPhone').value = savedProfile.bizPhone;
    if(savedProfile.bizAddress) document.getElementById('bizAddress').value = savedProfile.bizAddress;

    document.getElementById('btnQuickSaveProfile').addEventListener('click', () => {
        const profile = {
            bizName: document.getElementById('bizName').value,
            bizEmail: document.getElementById('bizEmail').value,
            bizPhone: document.getElementById('bizPhone').value,
            bizAddress: document.getElementById('bizAddress').value
        };
        localStorage.setItem('rgp_company_profile', JSON.stringify(profile));
        updatePreview();
        alert("Company Profile Saved & Loaded!");
    });
    // --- END: Company Profile Persistence ---

    const savedLang = localStorage.getItem('rgp_lang') || 'en';
    document.getElementById('langSwitcher').value = savedLang;
    setLanguage(savedLang);
    document.getElementById('langSwitcher').addEventListener('change', (e) => setLanguage(e.target.value));

    const els = {
        mainForm: document.getElementById('mainForm'),
        binds: document.querySelectorAll('[data-bind]'),
        itemsBody: document.getElementById('itemsBody'),
        discountVal: document.getElementById('discountVal'),
        taxRate: document.getElementById('taxRate'),
        taxLabelInput: document.getElementById('taxLabelInput'),
        shippingCost: document.getElementById('shippingCost'),
        currencySelect: document.getElementById('currencySelect'),
        themeColorSelect: document.getElementById('themeColorSelect'),
        paymentArchType: document.getElementById('paymentArchType'),
        bankFields: document.getElementById('bankFields'),
        stripeFields: document.getElementById('stripeFields'),
        bankDetails: document.getElementById('bankDetails'), 
        notes: document.getElementById('notes'),
        terms: document.getElementById('terms'),
        historyLogsContainer: document.getElementById('historyLogsContainer')
    };

    // Auto Invoice Number
    const generateAutoNumber = () => {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `INV-${year}-${rand}`;
    };
    document.getElementById('receiptNumber').value = generateAutoNumber();
    document.getElementById('issueDate').valueAsDate = new Date();

    const savedExtras = JSON.parse(localStorage.getItem('rgp_extras_defaults') || '{}');
    if(savedExtras.notes) els.notes.value = savedExtras.notes;
    if(savedExtras.terms) els.terms.value = savedExtras.terms;

    els.themeColorSelect.addEventListener('input', (e) => {
        const selectedColor = e.target.value;
        document.documentElement.style.setProperty('--receipt-theme-color', selectedColor);
        document.documentElement.style.setProperty('--receipt-light-bg', selectedColor + '15');
        updatePreview();
    });

    els.paymentArchType.addEventListener('change', (e) => {
        if(e.target.value === 'bank') {
            els.bankFields.style.display = 'block'; els.stripeFields.style.display = 'none';
        } else {
            els.bankFields.style.display = 'none'; els.stripeFields.style.display = 'block';
        }
        updatePreview();
    });

    const saveLayoutConfig = () => {
        localStorage.setItem('rgp_extras_defaults', JSON.stringify({ notes: els.notes.value, terms: els.terms.value }));
        alert("Saved successfully!");
    };
    document.getElementById('btnSaveNotesOnly').addEventListener('click', saveLayoutConfig);
    document.getElementById('btnSaveTermsOnly').addEventListener('click', saveLayoutConfig);

    const autoNumber = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const el = e.target;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const val = el.value;
            const linesBeforeCaret = val.substring(0, start).split('\n');
            const currentLine = linesBeforeCaret[linesBeforeCaret.length - 1];
            const match = currentLine.match(/^(\d+)\.\s/);
            let insertText = '\n';
            if (match) insertText += `${parseInt(match[1], 10) + 1}. `;
            else if (val.trim() === '') insertText += '1. ';
            el.value = val.substring(0, start) + insertText + val.substring(end);
            el.selectionStart = el.selectionEnd = start + insertText.length;
            updatePreview();
        }
    };
    els.notes.addEventListener('keydown', autoNumber);
    els.terms.addEventListener('keydown', autoNumber);

    const bankInputs = document.querySelectorAll('.bank-grid input');
    const updateBankString = () => {
        let str = '';
        if(document.getElementById('bankAccTitle').value) str += `Account Title: ${document.getElementById('bankAccTitle').value}\n`;
        if(document.getElementById('bankName').value) str += `Bank Name: ${document.getElementById('bankName').value}\n`;
        if(document.getElementById('bankAccNo').value) str += `Account No: ${document.getElementById('bankAccNo').value}\n`;
        if(document.getElementById('bankIban').value) str += `IBAN: ${document.getElementById('bankIban').value}\n`;
        if(document.getElementById('bankSwift').value) str += `SWIFT: ${document.getElementById('bankSwift').value}\n`;
        if(document.getElementById('bankBranch').value) str += `Branch: ${document.getElementById('bankBranch').value}\n`;
        if(document.getElementById('bankCode').value) str += `Code: ${document.getElementById('bankCode').value}\n`;
        if(document.getElementById('bankRef').value) str += `Ref: ${document.getElementById('bankRef').value}\n`;
        els.bankDetails.value = str.trim();
        updatePreview();
    };
    bankInputs.forEach(input => input.addEventListener('input', updateBankString));

    // Event Delegation for Bug Fix - Global Input Listener
    els.mainForm.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            updatePreview();
        }
    });

    document.querySelectorAll('.sticker-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sticker-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
        });
    });

    document.getElementById('tabEditor').addEventListener('click', (e) => {
        e.target.classList.add('active'); document.getElementById('tabPreview').classList.remove('active');
        document.querySelector('.editor-section').classList.add('active-tab'); document.querySelector('.preview-section').classList.remove('active-tab');
    });
    document.getElementById('tabPreview').addEventListener('click', (e) => {
        if(validateForm()) {
            e.target.classList.add('active'); document.getElementById('tabEditor').classList.remove('active');
            document.querySelector('.preview-section').classList.add('active-tab'); document.querySelector('.editor-section').classList.remove('active-tab');
            updatePreview();
        }
    });

    const formatMoney = (amount) => {
        const symbol = els.currencySelect.value.split('|')[1] || '';
        return `${symbol} ${new Intl.NumberFormat(document.documentElement.lang || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;
    };

    const updateItemMemoryList = () => {
        const dl = document.getElementById('itemMemoryList');
        dl.innerHTML = '';
        itemMemory.forEach(desc => { dl.innerHTML += `<option value="${desc}">`; });
    };
    updateItemMemoryList();

    const renderItemsEditor = () => {
        els.itemsBody.innerHTML = '';
        state.items.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="item-desc req-field" data-id="${item.id}" value="${item.desc}" list="itemMemoryList" placeholder="Item Description"></td>
                <td><input type="number" class="item-qty req-field" data-id="${item.id}" value="${item.qty}" placeholder="0" min="0"></td>
                <td><input type="number" class="item-price req-field" data-id="${item.id}" value="${item.price}" placeholder="0" min="0"></td>
                <td style="text-align:right;"><button class="btn-danger btn-remove-item" data-id="${item.id}" aria-label="Remove Item">✕</button></td>
            `;
            els.itemsBody.appendChild(tr);
        });

        // Attach listeners matching by unique ID instead of index array (Bugfix)
        document.querySelectorAll('.item-desc').forEach(el => el.addEventListener('input', (e) => { 
            const id = parseInt(e.target.dataset.id);
            const item = state.items.find(i => i.id === id);
            if(item) item.desc = e.target.value; 
            validateField(e.target); 
        }));
        document.querySelectorAll('.item-desc').forEach(el => el.addEventListener('blur', (e) => {
            if(e.target.value && !itemMemory.includes(e.target.value)) {
                itemMemory.push(e.target.value); localStorage.setItem('rgp_item_memory', JSON.stringify(itemMemory)); updateItemMemoryList();
            }
        }));
        document.querySelectorAll('.item-qty').forEach(el => el.addEventListener('input', (e) => { 
            const id = parseInt(e.target.dataset.id);
            const item = state.items.find(i => i.id === id);
            if(item) item.qty = e.target.value; 
            validateField(e.target); 
        }));
        document.querySelectorAll('.item-price').forEach(el => el.addEventListener('input', (e) => { 
            const id = parseInt(e.target.dataset.id);
            const item = state.items.find(i => i.id === id);
            if(item) item.price = e.target.value; 
            validateField(e.target); 
        }));
        document.querySelectorAll('.btn-remove-item').forEach(el => el.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if(state.items.length > 1) { 
                state.items = state.items.filter(i => i.id !== id);
                renderItemsEditor(); 
                updatePreview(); 
            }
        }));
    };

    document.getElementById('btnAddItem').addEventListener('click', () => { state.items.push({ id: Date.now(), desc: '', qty: '', price: '' }); renderItemsEditor(); });

    const renderList = (textId, listId, wrapId) => {
        const text = document.getElementById(textId).value;
        const wrap = document.getElementById(wrapId);
        const list = document.getElementById(listId);
        if (text.trim()) {
            wrap.style.display = 'block';
            list.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            wrap.style.display = 'none';
        }
    };

    const updatePreview = () => {
        els.binds.forEach(el => {
            const key = el.getAttribute('data-bind');
            const targets = document.querySelectorAll(`[id^="prev${key.charAt(0).toUpperCase() + key.slice(1)}"]`);
            targets.forEach(target => {
                if(el.tagName === 'TEXTAREA') target.textContent = el.value;
                else target.innerHTML = el.value;
            });
        });

        document.getElementById('prevTaxLabel').textContent = els.taxLabelInput.value || 'Tax';
        document.getElementById('prevBizContact').innerHTML = [document.getElementById('bizPhone').value, document.getElementById('bizEmail').value].filter(Boolean).join(' | ');
        document.getElementById('prevCustContact').innerHTML = [document.getElementById('custPhone').value, document.getElementById('custEmail').value].filter(Boolean).join(' | ');

        renderList('notes', 'prevNotesList', 'wrapNotes');
        renderList('terms', 'prevTermsList', 'wrapTerms');
        
        const payUrl = document.getElementById('payUrl').value;
        const payMethod = document.getElementById('payMethod').value;
        const bankLines = els.bankDetails.value.split('\n').map(line => {
            if(line.includes(':')) {
                const parts = line.split(':');
                return `<strong>${parts[0]}:</strong>${parts.slice(1).join(':')}`;
            }
            return line;
        });
        
        document.getElementById('prevPayMethod').textContent = payMethod;

        if(els.paymentArchType.value === 'bank') {
            document.getElementById('prevBankDetails').innerHTML = bankLines.join('<br>');
            document.getElementById('prevPayUrl').style.display = 'none';
        } else {
            document.getElementById('prevBankDetails').textContent = '';
            if(payUrl) {
                document.getElementById('prevPayUrl').href = payUrl;
                document.getElementById('prevPayUrl').textContent = "Pay Securely Via Stripe Link ↗";
                document.getElementById('prevPayUrl').style.display = 'block';
            } else {
                document.getElementById('prevPayUrl').style.display = 'none';
            }
        }

        if(state.logoData) { document.getElementById('prevLogo').src = state.logoData; document.getElementById('prevLogo').style.display = 'block'; }
        if(state.sigData) { document.getElementById('prevSig').src = state.sigData; document.getElementById('prevSig').style.display = 'block'; }
        
        const qrWrap = document.getElementById('wrapQr');
        if(state.qrData) { document.getElementById('prevQr').src = state.qrData; qrWrap.style.display = 'flex'; } 
        else { qrWrap.style.display = 'none'; }

        const prevItemsBody = document.getElementById('prevItemsBody');
        prevItemsBody.innerHTML = '';
        let subtotal = 0, indexCounter = 1;

        state.items.forEach((item) => {
            let p = parseFloat(item.price) || 0, q = parseFloat(item.qty) || 0;
            if(!item.desc && p === 0) return;
            let t = p * q; subtotal += t;
            prevItemsBody.innerHTML += `<tr><td style="text-align:center; color:#64748b; font-weight:600;">${indexCounter}</td><td style="font-weight:500;">${item.desc}</td><td style="text-align:center;">${q||''}</td><td style="text-align:right;">${formatMoney(p)}</td><td style="text-align:right; font-weight:700; color:#0f172a;">${formatMoney(t)}</td></tr>`;
            indexCounter++;
        });

        let d = parseFloat(els.discountVal.value) || 0, tR = parseFloat(els.taxRate.value) || 0, s = parseFloat(els.shippingCost.value) || 0;
        let taxAmt = (subtotal - d) * (tR / 100);
        let gTotal = (subtotal - d) + taxAmt + s;

        document.getElementById('prevSubtotal').textContent = formatMoney(subtotal);
        document.getElementById('rowDiscount').style.display = d > 0 ? 'flex' : 'none';
        if(d>0) document.getElementById('prevDiscount').textContent = `-${formatMoney(d)}`;
        
        document.getElementById('rowTax').style.display = taxAmt > 0 ? 'flex' : 'none';
        if(taxAmt>0) document.getElementById('prevTax').textContent = formatMoney(taxAmt);
        
        document.getElementById('rowShipping').style.display = s > 0 ? 'flex' : 'none';
        if(s>0) document.getElementById('prevShipping').textContent = formatMoney(s);

        document.getElementById('prevTotal').textContent = formatMoney(gTotal);
    };

    const validateField = (el) => {
        const errorSpan = el.nextElementSibling?.classList.contains('error-msg') ? el.nextElementSibling : null;
        if(el.value.trim() === '') {
            el.classList.add('error');
            if(errorSpan) errorSpan.style.display = 'block';
            return false;
        } else {
            el.classList.remove('error');
            if(errorSpan) errorSpan.style.display = 'none';
            return true;
        }
    };

    const validateForm = () => {
        let isValid = true;
        document.querySelectorAll('.req-field').forEach(el => {
            if(!validateField(el)) isValid = false;
        });
        if(!isValid) alert("Please fill in all required fields (Business Name, Customer Name, Item Details).");
        return isValid;
    };

    document.querySelectorAll('.req-field').forEach(el => el.addEventListener('blur', (e) => validateField(e.target)));
    
    // File Persistence Added
    const handleFile = (id, stateKey) => {
        document.getElementById(id).addEventListener('change', function(e) {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (ev) => { 
                    state[stateKey] = ev.target.result; 
                    localStorage.setItem('rgp_' + stateKey, ev.target.result); 
                    updatePreview(); 
                };
                reader.readAsDataURL(file);
            }
        });
    };
    handleFile('logoUpload', 'logoData'); handleFile('sigUpload', 'sigData'); handleFile('qrUpload', 'qrData');

    document.getElementById('btnAutoNum').addEventListener('click', () => { document.getElementById('receiptNumber').value = generateAutoNumber(); updatePreview(); });

    document.getElementById('btnDownloadPDF').addEventListener('click', () => {
        if (validateForm()) {
            updatePreview();
            const element = document.getElementById('receiptPaper');
            const fileName = document.getElementById('receiptNumber').value + '.pdf';
            
            const opt = {
                margin:       0,
                filename:     fileName,
                image:        { type: 'jpeg', quality: 1 },
                html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            const btn = document.getElementById('btnDownloadPDF');
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Generating PDF...';
            
            html2pdf().set(opt).from(element).save().then(() => {
                btn.innerHTML = originalText;
            });
        }
    });

    // Client & Payment Directories
    const updateDropdowns = () => {
        const cDrop = document.getElementById('savedClientsDropdown');
        cDrop.innerHTML = '<option value="">-- Manual Entry --</option>';
        savedClients.forEach((c, i) => cDrop.innerHTML += `<option value="${i}">${c.custName}</option>`);

        const pDrop = document.getElementById('savedPaymentsDropdown');
        pDrop.innerHTML = '<option value="">-- Manual Entry --</option>';
        savedPayments.forEach((p, i) => pDrop.innerHTML += `<option value="${i}">Profile ${i+1} (${p.payArch})</option>`);
    };
    updateDropdowns();

    document.getElementById('btnSaveClient').addEventListener('click', () => {
        const name = document.getElementById('custName').value;
        if(!name) return alert("Customer name required to save.");
        savedClients.push({
            custName: name, custCompany: document.getElementById('custCompany').value,
            custEmail: document.getElementById('custEmail').value, custPhone: document.getElementById('custPhone').value,
            custAddress: document.getElementById('custAddress').value
        });
        localStorage.setItem('rgp_clients', JSON.stringify(savedClients));
        updateDropdowns(); alert("Client Saved!");
    });

    document.getElementById('savedClientsDropdown').addEventListener('change', (e) => {
        if(e.target.value !== "") {
            const c = savedClients[e.target.value];
            document.getElementById('custName').value = c.custName || '';
            document.getElementById('custCompany').value = c.custCompany || '';
            document.getElementById('custEmail').value = c.custEmail || '';
            document.getElementById('custPhone').value = c.custPhone || '';
            document.getElementById('custAddress').value = c.custAddress || '';
            updatePreview();
        }
    });

    document.getElementById('btnSavePaymentProfile').addEventListener('click', () => {
        savedPayments.push({
            payArch: els.paymentArchType.value, bank: els.bankDetails.value, stripe: document.getElementById('payUrl').value, payMethodText: document.getElementById('payMethod').value,
            bTitle: document.getElementById('bankAccTitle').value, bName: document.getElementById('bankName').value, bAcc: document.getElementById('bankAccNo').value,
            bIban: document.getElementById('bankIban').value, bSwift: document.getElementById('bankSwift').value, bBranch: document.getElementById('bankBranch').value,
            bCode: document.getElementById('bankCode').value, bRef: document.getElementById('bankRef').value
        });
        localStorage.setItem('rgp_payments', JSON.stringify(savedPayments));
        updateDropdowns(); alert("Payment Profile Saved!");
    });

    document.getElementById('savedPaymentsDropdown').addEventListener('change', (e) => {
        if(e.target.value !== "") {
            const p = savedPayments[e.target.value];
            els.paymentArchType.value = p.payArch;
            els.bankDetails.value = p.bank || '';
            document.getElementById('payUrl').value = p.stripe || '';
            document.getElementById('payMethod').value = p.payMethodText || '';
            
            document.getElementById('bankAccTitle').value = p.bTitle || '';
            document.getElementById('bankName').value = p.bName || '';
            document.getElementById('bankAccNo').value = p.bAcc || '';
            document.getElementById('bankIban').value = p.bIban || '';
            document.getElementById('bankSwift').value = p.bSwift || '';
            document.getElementById('bankBranch').value = p.bBranch || '';
            document.getElementById('bankCode').value = p.bCode || '';
            document.getElementById('bankRef').value = p.bRef || '';
            
            els.paymentArchType.dispatchEvent(new Event('change'));
            updatePreview();
        }
    });

    // History & Dashboard
    const renderHistoryLogs = (filter = "") => {
        els.historyLogsContainer.innerHTML = '';
        let totalAmount = 0;
        document.getElementById('dashTotalClients').textContent = savedClients.length;

        const filtered = historyLogs.filter(h => 
            h.custName.toLowerCase().includes(filter.toLowerCase()) || 
            h.number.toLowerCase().includes(filter.toLowerCase())
        );

        if(filtered.length === 0) { els.historyLogsContainer.innerHTML = `<p class="text-sm" style="color:var(--text-secondary);">No history found.</p>`; }
        
        filtered.forEach((h, idx) => {
            let numericVal = parseFloat(h.totalVal.replace(/[^0-9.-]+/g,"")) || 0;
            totalAmount += numericVal;
            els.historyLogsContainer.innerHTML += `
                <div class="list-item">
                    <div><strong>${h.custName || 'Unknown Customer'}</strong><br><small>${h.number} | ${h.date} | Total: ${h.totalVal}</small></div>
                    <div>
                        <button class="btn-secondary text-sm" onclick="app.loadHistoryItem(${historyLogs.indexOf(h)})">Load</button> 
                        <button class="btn-danger text-sm" onclick="app.deleteHistoryItem(${historyLogs.indexOf(h)})">Del</button>
                    </div>
                </div>`;
        });
        
        document.getElementById('dashTotalInvoiced').textContent = formatMoney(totalAmount);
    };

    document.getElementById('searchHistory').addEventListener('input', (e) => renderHistoryLogs(e.target.value));

    document.getElementById('btnSaveHistory').addEventListener('click', () => {
        if(!validateForm()) return;
        historyLogs.push({
            bizName: document.getElementById('bizName').value, bizEmail: document.getElementById('bizEmail').value, bizPhone: document.getElementById('bizPhone').value, bizAddress: document.getElementById('bizAddress').value,
            custName: document.getElementById('custName').value, custCompany: document.getElementById('custCompany').value, custEmail: document.getElementById('custEmail').value, custPhone: document.getElementById('custPhone').value, custAddress: document.getElementById('custAddress').value,
            currency: els.currencySelect.value, notes: els.notes.value, terms: els.terms.value,
            number: document.getElementById('receiptNumber').value, date: document.getElementById('issueDate').value, type: document.getElementById('receiptType').value, totalVal: document.getElementById('prevTotal').textContent,
            items: JSON.parse(JSON.stringify(state.items)), discount: els.discountVal.value, tax: els.taxRate.value, shipping: els.shippingCost.value, themeColor: els.themeColorSelect.value,
            payArch: els.paymentArchType.value, bank: els.bankDetails.value, stripe: document.getElementById('payUrl').value, payMethodText: document.getElementById('payMethod').value
        });
        localStorage.setItem('rgp_history', JSON.stringify(historyLogs)); renderHistoryLogs(); alert("Saved Successfully.");
    });

    // CSV Export
    document.getElementById('btnExportCSV').addEventListener('click', () => {
        if(historyLogs.length === 0) return alert("No history to export.");
        let csv = "Invoice Number,Date,Customer,Total Amount,Type\n";
        historyLogs.forEach(h => { csv += `"${h.number}","${h.date}","${h.custName}","${h.totalVal}","${h.type}"\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'invoice_history.csv'; a.click();
    });

    // JSON Backup / Restore
    document.getElementById('btnBackupJSON').addEventListener('click', () => {
        const fullData = { history: historyLogs, clients: savedClients, payments: savedPayments, items: itemMemory };
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'exprt_backup.json'; a.click();
    });

    document.getElementById('jsonUpload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if(data.history) { historyLogs = data.history; localStorage.setItem('rgp_history', JSON.stringify(historyLogs)); }
                if(data.clients) { savedClients = data.clients; localStorage.setItem('rgp_clients', JSON.stringify(savedClients)); }
                if(data.payments) { savedPayments = data.payments; localStorage.setItem('rgp_payments', JSON.stringify(savedPayments)); }
                if(data.items) { itemMemory = data.items; localStorage.setItem('rgp_item_memory', JSON.stringify(itemMemory)); }
                updateDropdowns(); updateItemMemoryList(); renderHistoryLogs();
                alert("Backup Restored Successfully!");
            } catch(err) { alert("Invalid JSON Backup File."); }
        };
        reader.readAsText(file);
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        if(confirm("Reset entire form?")) {
            document.querySelectorAll('input:not([type="file"]):not(#themeColorSelect), textarea').forEach(el => el.value = '');
            document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            state.items = [{ id: Date.now(), desc: '', qty: '', price: '' }];
            document.getElementById('receiptNumber').value = generateAutoNumber();
            document.getElementById('issueDate').valueAsDate = new Date();
            els.taxLabelInput.value = 'Tax';
            renderItemsEditor(); updatePreview();
        }
    });

    window.app = {
        loadHistoryItem: (i) => {
            const h = historyLogs[i];
            
            ['bizName', 'bizEmail', 'bizPhone', 'bizAddress', 'custName', 'custCompany', 'custEmail', 'custPhone', 'custAddress', 'receiptNumber', 'issueDate'].forEach(id => {
                if(document.getElementById(id)) document.getElementById(id).value = h[id] || '';
            });
            
            if(h.currency) els.currencySelect.value = h.currency;
            if(h.notes !== undefined) els.notes.value = h.notes;
            if(h.terms !== undefined) els.terms.value = h.terms;
            
            document.getElementById('receiptType').value = h.type || 'Invoice'; els.discountVal.value = h.discount || ''; els.taxRate.value = h.tax || ''; els.shippingCost.value = h.shipping || '';
            if(h.themeColor) { els.themeColorSelect.value = h.themeColor; document.documentElement.style.setProperty('--receipt-theme-color', h.themeColor); document.documentElement.style.setProperty('--receipt-light-bg', h.themeColor + '15'); }
            if(h.payArch) els.paymentArchType.value = h.payArch; 
            
            if(h.bank) {
                els.bankDetails.value = h.bank; 
                const bLines = h.bank.split('\n');
                bLines.forEach(l => {
                    if(l.includes('Account Title:')) document.getElementById('bankAccTitle').value = l.split(':')[1].trim();
                    if(l.includes('Bank Name:')) document.getElementById('bankName').value = l.split(':')[1].trim();
                    if(l.includes('Account No:')) document.getElementById('bankAccNo').value = l.split(':')[1].trim();
                    if(l.includes('IBAN:')) document.getElementById('bankIban').value = l.split(':')[1].trim();
                });
            }
            if(h.stripe) document.getElementById('payUrl').value = h.stripe; if(h.payMethodText) document.getElementById('payMethod').value = h.payMethodText;
            
            els.paymentArchType.dispatchEvent(new Event('change')); 
            state.items = (h.items || [{ desc: '', qty: '', price: '' }]).map((it, idx) => ({ ...it, id: Date.now() + idx }));
            renderItemsEditor(); updatePreview(); alert("Invoice Restored!");
        },
        deleteHistoryItem: (i) => { if(confirm("Delete this log?")) { historyLogs.splice(i, 1); localStorage.setItem('rgp_history', JSON.stringify(historyLogs)); renderHistoryLogs(document.getElementById('searchHistory').value); } },
        showAuth: (type) => {
            const modal = document.getElementById('authModal');
            document.getElementById('authTitle').innerText = type === 'login' ? 'Login' : 'Create Account';
            document.getElementById('btnSubmitAuth').innerText = type === 'login' ? 'Login' : 'Sign Up';
            document.getElementById('authSwitchText').innerHTML = type === 'login' 
                ? `Don't have an account? <a onclick="app.showAuth('signup')">Sign up</a>` 
                : `Already have an account? <a onclick="app.showAuth('login')">Login</a>`;
            modal.classList.add('active');
        }
    };
    
    document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', (e) => e.target.closest('.modal-overlay').classList.remove('active')));
    renderItemsEditor(); renderHistoryLogs(); updatePreview();
});
