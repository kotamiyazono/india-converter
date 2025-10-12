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
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const saveSettings = document.getElementById('saveSettings');
const exchangeRateInput = document.getElementById('exchangeRate');

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

// 設定モーダル
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    exchangeRateInput.value = exchangeRate;
});

closeModal.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
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

// ========== 通貨変換 ==========

// 1 ラック = 100,000 ルピー
// 1 クロール = 100 ラック = 10,000,000 ルピー

// 桁区切りを追加するヘルパー関数
function formatWithCommas(value, decimals = 2) {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
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
    
    switch(sourceId) {
        case 'jpy':
            // 円からルピーへ
            const inr = val * exchangeRate;
            currencyInputs.inr.value = formatWithCommas(inr, 2);
            currencyInputs.lakh.value = (inr / 100000).toFixed(4);
            currencyInputs.crore.value = (inr / 10000000).toFixed(6);
            break;
            
        case 'inr':
            // ルピーから他の単位へ
            currencyInputs.jpy.value = formatWithCommas(val / exchangeRate, 2);
            currencyInputs.lakh.value = (val / 100000).toFixed(4);
            currencyInputs.crore.value = (val / 10000000).toFixed(6);
            break;
            
        case 'lakh':
            // ラックから他の単位へ
            const inrFromLakh = val * 100000;
            currencyInputs.inr.value = formatWithCommas(inrFromLakh, 2);
            currencyInputs.jpy.value = formatWithCommas(inrFromLakh / exchangeRate, 2);
            currencyInputs.crore.value = (val / 100).toFixed(6);
            break;
            
        case 'crore':
            // クロールから他の単位へ
            const inrFromCrore = val * 10000000;
            currencyInputs.inr.value = formatWithCommas(inrFromCrore, 2);
            currencyInputs.jpy.value = formatWithCommas(inrFromCrore / exchangeRate, 2);
            currencyInputs.lakh.value = (val * 100).toFixed(4);
            break;
    }
}

// 通貨入力イベント
Object.entries(currencyInputs).forEach(([id, input]) => {
    // 日本円とルピーの入力フィールドにフォーカス時のイベント
    if (id === 'jpy' || id === 'inr') {
        // 入力中の処理
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
            // フォーカスが外れたときに桁区切りを追加
            const value = e.target.value.replace(/,/g, '');
            if (value && !isNaN(value) && value !== '') {
                e.target.value = formatWithCommas(value, 2);
            }
        });
    } else {
        // ラックとクロールは通常の入力処理
        input.addEventListener('input', (e) => {
            convertCurrency(id, e.target.value);
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
    if (value === '' || isNaN(value)) {
        // 空欄の場合は全てクリア
        Object.values(areaInputs).forEach(input => {
            if (input.id !== sourceId) input.value = '';
        });
        return;
    }

    const val = parseFloat(value);
    
    // まず入力値を平方メートルに変換
    const sqmValue = val / areaConversions[sourceId];
    
    // 平方メートルから他の単位へ変換
    Object.entries(areaInputs).forEach(([id, input]) => {
        if (id !== sourceId) {
            const converted = sqmValue * areaConversions[id];
            
            // 適切な桁数で表示
            if (converted < 0.0001) {
                input.value = converted.toExponential(4);
            } else if (converted < 1) {
                input.value = converted.toFixed(6);
            } else if (converted < 100) {
                input.value = converted.toFixed(4);
            } else {
                input.value = converted.toFixed(2);
            }
        }
    });
}

// 面積入力イベント
Object.entries(areaInputs).forEach(([id, input]) => {
    input.addEventListener('input', (e) => {
        convertArea(id, e.target.value);
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
