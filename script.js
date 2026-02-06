// 狀態管理
let state = {
    settings: {
        hourlyWage: 183,
        breakTime: 60, // 分鐘
        // Cloud Sync Settings
        gClientId: '',
        gSheetId: ''
    },
    records: [],
    currentSession: null, // { startTime: timestamp }
    // Cloud State
    cloud: {
        tokenClient: null,
        accessToken: null,
        isGisLoaded: false,
        isGapiLoaded: false
    }
};

// DOM 元素
const elements = {
    // 設定
    settingsBtn: document.getElementById('settingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    saveSettingsBtn: document.getElementById('saveSettings'),
    hourlyWageInput: document.getElementById('hourlyWage'),
    breakTimeInput: document.getElementById('breakTime'),
    
    // 備份還原
    backupBtn: document.getElementById('backupBtn'),
    restoreBtn: document.getElementById('restoreBtn'),
    restoreInput: document.getElementById('restoreInput'),
    // 文字備份
    toggleTextBackupBtn: document.getElementById('toggleTextBackupBtn'),
    textBackupArea: document.getElementById('textBackupArea'),
    backupTextarea: document.getElementById('backupTextarea'),
    copyTextBtn: document.getElementById('copyTextBtn'),
    importTextBtn: document.getElementById('importTextBtn'),
    
    // Google Sync
    gClientIdInput: document.getElementById('gClientId'),
    gSheetIdInput: document.getElementById('gSheetId'),
    gAuthBtn: document.getElementById('gAuthBtn'),
    gSyncBtn: document.getElementById('gSyncBtn'),
    gStatus: document.getElementById('gStatus'),

    // 打卡
    clockDisplay: document.getElementById('clockDisplay'),
    dateDisplay: document.getElementById('dateDisplay'),
    clockInBtn: document.getElementById('clockInBtn'),
    clockOutBtn: document.getElementById('clockOutBtn'),

    // 手動輸入
    toggleManualBtn: document.getElementById('toggleManualBtn'),
    manualEntryForm: document.getElementById('manualEntryForm'),
    manualDate: document.getElementById('manualDate'),
    manualStartTime: document.getElementById('manualStartTime'),
    manualEndTime: document.getElementById('manualEndTime'),
    manualBreak: document.getElementById('manualBreak'),
    manualBreakMinutes: document.getElementById('manualBreakMinutes'),
    addManualRecordBtn: document.getElementById('addManualRecord'),

    // 補登/修改休息時間
    toggleCorrectionBtn: document.getElementById('toggleCorrectionBtn'),
    correctionForm: document.getElementById('correctionForm'),
    correctionDate: document.getElementById('correctionDate'),
    correctionBreakMinutes: document.getElementById('correctionBreakMinutes'),
    correctionStatus: document.getElementById('correctionStatus'),
    updateBreakBtn: document.getElementById('updateBreakBtn'),

    // 統計
    todayHours: document.getElementById('todayHours'),
    monthHours: document.getElementById('monthHours'),
    rangeHours: document.getElementById('rangeHours'),
    monthSalary: document.getElementById('monthSalary'),

    // 歷史紀錄
    filterStart: document.getElementById('filterStart'),
    filterEnd: document.getElementById('filterEnd'),
    clearFilterBtn: document.getElementById('clearFilter'),
    exportBtn: document.getElementById('exportBtn'),
    deleteAllBtn: document.getElementById('deleteAllBtn'),
    recordsList: document.getElementById('recordsList')
};

// 初始化
function init() {
    loadData();
    setupEventListeners();
    startClock();
    updateUI();
    
    // 設定預設日期為今天
    const today = new Date().toISOString().split('T')[0];
    elements.manualDate.value = today;
    
    // 初始化補登日期的預設值並觸發查詢
    if (elements.correctionDate) {
        elements.correctionDate.value = today;
        elements.correctionDate.dispatchEvent(new Event('change'));
    }

    // 初始化 Google API
    checkGoogleApiLoaded();
}

function checkGoogleApiLoaded() {
    // 簡單輪詢檢查 Google Scripts 是否載入完成
    const interval = setInterval(() => {
        if (typeof google !== 'undefined' && typeof gapi !== 'undefined') {
            state.cloud.isGisLoaded = true;
            state.cloud.isGapiLoaded = true;
            clearInterval(interval);
            // 初始化 GIS
            if (state.settings.gClientId) {
                initGis();
                gapi.load('client', initGapiClient);
            }
        }
    }, 500);
}

function initGis() {
    state.cloud.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: state.settings.gClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (tokenResponse) => {
            state.cloud.accessToken = tokenResponse.access_token;
            elements.gStatus.textContent = '✅ 已連結 Google';
            elements.gAuthBtn.classList.add('hidden');
            elements.gSyncBtn.classList.remove('hidden');
            syncWithCloud(); // 登入後自動同步
        },
    });
}

async function initGapiClient() {
    await gapi.client.init({
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
}

// 載入資料
function loadData() {
    const savedSettings = localStorage.getItem('workSettings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        state.settings = { ...state.settings, ...parsed }; // 合併新舊設定
        
        elements.hourlyWageInput.value = state.settings.hourlyWage;
        elements.breakTimeInput.value = state.settings.breakTime;
        if (elements.manualBreakMinutes) {
            elements.manualBreakMinutes.value = state.settings.breakTime;
        }
        // Cloud Settings
        if (elements.gClientIdInput) elements.gClientIdInput.value = state.settings.gClientId || '';
        if (elements.gSheetIdInput) elements.gSheetIdInput.value = state.settings.gSheetId || '';
    }

    const savedRecords = localStorage.getItem('workRecords');
    if (savedRecords) {
        state.records = JSON.parse(savedRecords);
    }

    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
        state.currentSession = JSON.parse(savedSession);
    }
}

// 儲存資料
function saveData() {
    localStorage.setItem('workSettings', JSON.stringify(state.settings));
    localStorage.setItem('workRecords', JSON.stringify(state.records));
    if (state.currentSession) {
        localStorage.setItem('currentSession', JSON.stringify(state.currentSession));
    } else {
        localStorage.removeItem('currentSession');
    }
}

// 事件監聽
function setupEventListeners() {
    // 設定相關
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.toggle('hidden');
    });

    elements.saveSettingsBtn.addEventListener('click', () => {
        state.settings.hourlyWage = parseFloat(elements.hourlyWageInput.value) || 0;
        state.settings.breakTime = parseFloat(elements.breakTimeInput.value) || 0;
        // Cloud Settings
        state.settings.gClientId = elements.gClientIdInput.value.trim();
        state.settings.gSheetId = elements.gSheetIdInput.value.trim();
        
        if (elements.manualBreakMinutes) {
            elements.manualBreakMinutes.value = state.settings.breakTime;
        }
        saveData();
        updateUI(); // 重新計算薪資
        elements.settingsPanel.classList.add('hidden');
        alert('設定已儲存');
        
        // Re-init Google if Client ID changed
        if (state.settings.gClientId && state.cloud.isGisLoaded) {
            initGis();
            gapi.load('client', initGapiClient);
        }
    });

    // 備份還原
    elements.backupBtn.addEventListener('click', exportBackup);
    elements.restoreBtn.addEventListener('click', () => elements.restoreInput.click());
    elements.restoreInput.addEventListener('change', importBackup);
    
    // 文字備份相關
    if (elements.toggleTextBackupBtn) {
        elements.toggleTextBackupBtn.addEventListener('click', () => {
            if (elements.textBackupArea.style.display === 'none') {
                elements.textBackupArea.style.display = 'block';
                // 自動產生備份文字
                const backupData = {
                    settings: state.settings,
                    records: state.records,
                    timestamp: new Date().toISOString()
                };
                elements.backupTextarea.value = JSON.stringify(backupData, null, 2);
            } else {
                elements.textBackupArea.style.display = 'none';
            }
        });

        elements.copyTextBtn.addEventListener('click', () => {
            elements.backupTextarea.select();
            document.execCommand('copy');
            alert('✅ 代碼已複製！請貼到另一台裝置的相同欄位中。');
        });

        elements.importTextBtn.addEventListener('click', () => {
            const text = elements.backupTextarea.value.trim();
            if (!text) {
                alert('請先貼上備份代碼');
                return;
            }
            try {
                const data = JSON.parse(text);
                if (data.records && Array.isArray(data.records)) {
                    if (confirm(`確定要從文字代碼還原 ${data.records.length} 筆紀錄嗎？這將會覆蓋現有設定。`)) {
                        state.settings = { ...state.settings, ...data.settings };
                        state.records = data.records;
                        saveData();
                        updateUI();
                        loadData(); 
                        alert('還原成功！');
                        elements.textBackupArea.style.display = 'none';
                    }
                } else {
                    alert('代碼格式錯誤');
                }
            } catch (err) {
                alert('無效的 JSON 代碼');
            }
        });
    }

    // Google Sync
    elements.gAuthBtn.addEventListener('click', () => {
        if (!state.settings.gClientId) {
            alert('請先輸入 Client ID 並儲存設定');
            return;
        }
        if (state.cloud.tokenClient) {
            // Force prompt if needed
            state.cloud.tokenClient.requestAccessToken({prompt: ''});
        } else {
            alert('Google API 尚未初始化，請稍候再試');
        }
    });
    
    elements.gSyncBtn.addEventListener('click', syncWithCloud);

    // 打卡相關
    elements.clockInBtn.addEventListener('click', () => {
        const now = new Date();
        state.currentSession = {
            startTime: now.getTime()
        };
        saveData();
        updateUI();
    });

    elements.clockOutBtn.addEventListener('click', () => {
        if (!state.currentSession) return;
        
        const now = new Date();
        const endTime = now.getTime();
        const startTime = state.currentSession.startTime;
        
        // 計算總分鐘數
        const diffMs = endTime - startTime;
        const diffMinutes = Math.floor(diffMs / 60000);
        
        // 詢問是否扣除休息時間 (如果工作時間超過設定的休息時間)
        let deductBreak = false;
        if (diffMinutes > state.settings.breakTime) {
            deductBreak = confirm(`工作時長為 ${formatDuration(diffMinutes)}。\n是否扣除休息時間 ${state.settings.breakTime} 分鐘？`);
        }

        addRecord({
            startTime: startTime,
            endTime: endTime,
            deductBreak: deductBreak
        });

        state.currentSession = null;
        saveData();
        updateUI();
    });

    // 手動輸入相關
    /* 移除顯示切換邏輯
    elements.toggleManualBtn.addEventListener('click', () => {
        const form = elements.manualEntryForm;
        if (form.style.display === 'none') {
            form.style.display = 'block';
        } else {
            form.style.display = 'none';
        }
    });
    */

    elements.manualBreak.addEventListener('change', (e) => {
        elements.manualBreakMinutes.disabled = !e.target.checked;
    });

    elements.addManualRecordBtn.addEventListener('click', () => {
        const dateStr = elements.manualDate.value;
        const startStr = elements.manualStartTime.value;
        const endStr = elements.manualEndTime.value;
        const deductBreak = elements.manualBreak.checked;
        const breakMinutes = parseFloat(elements.manualBreakMinutes.value) || 0;

        if (!dateStr || !startStr || !endStr) {
            alert('請完整填寫日期與時間');
            return;
        }

        const startTime = new Date(`${dateStr}T${startStr}`).getTime();
        const endTime = new Date(`${dateStr}T${endStr}`).getTime();

        if (endTime <= startTime) {
            alert('下班時間必須晚於上班時間');
            return;
        }

        addRecord({
            startTime: startTime,
            endTime: endTime,
            deductBreak: deductBreak,
            breakDuration: deductBreak ? breakMinutes : 0
        });

        // 重置表單
        elements.manualStartTime.value = '';
        elements.manualEndTime.value = '';
        // Reset break minutes to default
        elements.manualBreakMinutes.value = state.settings.breakTime;
        elements.manualBreak.checked = true;
        
        // elements.manualEntryForm.style.display = 'none'; // 保持顯示
        saveData();
        updateUI();
    });

    // 補登/修改休息時間相關
    /* 移除顯示切換邏輯
    elements.toggleCorrectionBtn.addEventListener('click', () => {
        const form = elements.correctionForm;
        if (form.style.display === 'none') {
            form.style.display = 'block';
            elements.correctionDate.value = new Date().toISOString().split('T')[0];
            elements.correctionDate.dispatchEvent(new Event('change'));
        } else {
            form.style.display = 'none';
        }
    });
    */

    elements.correctionDate.addEventListener('change', () => {
        const dateStr = elements.correctionDate.value;
        if (!dateStr) return;

        const targetDate = new Date(dateStr);
        const startOfDay = targetDate.setHours(0, 0, 0, 0);
        const endOfDay = targetDate.setHours(23, 59, 59, 999);

        const records = state.records.filter(r => r.startTime >= startOfDay && r.startTime <= endOfDay);

        if (records.length === 0) {
            elements.correctionStatus.textContent = '❌ 查無此日期的工時紀錄';
            elements.correctionStatus.style.color = 'var(--danger-color)';
            elements.updateBreakBtn.disabled = true;
            elements.correctionBreakMinutes.value = '';
        } else {
            const count = records.length;
            // 嘗試取得目前的休息時間（優先取 breakDuration，若無則看 settings）
            let currentBreak = 0;
            if (records[0].breakDuration !== undefined) {
                currentBreak = records[0].breakDuration;
            } else if (records[0].deductBreak) {
                currentBreak = state.settings.breakTime;
            }
            
            elements.correctionStatus.textContent = `✅ 找到 ${count} 筆紀錄。目前第一筆休息時間: ${currentBreak} 分鐘`;
            elements.correctionStatus.style.color = 'var(--primary-color)';
            elements.updateBreakBtn.disabled = false;
            elements.correctionBreakMinutes.value = currentBreak;
        }
    });

    elements.updateBreakBtn.addEventListener('click', () => {
        const dateStr = elements.correctionDate.value;
        const newBreak = parseFloat(elements.correctionBreakMinutes.value);

        if (isNaN(newBreak) || newBreak < 0) {
            alert('請輸入有效的休息時間（分鐘）');
            return;
        }

        const targetDate = new Date(dateStr);
        const startOfDay = targetDate.setHours(0, 0, 0, 0);
        const endOfDay = targetDate.setHours(23, 59, 59, 999);

        let updatedCount = 0;
        state.records = state.records.map(r => {
            if (r.startTime >= startOfDay && r.startTime <= endOfDay) {
                updatedCount++;
                const diffMs = r.endTime - r.startTime;
                // 重新計算總工時（扣除新休息時間）
                let totalMinutes = Math.floor(diffMs / 60000) - newBreak;
                if (totalMinutes < 0) totalMinutes = 0;
                
                const hours = (totalMinutes / 60).toFixed(1);
                
                return {
                    ...r,
                    breakDuration: newBreak, // 統一存到 breakDuration
                    breakMinutes: newBreak, // 舊欄位相容
                    deductBreak: newBreak > 0,
                    totalMinutes: totalMinutes,
                    hours: hours
                };
            }
            return r;
        });

        if (updatedCount > 0) {
            saveData();
            updateUI();
            alert(`✅ 已成功更新 ${updatedCount} 筆紀錄的休息時間為 ${newBreak} 分鐘`);
            // 不自動關閉，方便使用者查看更新後的狀態
            elements.correctionDate.dispatchEvent(new Event('change'));
        }
    });

    // 篩選相關
    elements.filterStart.addEventListener('change', updateRecordsList);
    elements.filterEnd.addEventListener('change', updateRecordsList);
    elements.clearFilterBtn.addEventListener('click', () => {
        elements.filterStart.value = '';
        elements.filterEnd.value = '';
        updateRecordsList();
        updateDashboard(); // 也要更新看板
    });

    // 匯出 Excel (CSV)
    elements.exportBtn.addEventListener('click', exportToCSV);

    // 清空所有紀錄
    elements.deleteAllBtn.addEventListener('click', deleteAllRecords);
}

// 備份還原邏輯
function exportBackup() {
    const backupData = {
        settings: state.settings,
        records: state.records,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (data.records && Array.isArray(data.records)) {
                if (confirm(`確定要還原 ${data.records.length} 筆紀錄嗎？這將會覆蓋現有設定。`)) {
                    state.settings = { ...state.settings, ...data.settings };
                    state.records = data.records;
                    saveData();
                    updateUI();
                    loadData(); // Reload input fields
                    alert('還原成功！');
                }
            } else {
                alert('備份檔案格式錯誤');
            }
        } catch (err) {
            alert('無法讀取檔案');
            console.error(err);
        }
        elements.restoreInput.value = ''; // Reset
    };
    reader.readAsText(file);
}

// Google Sheets Sync Logic
async function syncWithCloud() {
    if (!state.settings.gSheetId) {
        alert('請先輸入 Spreadsheet ID');
        return;
    }
    
    elements.gStatus.textContent = '⏳ 同步中...';
    
    try {
        // 1. 讀取 Cloud 資料
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: state.settings.gSheetId,
            range: 'Sheet1!A:F', // 假設資料在 Sheet1
        });
        
        const rows = response.result.values;
        let cloudRecords = [];
        
        if (rows && rows.length > 1) {
            // 解析 Rows (跳過 Header)
            // 格式: ID, StartTime, EndTime, Break, Deduct, Hours
            // 注意: 我們需要一個唯一 ID 來避免重複。如果沒有，用 StartTime 當 key
            rows.slice(1).forEach(row => {
                if (row[1] && row[2]) {
                    cloudRecords.push({
                        startTime: parseInt(row[1]),
                        endTime: parseInt(row[2]),
                        breakDuration: parseFloat(row[3]) || 0,
                        deductBreak: row[4] === 'TRUE',
                        hours: row[5],
                        // Re-calculate derived fields if needed
                        totalMinutes: Math.floor((parseInt(row[2]) - parseInt(row[1])) / 60000) - (parseFloat(row[3]) || 0)
                    });
                }
            });
        }
        
        // 2. 合併資料 (簡單策略: 聯集，以 StartTime 為 Unique Key)
        const recordMap = new Map();
        
        // 先放 Cloud (Cloud 為主? 還是 Local 為主? 這裡假設兩邊都保留)
        cloudRecords.forEach(r => recordMap.set(r.startTime, r));
        // 再放 Local (如果 Local 有修改，覆蓋 Cloud? 這裡假設 Local 較新)
        state.records.forEach(r => recordMap.set(r.startTime, r));
        
        const mergedRecords = Array.from(recordMap.values()).sort((a, b) => a.startTime - b.startTime);
        state.records = mergedRecords;
        
        // 3. 寫回 Cloud (全量覆蓋比較安全)
        const header = ['ID (Ignored)', 'StartTime (Timestamp)', 'EndTime (Timestamp)', 'Break (Min)', 'DeductBreak', 'Hours'];
        const writeRows = [header];
        
        mergedRecords.forEach(r => {
            writeRows.push([
                new Date(r.startTime).toISOString(), // A: Readable Time for ID ref
                r.startTime.toString(),              // B
                r.endTime.toString(),                // C
                (r.breakDuration || 0).toString(),   // D
                r.deductBreak ? 'TRUE' : 'FALSE',    // E
                r.hours.toString()                   // F
            ]);
        });
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: state.settings.gSheetId,
            range: 'Sheet1!A:F',
            valueInputOption: 'RAW',
            resource: { values: writeRows }
        });
        
        saveData();
        updateUI();
        elements.gStatus.textContent = `✅ 同步完成 (${new Date().toLocaleTimeString()})`;
        
    } catch (err) {
        console.error('Sync failed', err);
        elements.gStatus.textContent = '❌ 同步失敗: ' + (err.result?.error?.message || err.message);
        if (err.status === 401 || err.status === 403) {
            elements.gAuthBtn.classList.remove('hidden');
            elements.gSyncBtn.classList.add('hidden');
        }
    }
}

// 匯出 Excel (CSV)
function exportToCSV() {
    if (state.records.length === 0) {
        alert('目前沒有紀錄可匯出');
        return;
    }

    // 欄位標題
    let csvContent = '\uFEFF'; // BOM for UTF-8 in Excel
    csvContent += '日期,上班時間,下班時間,總工時(小時),扣除休息(分鐘)\n';

    // 排序：日期從小到大 (舊 -> 新)
    const sortedRecords = [...state.records].sort((a, b) => a.startTime - b.startTime);

    sortedRecords.forEach(record => {
        const date = new Date(record.startTime);
        const dateStr = date.toLocaleDateString('zh-TW');
        const timeStart = new Date(record.startTime).toLocaleTimeString('zh-TW', { hour12: false });
        const timeEnd = new Date(record.endTime).toLocaleTimeString('zh-TW', { hour12: false });
        
        // 取得休息時間
        let breakDuration = 0;
        if (record.breakDuration !== undefined) {
            breakDuration = record.breakDuration;
        } else if (record.deductBreak) {
            breakDuration = state.settings.breakTime;
        }

        // 確保 CSV 格式正確 (處理逗號等)
        const row = [
            dateStr,
            timeStart,
            timeEnd,
            record.hours,
            breakDuration
        ];
        
        csvContent += row.join(',') + '\n';
    });

    // 建立下載連結
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `工時紀錄_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 清空所有紀錄
function deleteAllRecords() {
    if (state.records.length === 0) return;

    if (confirm('⚠️ 警告：這將會刪除「所有」工時紀錄且無法復原！\n\n確定要清空嗎？')) {
        // 二次確認
        if (confirm('再次確認：真的要清空所有紀錄嗎？')) {
            state.records = [];
            saveData();
            updateUI();
            alert('所有紀錄已清空');
        }
    }
}

// 新增紀錄邏輯
function addRecord(data) {
    const diffMs = data.endTime - data.startTime;
    let totalMinutes = Math.floor(diffMs / 60000);
    
    let breakTime = 0;
    if (data.breakDuration !== undefined) {
        breakTime = data.breakDuration;
    } else if (data.deductBreak) {
        breakTime = state.settings.breakTime;
    }

    if (breakTime > 0) {
        totalMinutes = Math.max(0, totalMinutes - breakTime);
    }

    const hours = parseFloat((totalMinutes / 60).toFixed(2));
    
    const record = {
        id: Date.now(),
        startTime: data.startTime,
        endTime: data.endTime,
        deductBreak: breakTime > 0, // Ensure consistency
        breakDuration: breakTime,   // Store actual break duration for reference
        hours: hours,
        minutes: totalMinutes // Store exact minutes
    };

    state.records.unshift(record); // 新的在最前面
}

// 時鐘功能
function startClock() {
    function update() {
        const now = new Date();
        elements.clockDisplay.textContent = now.toLocaleTimeString('zh-TW', { hour12: false });
        elements.dateDisplay.textContent = now.toLocaleDateString('zh-TW', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        });
    }
    update();
    setInterval(update, 1000);
}

// UI 更新總入口
function updateUI() {
    updateButtons();
    updateDashboard();
    updateRecordsList();
}

// 更新按鈕狀態
function updateButtons() {
    if (state.currentSession) {
        elements.clockInBtn.disabled = true;
        elements.clockOutBtn.disabled = false;
        elements.clockInBtn.textContent = `工作中 (${new Date(state.currentSession.startTime).toLocaleTimeString('zh-TW', {hour: '2-digit', minute:'2-digit'})} 開始)`;
    } else {
        elements.clockInBtn.disabled = false;
        elements.clockOutBtn.disabled = true;
        elements.clockInBtn.textContent = '上班打卡';
    }
}

// 更新統計看板
function updateDashboard() {
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 取得當前篩選範圍內的紀錄（如果沒有篩選，預設顯示全部或當月？）
    // 這裡邏輯：
    // 1. 今日時數：只看今天
    // 2. 本月累積：只看這個月
    // 3. 預估薪資：基於本月累積

    let todayTotal = 0;
    let monthTotal = 0;

    // 若有篩選日期，看板也可以顯示篩選區間的總和？
    // 根據需求： "統計看板：顯示當日時數、自選日期區間總時數、以及當月累計時數與總薪資。"
    // 這裡我們簡化，顯示今日和本月，另外可以加一個「區間總計」如果篩選器有值。
    
    // 計算今日和本月
    state.records.forEach(record => {
        const recordDate = new Date(record.startTime);
        
        // 今日
        if (recordDate.toDateString() === todayStr) {
            todayTotal += record.hours;
        }

        // 本月
        if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
            monthTotal += record.hours;
        }
    });

    elements.todayHours.textContent = todayTotal.toFixed(1);
    elements.monthHours.textContent = monthTotal.toFixed(1);
    
    const salary = Math.round(monthTotal * state.settings.hourlyWage);
    elements.monthSalary.textContent = `$${salary.toLocaleString()}`;
}

// 更新紀錄列表
function updateRecordsList() {
    const list = elements.recordsList;
    list.innerHTML = '';

    // 篩選
    let filteredRecords = state.records;
    const startStr = elements.filterStart.value;
    const endStr = elements.filterEnd.value;

    if (startStr) {
        const startDate = new Date(startStr).getTime();
        filteredRecords = filteredRecords.filter(r => r.startTime >= startDate);
    }
    if (endStr) {
        const endDate = new Date(endStr).setHours(23, 59, 59, 999);
        filteredRecords = filteredRecords.filter(r => r.startTime <= endDate);
    }

    // 排序：日期從小到大 (舊 -> 新)
    // 複製陣列以避免修改原始資料順序（視需求而定，但複製比較安全）
    filteredRecords = [...filteredRecords].sort((a, b) => a.startTime - b.startTime);

    if (filteredRecords.length === 0) {
        list.innerHTML = '<div class="empty-state">此區間尚無紀錄</div>';
        // Update range total to 0 even if no records
        elements.rangeHours.textContent = "0.0";
        return;
    }

    let rangeTotalMinutes = 0;

    filteredRecords.forEach(record => {
        // Calculate total minutes for the filtered range
        const rMinutes = record.minutes !== undefined ? record.minutes : Math.round(record.hours * 60);
        rangeTotalMinutes += rMinutes;

        const date = new Date(record.startTime);
        const dateStr = date.toLocaleDateString('zh-TW');
        const timeStart = new Date(record.startTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        const timeEnd = new Date(record.endTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        
        // Use stored minutes if available, otherwise calculate from hours (backward compatibility)
        const displayMinutes = record.minutes !== undefined ? record.minutes : Math.round(record.hours * 60);
        const durationStr = formatDuration(displayMinutes);

        const item = document.createElement('div');
        item.className = 'record-item';
        item.innerHTML = `
            <div class="record-info">
                <div class="record-date">${dateStr}</div>
                <div class="record-time">
                    ${timeStart} - ${timeEnd} 
                    ${record.deductBreak ? '<span style="font-size:0.8em; color:#888;">(含休)</span>' : ''}
                </div>
            </div>
            <div class="record-hours">${durationStr}</div>
            <button class="record-delete" onclick="deleteRecord(${record.id})">&times;</button>
        `;
        list.appendChild(item);
    });

    // Update range hours display
    const rangeHours = parseFloat((rangeTotalMinutes / 60).toFixed(2));
    elements.rangeHours.textContent = rangeHours.toFixed(1);
}

// 刪除紀錄
window.deleteRecord = function(id) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
        state.records = state.records.filter(r => r.id !== id);
        saveData();
        updateUI();
    }
};

// 輔助函式：格式化分鐘數為 "X小時Y分"
function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小時${m}分`;
}

// 啟動 App
init();
