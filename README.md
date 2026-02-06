# 工時計算器 (Work Hour Record)

一個輕量、現代化的工時紀錄網頁應用程式 (Web App)。專為自由接案者、遠端工作者或需要自行記錄工時的使用者設計。

此專案由 **Trae** (AI Editor) 協助開發，支援 **Google 協作平台 (Google Sites)** 嵌入使用。

## ✨ 核心功能

*   **⏱️ 智慧打卡**
    *   一鍵上班/下班打卡。
    *   自動計算工時，精確至分鐘。
    *   支援「自動扣除休息時間」功能（預設 60 分鐘，可自訂）。
    *   打卡時若超過預設休息時間，系統會貼心詢問是否扣除。

*   **✍️ 彈性補登與修改**
    *   忘記打卡也能輕鬆補救。
    *   支援手動輸入日期、上下班時間。
    *   **[新功能]** 每一筆紀錄皆可獨立設定休息時間長度。
    *   **[新功能]** 支援修改已存在的紀錄（透過刪除後補登）。

*   **📊 即時統計看板**
    *   **今日時數**：即時掌握當日工作進度。
    *   **本月累積**：自動加總當月所有工時。
    *   **區間總計**：搭配日期篩選器，顯示特定期間（如專案週期、雙週）的總工時。
    *   **預估薪資**：根據設定的時薪自動計算本月預估收入。

*   **💾 資料管理與備份 (全新升級)**
    *   **匯出 Excel**：支援將所有紀錄匯出為 `.csv` 格式，方便用 Excel 製作報表。
    *   **一鍵清除**：提供危險操作區，可一鍵刪除所有紀錄（含防呆確認）。
    *   **檔案備份/還原**：可下載 `.json` 備份檔，在不同電腦間轉移資料。
    *   **手機版文字備份**：專為手機瀏覽器（如 LINE 內建瀏覽器）優化，透過複製/貼上代碼或分享按鈕輕鬆移轉資料。

*   **☁️ Google Sheets 雲端同步 (進階)**
    *   支援與個人 Google Sheets 連結。
    *   可將資料上傳至雲端試算表，實現跨裝置（手機/電腦）資料同步。
    *   資料永久保存於您的 Google Drive，不再擔心瀏覽器快取被清空。

## 🚀 如何使用

### 本地執行
1. 下載此專案程式碼。
2. 直接雙擊開啟 `index.html` 即可使用。

### 部署至 GitHub Pages (推薦)
若要嵌入 Google Sites 或跨裝置使用，建議部署到網路：

1. 將此專案上傳至您的 GitHub Repository。
2. 進入 Repository 的 **Settings** > **Pages**。
3. 在 **Branch** 選擇 `main` (或 `master`) 並儲存。
4. 等待數分鐘後，您將獲得專屬網址（例如：`https://yourname.github.io/work-timer/`）。

### 嵌入 Google 協作平台
1. 取得 GitHub Pages 網址後。
2. 前往您的 Google Site 編輯頁面。
3. 選擇 **「內嵌」 (Embed)** > **「透過網址」**。
4. 貼上網址，調整區塊大小即可。

## ⚙️ 進階設定指南

### 啟用 Google Sheets 同步
若您希望資料能跨裝置同步，請依照以下步驟設定：

1. **準備 Google Sheet**：
   - 建立一個新的 Google Sheet。
   - 網址列中 `d/` 與 `/edit` 之間的字串即為 **Spreadsheet ID**。

2. **取得 Client ID (需至 Google Cloud Console)**：
   - 建立專案並啟用 **Google Sheets API**。
   - 建立 **OAuth 2.0 Client ID** (應用程式類型選「Web application」)。
   - 將您的 GitHub Pages 網址加入 **Authorized JavaScript origins**。

3. **在 App 中設定**：
   - 點擊 App 右上角 `⚙️ 設定`。
   - 填入 `Client ID` 與 `Spreadsheet ID`。
   - 點擊「登入 Google」並授權，即可開始同步。

## 🛠️ 專案結構

```
Work Hour Record/
├── index.html      # 主程式介面 (HTML5)
├── style.css       # 樣式表 (CSS3, RWD)
├── script.js       # 核心邏輯 (Vanilla JS)
└── README.md       # 說明文件
```

## 📝 開發者筆記

本專案採用純前端技術 (HTML/CSS/JS) 構建，無須後端伺服器。
資料預設儲存於瀏覽器 `LocalStorage`，並透過 Google Sheets API 提供選配的雲端同步功能。
