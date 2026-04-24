# 澳門院舍輪候管理系統 (Care Home Waiting List System)

## 系統概覽
- **網址**: https://yeeonwaitinglist.web.app
- **後端**: Firebase (Firestore, Authentication, Hosting)
- **前端**: React + Vite + Tailwind CSS
- **管理員 Email**: kennykam2004@gmail.com

## Firebase 設置
- **項目 ID**: yeeonwaitinglist
- **數據庫**: Firestore (所有用戶共用同一份數據)
- **認證方式**: Email/Password

## 主要功能
- [x] 會員登入/註冊（需管理員創建帳號）
- [x] 輪候個案管理（新增、編輯、刪除）
- [x] 狀態追蹤（新登記、評估預約中、適合輪候等）
- [x] 資料篩選和搜尋
- [x] 匯入/匯出 Excel 和 JSON
- [x] 樣本數據載入
- [x] 響應式設計（手機/電腦）
- [x] 狀態統計摘要
- [x] 所有工作人員共用同一份資料

## 文件結構
```
care-home-system/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # 主頁面
│   │   ├── LoginPage.jsx      # 登入頁面
│   │   ├── AdminPage.jsx      # 用戶管理頁面
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx    # 認證上下文
│   ├── firebase/
│   │   └── config.js         # Firebase 配置
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── functions/                 # Cloud Functions（尚未啟用）
├── firestore.rules            # Firestore 安全規則
├── firebase.json              # Firebase 配置
└── package.json
```

## 部署指令
```bash
cd C:\Users\User\Desktop\CC\TEST\care-home-system
npm run build
firebase deploy --only hosting
```

## 創建新用戶
1. Firebase Console > Authentication > Users > Add user
2. 系統中用戶管理頁面會自動同步顯示

## 預計未來優化
- 用戶管理頁面直接創建帳號（需 Cloud Functions，現需 Blaze 計劃）
- 數據導出優化
- 更多統計報表
