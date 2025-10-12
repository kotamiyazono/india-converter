// デフォルト為替レート (1 JPY = 0.6 INR)
let exchangeRate = parseFloat(localStorage.getItem('exchangeRate')) || 0.6;

// DOM要素
const currencyInputs = {
    jpy: document.getElementById('jpy'),
    inr: document.getElementById('inr'),
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
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const saveCurrencyBtn = document.getElementById('saveCurrencyBtn');
const saveAreaBtn = document.getElementById('saveAreaBtn');

// 履歴管理
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];
const MAX_HISTORY = 20;

// 現在の変換データを一時保存
let currentConversion = {
    currency: null,
    area: null
};

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
    });
});

// モーダル外クリックで閉じる
[settingsModal, historyModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

saveSettings.addEventListener('click', () => {
    const newRate = parseFloat(exchangeRateInput.value);
    if (newRate && newRate > 0) {
        exchangeRate = newRate;
        localStorage.setItem('exchangeRate', exchangeRate);
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
    if (confirm('履歴を全て削除しますか？')) {
        conversionHistory = [];
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
        displayHistory();
    }
});

// 通貨変換を履歴に保存
saveCurrencyBtn.addEventListener('click', () => {
    if (currentConversion.currency) {
        const data = currentConversion.currency;
        saveToHistory('currency', data.fromUnit, data.fromValue, data.toUnit, data.toValue);
        alert('履歴に保存しました！');
    } else {
        alert('保存する変換データがありません');
    }
});

// 面積変換を履歴に保存
saveAreaBtn.addEventListener('click', () => {
    if (currentConversion.area) {
        const data = currentConversion.area;
        saveToHistory('area', data.fromUnit, data.fromValue, data.toUnit, data.toValue);
        alert('履歴に保存しました！');
    } else {
        alert('保存する変換データがありません');
    }
});

// ========== 履歴機能 ==========

function saveToHistory(mode, fromUnit, fromValue, toUnit, toValue) {
    const historyItem = {
        mode: mode,
        fromUnit: fromUnit,
        fromValue: fromValue,
        toUnit: toUnit,
        toValue: toValue,
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
        historyList.innerHTML = '<p class="empty-message">まだ履歴がありません</p>';
        return;
    }
    
    historyList.innerHTML = conversionHistory.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const modeEmoji = item.mode === 'currency' ? '💰' : '📐';
        
        return `
            <div class="history-item" data-item='${JSON.stringify(item)}'>
                <div class="history-item-header">
                    <span class="history-mode">${modeEmoji} ${item.mode === 'currency' ? '通貨' : '面積'}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
                <div class="history-conversion">
                    ${item.fromValue} ${item.fromUnit} → ${item.toValue} ${item.toUnit}
                </div>
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
            '日本円': 'jpy',
            'インドルピー': 'inr',
            'ラック': 'lakh',
            'クロール': 'crore'
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
            'エーカー': 'acre',
            '平方フィート': 'sqft',
            'ヘクタール': 'hectare',
            '平方メートル': 'sqm',
            '坪': 'tsubo'
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

function convertCurrency(sourceId, value) {
    // カンマを削除して数値を取得
    const cleanValue = typeof value === 'string' ? value.replace(/,/g, '') : value;
    
    if (cleanValue === '' || isNaN(cleanValue)) {
        // 空欄の場合は全てクリア
        Object.values(currencyInputs).forEach(input => {
            if (input.id !== sourceId) input.value = '';
        });
        return;
    }

    const val = parseFloat(cleanValue);
    
    const unitNames = {
        jpy: '日本円',
        inr: 'インドルピー',
        lakh: 'ラック',
        crore: 'クロール'
    };
    
    let toUnit, toValue;
    
    switch(sourceId) {
        case 'jpy':
            // 円からルピーへ
            const inr = val * exchangeRate;
            currencyInputs.inr.value = formatWithCommas(inr, 0);
            currencyInputs.lakh.value = formatWithCommas(inr / 100000, 4);
            currencyInputs.crore.value = formatWithCommas(inr / 10000000, 6);
            toUnit = 'インドルピー';
            toValue = formatWithCommas(inr, 0);
            break;
            
        case 'inr':
            // ルピーから他の単位へ
            const jpy = val / exchangeRate;
            currencyInputs.jpy.value = formatWithCommas(jpy, 0);
            currencyInputs.lakh.value = formatWithCommas(val / 100000, 4);
            currencyInputs.crore.value = formatWithCommas(val / 10000000, 6);
            toUnit = '日本円';
            toValue = formatWithCommas(jpy, 0);
            break;
            
        case 'lakh':
            // ラックから他の単位へ
            const inrFromLakh = val * 100000;
            currencyInputs.inr.value = formatWithCommas(inrFromLakh, 0);
            currencyInputs.jpy.value = formatWithCommas(inrFromLakh / exchangeRate, 0);
            currencyInputs.crore.value = formatWithCommas(val / 100, 6);
            toUnit = 'インドルピー';
            toValue = formatWithCommas(inrFromLakh, 0);
            break;
            
        case 'crore':
            // クロールから他の単位へ
            const inrFromCrore = val * 10000000;
            currencyInputs.inr.value = formatWithCommas(inrFromCrore, 0);
            currencyInputs.jpy.value = formatWithCommas(inrFromCrore / exchangeRate, 0);
            currencyInputs.lakh.value = formatWithCommas(val * 100, 4);
            toUnit = 'インドルピー';
            toValue = formatWithCommas(inrFromCrore, 0);
            break;
    }
    
    // 現在の変換データを保存（ボタンで保存する用）
    if (toUnit && toValue) {
        currentConversion.currency = {
            fromUnit: unitNames[sourceId],
            fromValue: formatWithCommas(val, sourceId === 'jpy' || sourceId === 'inr' ? 0 : (sourceId === 'lakh' ? 4 : 6)),
            toUnit: toUnit,
            toValue: toValue
        };
    }
}

// 通貨入力イベント
Object.entries(currencyInputs).forEach(([id, input]) => {
    // 日本円とルピーの入力フィールドにフォーカス時のイベント
    if (id === 'jpy' || id === 'inr') {
        // 日本円とインドルピー：カンマ区切り、小数点なし
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
            const oldLength = e.target.value.length;
            
            e.target.value = value;
            
            // カーソル位置を復元（カンマ削除を考慮）
            const newLength = value.length;
            const diff = newLength - oldLength;
            e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
            
            // 変換実行
            convertCurrency(id, value);
        });
        
        input.addEventListener('focus', (e) => {
            // フォーカス時はカンマを削除して編集しやすくする
            const value = e.target.value.replace(/,/g, '');
            if (value) {
                e.target.value = value;
            }
        });
        
        input.addEventListener('blur', (e) => {
            // フォーカスが外れたときに桁区切りを追加（小数点なし）
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                e.target.value = formatWithCommas(value, 0);
            }
        });
    } else if (id === 'lakh' || id === 'crore') {
        // ラックとクロール：カンマ区切り、小数点あり
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
            const oldLength = e.target.value.length;
            
            e.target.value = value;
            
            // カーソル位置を復元
            const newLength = value.length;
            const diff = newLength - oldLength;
            e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
            
            // 変換実行
            convertCurrency(id, value);
        });
        
        input.addEventListener('focus', (e) => {
            // フォーカス時はカンマを削除して編集しやすくする
            const value = e.target.value.replace(/,/g, '');
            if (value) {
                e.target.value = value;
            }
        });
        
        input.addEventListener('blur', (e) => {
            // フォーカスが外れたときに桁区切りを追加（小数点あり）
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                const decimals = id === 'lakh' ? 4 : 6;
                e.target.value = formatWithCommas(value, decimals);
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
        acre: 'エーカー',
        sqft: '平方フィート',
        hectare: 'ヘクタール',
        sqm: '平方メートル',
        tsubo: '坪'
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
        const oldLength = e.target.value.length;
        
        e.target.value = value;
        
        // カーソル位置を復元
        const newLength = value.length;
        const diff = newLength - oldLength;
        e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
        
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
