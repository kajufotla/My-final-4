// ==========================================
// 2. utils.js - Core Utilities & Logic
// ==========================================

window.AppUtils = {
  sanitizeHTML: (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    });
  },

  safeParseJSON: (jsonStr, fallback) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : fallback;
    } catch (e) {
      console.warn("Corrupt JSON structure detected. Restoring clean data layout.", e);
      return fallback;
    }
  },

  validateUploadedFile: (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const maxSize = 2 * 1024 * 1024; // 2MB Limit
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file format. Please upload JPG, PNG, or SVG.");
      return false;
    }
    if (file.size > maxSize) {
      alert("File is too large. Maximum size limit is 2MB.");
      return false;
    }
    return true;
  },

  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },

  formatMoney: (amount, currencyVal) => {
    const val = currencyVal || 'USD|$';
    const parts = val.split('|');
    const code = parts[0] || 'USD';
    const symbol = parts[1] || '';
    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en-US', { style: 'currency', currency: code }).format(amount || 0);
    } catch(e) {
      return `${symbol} ${new Intl.NumberFormat(document.documentElement.lang || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;
    }
  },

  generateAutoNumber: (historyLogs) => {
    const year = new Date().getFullYear();
    let currentSequence = parseInt(localStorage.getItem('rgp_invoice_seq_counter') || '0', 10);
    
    if (historyLogs && historyLogs.length > 0) {
      historyLogs.forEach(h => {
        if (h.number && h.number.startsWith(`INV-${year}-`)) {
          const extractedId = parseInt(h.number.split('-')[2], 10);
          if (!isNaN(extractedId) && extractedId > currentSequence) {
            currentSequence = extractedId;
          }
        }
      });
    }

    const nextSequence = currentSequence + 1;
    localStorage.setItem('rgp_invoice_seq_counter', nextSequence.toString());
    return `INV-${year}-${nextSequence.toString().padStart(5, '0')}`;
  }
};

window.UndoRedoEngine = {
  history: [], index: -1, maxStates: 50, isProcessing: false,
  pushState(stateData) {
    if (this.isProcessing) return;
    if (this.index < this.history.length - 1) {
      this.history = this.history.slice(0, this.index + 1);
    }
    this.history.push(JSON.stringify(stateData));
    if (this.history.length > this.maxStates) this.history.shift();
    this.index = this.history.length - 1;
  },
  undo(callback) {
    if (this.index > 0) {
      this.isProcessing = true; this.index--;
      callback(JSON.parse(this.history[this.index]));
      this.isProcessing = false;
    }
  },
  redo(callback) {
    if (this.index < this.history.length - 1) {
      this.isProcessing = true; this.index++;
      callback(JSON.parse(this.history[this.index]));
      this.isProcessing = false;
    }
  }
};
