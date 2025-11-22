// デフォルト為替レート (1 JPY = 0.6 INR)
// let exchangeRate = parseFloat(localStorage.getItem('exchangeRate')) || 0.6;

// DOM要素
const currencyInputs = {
    jpy: document.getElementById('jpy'),
    inr: document.getElementById('inr'),
    vnd: document.getElementById('vnd'),
    idr: document.getElementById('idr'),
    usd: document.getElementById('usd'),
    lakh: document.getElementById('lakh'),
    crore: document.getElementById('crore')
};

const areaInputs = {
    acre: document.getElementById('acre'),
    sqft: document.getElementById('sqft'),
    hectare: document.getElementById('hectare'),
    sqm: document.getElementById('sqm'),
    tsubo: document.getElementById('tsubo')
};

const currencyMode = document.getElementById('currencyMode');
const areaMode = document.getElementById('areaMode');
const tabBtns = document.querySelectorAll('.tab-btn');
const settingsBtn = document.getElementById('settingsBtn');
const historyBtn = document.getElementById('historyBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsModal = document.getElementById('settingsModal');
const historyModal = document.getElementById('historyModal');
const saveSettings = document.getElementById('saveSettings');
const exchangeRateInput = document.getElementById('exchangeRate');
const usdRateInput = document.getElementById('usdRate');
const vndRateInput = document.getElementById('vndRate');
const idrRateInput = document.getElementById('idrRate');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const saveCurrencyBtn = document.getElementById('saveCurrencyBtn');
const saveAreaBtn = document.getElementById('saveAreaBtn');
const saveNoteModal = document.getElementById('saveNoteModal');
const noteInput = document.getElementById('noteInput');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');

// 履歴管理
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
const MAX_HISTORY = 20;

// 現在の変換データを一時保存
let currentConversion = {
    currency: null,
    area: null
};

// 現在保存しようとしているモード
let savingMode = null;

// タブ切り替え
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        // タブのアクティブ状態を切り替え
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // コンテンツの表示切り替え
        if (mode === 'currency') {
            currencyMode.classList.add('active');
            areaMode.classList.remove('active');
        } else {
            areaMode.classList.add('active');
            currencyMode.classList.remove('active');
        }
    });
});

// リセット機能
resetBtn.addEventListener('click', () => {
    // 全ての入力フィールドをクリア
    Object.values(currencyInputs).forEach(input => input.value = '');
    Object.values(areaInputs).forEach(input => input.value = '');
});

// 設定モーダル
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    exchangeRateInput.value = exchangeRate;
    usdRateInput.value = usdRate;
    vndRateInput.value = vndRate;
    idrRateInput.value = idrRate;
});

// 履歴モーダル
historyBtn.addEventListener('click', () => {
    historyModal.classList.add('active');
    displayHistory();
});

// モーダルを閉じる
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
        historyModal.classList.remove('active');
        saveNoteModal.classList.remove('active');
    });
});

// モーダル外クリックで閉じる
[settingsModal, historyModal, saveNoteModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

saveSettings.addEventListener('click', () => {
    const newRate = parseFloat(exchangeRateInput.value);
    const newUsdRate = parseFloat(usdRateInput.value);
    const newVndRate = parseFloat(vndRateInput.value);
    const newIdrRate = parseFloat(idrRateInput.value);
    let changed = false;
    if (newRate && newRate > 0) {
        exchangeRate = newRate;
        localStorage.setItem('exchangeRate', exchangeRate);
        changed = true;
    }
    if (newUsdRate && newUsdRate > 0) {
        usdRate = newUsdRate;
        localStorage.setItem('usdRate', usdRate);
        changed = true;
    }
    if (newVndRate && newVndRate > 0) {
        vndRate = newVndRate;
        localStorage.setItem('vndRate', vndRate);
        changed = true;
    }
    if (newIdrRate && newIdrRate > 0) {
        idrRate = newIdrRate;
        localStorage.setItem('idrRate', idrRate);
        changed = true;
    }
    if (changed) {
        settingsModal.classList.remove('active');
        // 現在の入力値で再計算
        const activeInput = Object.values(currencyInputs).find(input => input.value !== '');
        if (activeInput) {
            activeInput.dispatchEvent(new Event('input'));
        }
    }
});

// 履歴をクリア
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Delete all history?')) {
        conversionHistory = [];
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
        displayHistory();
    }
});

// 通貨変換を履歴に保存
saveCurrencyBtn.addEventListener('click', () => {
    if (currentConversion.currency) {
        savingMode = 'currency';
        noteInput.value = '';
        saveNoteModal.classList.add('active');
    } else {
        alert('No conversion data to save');
    }
});

// 面積変換を履歴に保存
saveAreaBtn.addEventListener('click', () => {
    if (currentConversion.area) {
        savingMode = 'area';
        noteInput.value = '';
        saveNoteModal.classList.add('active');
    } else {
        alert('No conversion data to save');
    }
});

// メモ付きで保存を確定
confirmSaveBtn.addEventListener('click', () => {
    const note = noteInput.value.trim();
    if (savingMode === 'currency' && currentConversion.currency) {
        const data = currentConversion.currency;
        saveToHistory('currency', data.fromUnit, data.fromValue, data.toUnit, data.toValue, note);
        saveNoteModal.classList.remove('active');
        alert('Saved to history!');
    } else if (savingMode === 'area' && currentConversion.area) {
        const data = currentConversion.area;
        saveToHistory('area', data.fromUnit, data.fromValue, data.toUnit, data.toValue, note);
        saveNoteModal.classList.remove('active');
        alert('Saved to history!');
    }
    savingMode = null;
});

// ========== 履歴機能 ==========

function saveToHistory(mode, fromUnit, fromValue, toUnit, toValue, note = '') {
    const historyItem = {
        mode: mode,
        fromUnit: fromUnit,
        fromValue: fromValue,
        toUnit: toUnit,
        toValue: toValue,
        note: note,
        timestamp: new Date().toISOString()
    };
    
    conversionHistory.unshift(historyItem);
    
    // 最大件数を超えたら古いものを削除
    if (conversionHistory.length > MAX_HISTORY) {
        conversionHistory = conversionHistory.slice(0, MAX_HISTORY);
    }
    
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

function displayHistory() {
    if (conversionHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No history yet</p>';
        return;
    }
    
    historyList.innerHTML = conversionHistory.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const modeEmoji = item.mode === 'currency' ? '💰' : '📐';
        const noteHtml = item.note ? `<div class="history-note">📝 ${item.note}</div>` : '';
        
        return `
            <div class="history-item" data-item='${JSON.stringify(item)}'>
                <div class="history-item-header">
                    <span class="history-mode">${modeEmoji} ${item.mode === 'currency' ? 'Currency' : 'Area'}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
                <div class="history-conversion">
                    ${item.fromValue} ${item.fromUnit} → ${item.toValue} ${item.toUnit}
                </div>
                ${noteHtml}
            </div>
        `;
    }).join('');
    
    // 履歴アイテムをクリックしたら値を復元
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const data = JSON.parse(item.dataset.item);
            restoreFromHistory(data);
            historyModal.classList.remove('active');
        });
    });
}

function restoreFromHistory(data) {
    // 適切なモードに切り替え
    const targetMode = data.mode === 'currency' ? 'currency' : 'area';
    tabBtns.forEach(btn => {
        if (btn.dataset.mode === targetMode) {
            btn.click();
        }
    });
    
    // 値を復元
    if (data.mode === 'currency') {
        const unitMap = {
            'USD': 'usd',
            'JPY': 'jpy',
            'IDR': 'idr',
            'VND': 'vnd',
            'INR': 'inr',
            'Lakh': 'lakh',
            'Crore': 'crore'
        };
        const inputId = unitMap[data.fromUnit];
        if (inputId && currencyInputs[inputId]) {
            // カンマを削除した数値を設定
            const numValue = data.fromValue.replace(/,/g, '');
            currencyInputs[inputId].value = numValue;
            currencyInputs[inputId].dispatchEvent(new Event('input'));
        }
    } else {
        const unitMap = {
            'Acre': 'acre',
            'Square Feet': 'sqft',
            'Hectare': 'hectare',
            'Square Meter': 'sqm',
            'Tsubo': 'tsubo'
        };
        const inputId = unitMap[data.fromUnit];
        if (inputId && areaInputs[inputId]) {
            areaInputs[inputId].value = data.fromValue;
            areaInputs[inputId].dispatchEvent(new Event('input'));
        }
    }
}

// ========== 通貨変換 ==========

// 1 ラック = 100,000 ルピー
// 1 クロール = 100 ラック = 10,000,000 ルピー

// 桁区切りを追加するヘルパー関数
function formatWithCommas(value, decimals = 2) {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    // 小数点以下を表示しない場合
    if (decimals === 0) {
        const rounded = Math.round(num);
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    // 小数点以下の桁数を指定して固定
    const fixed = num.toFixed(decimals);
    const [integer, decimal] = fixed.split('.');
    
    // 3桁ごとにカンマを挿入
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
}

// カンマを削除して数値を取得
function parseNumber(value) {
    if (typeof value === 'string') {
        return parseFloat(value.replace(/,/g, ''));
    }
    return parseFloat(value);
}

// リアルタイム入力中にカンマを挿入（小数点も維持）
function formatInputWithCommas(value) {
    // カンマを削除
    let cleaned = value.replace(/,/g, '');
    
    // 小数点で分割
    const parts = cleaned.split('.');
    
    // 整数部分にカンマを挿入
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // 小数点がある場合は結合
    return parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0];
}

// 為替レート（1 JPY = ?）
let exchangeRate = parseFloat(localStorage.getItem('exchangeRate')) || 0.6; // 1 JPY = ? INR
let usdRate = parseFloat(localStorage.getItem('usdRate')) || 0.0072; // 1 JPY = ? USD
let vndRate = parseFloat(localStorage.getItem('vndRate')) || 210; // 1 JPY = ? VND
let idrRate = parseFloat(localStorage.getItem('idrRate')) || 123; // 1 JPY = ? IDR

function convertCurrency(sourceId, value) {
    let toUnit, toValue;
    let jpy = 0, inr = 0, usd = 0, idr = 0, vnd = 0, lakh = 0, crore = 0;
    const val = parseFloat(typeof value === 'string' ? value.replace(/,/g, '') : value);
    if (isNaN(val)) return;
    switch (sourceId) {
        case 'jpy':
            jpy = val;
            inr = jpy * exchangeRate;
            usd = jpy * usdRate;
            idr = jpy * idrRate;
            vnd = jpy * vndRate;
            lakh = inr / 100000;
            crore = inr / 10000000;
            break;
        case 'inr':
            inr = val;
            jpy = inr / exchangeRate;
            usd = jpy * usdRate;
            idr = jpy * idrRate;
            vnd = jpy * vndRate;
            lakh = inr / 100000;
            crore = inr / 10000000;
            break;
        case 'usd':
            usd = val;
            jpy = usd / usdRate;
            inr = jpy * exchangeRate;
            idr = jpy * idrRate;
            vnd = jpy * vndRate;
            lakh = inr / 100000;
            crore = inr / 10000000;
            break;
        case 'idr':
            idr = val;
            jpy = idr / idrRate;
            inr = jpy * exchangeRate;
            usd = jpy * usdRate;
            vnd = jpy * vndRate;
            lakh = inr / 100000;
            crore = inr / 10000000;
            break;
        case 'vnd':
            vnd = val;
            jpy = vnd / vndRate;
            inr = jpy * exchangeRate;
            usd = jpy * usdRate;
            idr = jpy * idrRate;
            lakh = inr / 100000;
            crore = inr / 10000000;
            break;
        case 'lakh':
            lakh = val;
            inr = lakh * 100000;
            jpy = inr / exchangeRate;
            usd = jpy * usdRate;
            idr = jpy * idrRate;
            vnd = jpy * vndRate;
            crore = inr / 10000000;
            break;
        case 'crore':
            crore = val;
            inr = crore * 10000000;
            jpy = inr / exchangeRate;
            usd = jpy * usdRate;
            idr = jpy * idrRate;
            vnd = jpy * vndRate;
            lakh = inr / 100000;
            break;
    }
    // 値をセット（入力元以外）
    if (sourceId !== 'jpy') currencyInputs.jpy.value = formatWithCommas(jpy, 0);
    if (sourceId !== 'inr') currencyInputs.inr.value = formatWithCommas(inr, 0);
    if (sourceId !== 'usd') currencyInputs.usd.value = formatWithCommas(usd, 2);
    if (sourceId !== 'idr') currencyInputs.idr.value = formatWithCommas(idr, 0);
    if (sourceId !== 'vnd') currencyInputs.vnd.value = formatWithCommas(vnd, 0);
    if (sourceId !== 'lakh') currencyInputs.lakh.value = formatWithCommas(lakh, 2);
    if (sourceId !== 'crore') currencyInputs.crore.value = formatWithCommas(crore, 2);
    // 保存用
    currentConversion.currency = {
        fromUnit: sourceId.toUpperCase(),
        fromValue: value,
        toUnit: '',
        toValue: ''
    };
}

// 通貨入力イベント
Object.entries(currencyInputs).forEach(([id, input]) => {
    // jpy, inr, vnd, idr, usd: カンマ区切り、小数点なし（usdのみ2桁）
    if (['jpy', 'inr', 'vnd', 'idr'].includes(id)) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            value = value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const formattedValue = formatInputWithCommas(value);
            e.target.value = formattedValue;
            const diff = formattedValue.length - oldValue.length;
            const newPos = cursorPos + diff;
            e.target.setSelectionRange(newPos, newPos);
            convertCurrency(id, value);
        });
        input.addEventListener('focus', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value) {
                e.target.value = value;
            }
        });
        input.addEventListener('blur', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                e.target.value = formatWithCommas(value, 0);
            }
        });
    } else if (id === 'usd') {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            value = value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const formattedValue = formatInputWithCommas(value);
            e.target.value = formattedValue;
            const diff = formattedValue.length - oldValue.length;
            const newPos = cursorPos + diff;
            e.target.setSelectionRange(newPos, newPos);
            convertCurrency(id, value);
        });
        input.addEventListener('focus', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value) {
                e.target.value = value;
            }
        });
        input.addEventListener('blur', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                e.target.value = formatWithCommas(value, 2);
            }
        });
    } else if (id === 'lakh' || id === 'crore') {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            value = value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const formattedValue = formatInputWithCommas(value);
            e.target.value = formattedValue;
            const diff = formattedValue.length - oldValue.length;
            const newPos = cursorPos + diff;
            e.target.setSelectionRange(newPos, newPos);
            convertCurrency(id, value);
        });
        input.addEventListener('focus', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value) {
                e.target.value = value;
            }
        });
        input.addEventListener('blur', (e) => {
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                e.target.value = formatWithCommas(value, 2);
            }
        });
    }
});

// ========== 面積変換 ==========

// 換算率（平方メートル基準）
const areaConversions = {
    sqm: 1,                    // 平方メートル (基準)
    sqft: 10.7639,             // 1 m² = 10.7639 sq ft
    acre: 0.000247105,         // 1 m² = 0.000247105 acre
    hectare: 0.0001,           // 1 m² = 0.0001 hectare
    tsubo: 0.3025             // 1 m² = 0.3025 坪
};

function convertArea(sourceId, value) {
    // カンマを削除して数値を取得
    const cleanValue = typeof value === 'string' ? value.replace(/,/g, '') : value;
    
    if (cleanValue === '' || isNaN(cleanValue)) {
        // 空欄の場合は全てクリア
        Object.values(areaInputs).forEach(input => {
            if (input.id !== sourceId) input.value = '';
        });
        return;
    }

    const val = parseFloat(cleanValue);
    
    const unitNames = {
        acre: 'Acre',
        sqft: 'Square Feet',
        hectare: 'Hectare',
        sqm: 'Square Meter',
        tsubo: 'Tsubo'
    };
    
    // まず入力値を平方メートルに変換
    const sqmValue = val / areaConversions[sourceId];
    
    let firstConversion = null;
    
    // 平方メートルから他の単位へ変換
    Object.entries(areaInputs).forEach(([id, input]) => {
        if (id !== sourceId) {
            const converted = sqmValue * areaConversions[id];
            
            // カンマ区切り、小数点1桁で表示
            const displayValue = formatWithCommas(converted, 1);
            
            input.value = displayValue;
            
            // 最初の変換結果を履歴用に保存
            if (!firstConversion) {
                firstConversion = {
                    unit: unitNames[id],
                    value: displayValue
                };
            }
        }
    });
    
    // 現在の変換データを保存（ボタンで保存する用）
    if (firstConversion) {
        currentConversion.area = {
            fromUnit: unitNames[sourceId],
            fromValue: val.toString(),
            toUnit: firstConversion.unit,
            toValue: firstConversion.value
        };
    }
}

// 面積入力イベント
Object.entries(areaInputs).forEach(([id, input]) => {
    // カンマ区切り、小数点1桁
    input.addEventListener('input', (e) => {
        // カンマを削除
        let value = e.target.value.replace(/,/g, '');
        
        // 数値と小数点のみを許可
        value = value.replace(/[^\d.]/g, '');
        
        // 小数点が複数ある場合は最初の1つだけ残す
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // カーソル位置を保存
        const cursorPos = e.target.selectionStart;
        const oldValue = e.target.value;
        
        // リアルタイムでカンマを挿入
        const formattedValue = formatInputWithCommas(value);
        e.target.value = formattedValue;
        
        // カーソル位置を調整
        const diff = formattedValue.length - oldValue.length;
        const newPos = cursorPos + diff;
        e.target.setSelectionRange(newPos, newPos);
        
        // 変換実行
        convertArea(id, value);
    });
    
    input.addEventListener('focus', (e) => {
        // フォーカス時はカンマを削除して編集しやすくする
        const value = e.target.value.replace(/,/g, '');
        if (value) {
            e.target.value = value;
        }
    });
    
    input.addEventListener('blur', (e) => {
        // フォーカスが外れたときに桁区切りを追加（小数点1桁）
        const value = e.target.value.replace(/,/g, '');
        if (value && !isNaN(value) && value !== '') {
            e.target.value = formatWithCommas(value, 1);
        }
    });
});

// Service Worker登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => console.log('Service Worker registered'))
            .catch(error => console.log('Service Worker registration failed:', error));
    });
}
