import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import AdminPage from './AdminPage';

const initialData = [
  { id: '1', targetBranch: ['頤安'], name: '王大明', age: 75, gender: '男', registerDate: '2026-05-10', contactName: '王小明(子)', contactPhone: '66112233', region: '澳門區', address: '筷子基北灣', medicalHistory: '高血壓，輕微中風，行動緩慢', remarks: '家屬需上班無人照顧', status: '新登記', evaluationDate: '', evaluationComments: '' },
  { id: '2', targetBranch: ['雅新'], name: '林美玲', age: 88, gender: '女', registerDate: '2025-11-22', contactName: '林先生(弟)', contactPhone: '62334455', region: '氹仔區', address: '花城區', medicalHistory: '骨質疏鬆，曾跌倒骨折，需輪椅代步', remarks: '急需床位', status: '適合輪候', evaluationDate: '', evaluationComments: '評估適合，長者配合度高。' },
  { id: '3', targetBranch: ['逸麗'], name: '張建國', age: 62, gender: '男', registerDate: '2026-01-15', contactName: '張太(妻)', contactPhone: '66889900', region: '澳門區', address: '黑沙環', medicalHistory: '糖尿病，需定時注射胰島素', remarks: '家屬不懂注射', status: '評估預約中', evaluationDate: '2026-05-20 10:00', evaluationComments: '' },
  { id: '4', targetBranch: ['三院皆可'], name: '何雪芳', age: 95, gender: '女', registerDate: '2024-08-30', contactName: '陳小姐(外孫女)', contactPhone: '62115599', region: '路環區', address: '石排灣', medicalHistory: '嚴重失智症，完全臥床，需胃管及尿片', remarks: '長者有時會尖叫', status: '已評估(不適合/其他)', evaluationDate: '2024-09-05 14:30', evaluationComments: '失智症引發嚴重行為問題，會攻擊照顧者，建議轉介精神科專門院舍。' },
  { id: '5', targetBranch: ['頤安', '雅新'], name: '郭志強', age: 58, gender: '男', registerDate: '2023-04-12', contactName: '郭小姐(女)', contactPhone: '66554433', region: '其他/未知', address: '內地珠海', medicalHistory: '慢性阻塞性肺病，需長期吸氧', remarks: '家屬在大陸居住', status: '未能聯絡', evaluationDate: '', evaluationComments: '' },
  { id: '6', targetBranch: ['逸麗'], name: '梁詠梅', age: 81, gender: '女', registerDate: '2026-02-28', contactName: '李生(子)', contactPhone: '66228844', region: '澳門區', address: '下環街', medicalHistory: '無明顯基礎疾病，退化性關節炎', remarks: '家屬猶豫中', status: '家屬未考慮清楚', evaluationDate: '2026-03-10 11:00', evaluationComments: '長者本身不願意入住，家屬表示需再作溝通。' },
  { id: '7', targetBranch: ['雅新'], name: '黃宗澤', age: 77, gender: '男', registerDate: '2022-09-05', contactName: '黃太(妻)', contactPhone: '66337711', region: '氹仔區', address: '海洋花園', medicalHistory: '柏金遜症中期', remarks: '已請家傭', status: '已取消', evaluationDate: '', evaluationComments: '家屬表示已聘請海外家傭，暫不需要院舍服務。' },
  { id: '8', targetBranch: ['頤安'], name: '周秀娜', age: 90, gender: '女', registerDate: '2026-04-01', contactName: '趙生(子)', contactPhone: '66991122', region: '澳門區', address: '高士德', medicalHistory: '心臟衰竭，起居需協助', remarks: '', status: '適合輪候', evaluationDate: '2026-04-10 15:00', evaluationComments: '長者狀態平穩，適合入住一般護理區域。' },
  { id: '9', targetBranch: ['三院皆可'], name: '吳家豪', age: 83, gender: '男', registerDate: '2025-07-19', contactName: '吳小姐(姪女)', contactPhone: '62556677', region: '澳門區', address: '沙梨頭', medicalHistory: '雙目失明，聽力下降', remarks: '獨居，社工轉介', status: '評估預約中', evaluationDate: '2026-05-22 14:00', evaluationComments: '' },
  { id: '10', targetBranch: ['逸麗'], name: '鄭秀文', age: 69, gender: '女', registerDate: '2024-12-10', contactName: '許生(夫)', contactPhone: '66778899', region: '澳門區', address: '新口岸', medicalHistory: '乳癌康復者，近期體力下降', remarks: '', status: '新登記', evaluationDate: '', evaluationComments: '' }
];

const branches = ['頤安', '雅新', '逸麗', '三院皆可'];
const statuses = ['新登記', '評估預約中', '適合輪候', '已入住', '已評估(不適合/其他)', '家屬未考慮清楚', '未能聯絡', '已取消', '已刪除'];
const regionOptions = ['澳門區', '氹仔區', '路環區', '山頂醫院', '鏡湖醫院', '九澳工聯', '高頂', '其他/未知'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [isAdmin, setIsAdmin] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [convertTwToCn, setConvertTwToCn] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: 'registerDate', direction: 'desc' });

  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);

  const [formData, setFormData] = useState({
    targetBranch: ['三院皆可'], name: '', age: '', gender: '女', registerDate: new Date().toISOString().split('T')[0],
    contactName: '', contactPhone: '', region: '', address: '', medicalHistory: '', remarks: '',
    status: '新登記', evaluationDate: '', evaluationComments: ''
  });

  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // 統計各狀態數量
  const statusCounts = useMemo(() => {
    const counts = {};
    statuses.forEach(s => counts[s] = 0);
    patients.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [patients]);

  // 檢查是否為管理員
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      // 管理員 email 比對
      const adminEmail = 'kennykam2004@gmail.com';
      const userEmail = user.email ? user.email.toLowerCase() : '';
      const adminEmailLower = adminEmail.toLowerCase();
      setIsAdmin(userEmail === adminEmailLower);
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
    const patientsRef = collection(db, 'patients');

    const unsubscribe = onSnapshot(patientsRef, (snapshot) => {
      const fetchedPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(fetchedPatients);
      setLoading(false);
    }, (error) => {
      console.error('讀取資料失敗: ', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const loadOpenCC = new Function("return import('https://esm.sh/opencc-js@1.0.5')");
    loadOpenCC()
      .then((OpenCC) => {
        const converter = OpenCC.Converter({ from: 'tw', to: 'cn' });
        setConvertTwToCn(() => converter);
      })
      .catch((err) => {
        console.warn('繁簡轉換模組載入失敗:', err);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBranchChange = (branch) => {
    setFormData(prev => {
      let newBranches = [...prev.targetBranch];
      if (branch === '三院皆可') {
        newBranches = ['三院皆可'];
      } else {
        newBranches = newBranches.filter(b => b !== '三院皆可');
        if (newBranches.includes(branch)) {
          newBranches = newBranches.filter(b => b !== branch);
        } else {
          newBranches.push(branch);
        }
      }
      if (newBranches.length === 0) newBranches = ['三院皆可'];
      return { ...prev, targetBranch: newBranches };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const patientData = { ...formData };
    let docId = patientData.id;

    if (!docId) {
      docId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
      patientData.id = docId;
    }

    try {
      const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
      const docRef = doc(db, 'patients', docId);
      await setDoc(docRef, patientData);
      setSaveMessage('✓ 資料已儲存');
      setTimeout(() => setSaveMessage(''), 3000);
      setActiveTab('list');
      resetForm();
    } catch (error) {
      console.error('儲存資料失敗:', error);
      setSaveMessage('✗ 儲存失敗');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      targetBranch: ['三院皆可'], name: '', age: '', gender: '女', registerDate: new Date().toISOString().split('T')[0],
      contactName: '', contactPhone: '', region: '', address: '', medicalHistory: '', remarks: '',
      status: '新登記', evaluationDate: '', evaluationComments: ''
    });
    setSelectedPatient(null);
  };

  const openPatientModal = (patient) => {
    setFormData(patient);
    setSelectedPatient(patient);
  };

  const confirmDelete = async () => {
    if (patientToDelete && user) {
      try {
        const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
        const docRef = doc(db, 'patients', patientToDelete.id);
        await updateDoc(docRef, { status: '已刪除' });
        setPatientToDelete(null);
      } catch (error) {
        console.error('更新刪除狀態失敗:', error);
      }
    }
  };

  const loadSampleData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
      for (const p of initialData) {
        const docRef = doc(db, 'patients', p.id);
        await setDoc(docRef, p);
      }
    } catch (e) {
      console.error('載入預設資料失敗', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(patients.map(p => p.registerDate ? p.registerDate.substring(0, 4) : '').filter(Boolean));
    return Array.from(years).sort((a, b) => b - a);
  }, [patients]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45'];

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="text-gray-400 ml-1 text-xs opacity-50">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="text-emerald-600 ml-1 text-xs font-bold">↑</span> : <span className="text-emerald-600 ml-1 text-xs font-bold">↓</span>;
  };

  const filteredPatients = useMemo(() => {
    const filtered = patients.filter(p => {
      const matchBranch = filterBranch === 'All' || p.targetBranch.includes(filterBranch) || p.targetBranch.includes('三院皆可');
      const matchStatus = filterStatus === 'All'
        ? p.status !== '已刪除'  // 全部狀態時隱藏已刪除
        : p.status === filterStatus;
      const matchGender = filterGender === 'All' || p.gender === filterGender;
      const matchYear = filterYear === 'All' || (p.registerDate && p.registerDate.startsWith(filterYear));

      const keyword = searchQuery.trim().toLowerCase();

      const normalize = (str) => {
        const lowerStr = str.toLowerCase();
        return convertTwToCn ? convertTwToCn(lowerStr) : lowerStr;
      };

      const query = normalize(keyword);
      const matchSearch = !query ||
        normalize(p.name).includes(query) ||
        p.contactPhone.includes(query) ||
        normalize(p.contactName).includes(query);

      return matchBranch && matchStatus && matchGender && matchYear && matchSearch;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';

      if (sortConfig.key === 'targetBranch') {
        aValue = aValue.join('');
        bValue = bValue.join('');
      } else if (sortConfig.key === 'age') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortConfig.key === 'registerDate' || sortConfig.key === 'evaluationDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [patients, filterBranch, filterStatus, filterGender, filterYear, searchQuery, convertTwToCn, sortConfig]);

  const exportToJson = () => {
    const jsonString = JSON.stringify(patients, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `輪候名單備份_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          setLoading(true);
          const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
          await Promise.all(importedData.map(async (p) => {
            if (p.id) {
              const docRef = doc(db, 'patients', p.id);
              await setDoc(docRef, p);
            }
          }));
        }
      } catch (err) {
        console.error('解析或匯入 JSON 失敗:', err);
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportExcel = async (e) => {
    const files = e.target.files;
    if (!files.length || !user) return;
    setLoading(true);

    try {
      const loadXLSX = new Function("return import('https://esm.sh/xlsx')");
      const XLSX = await loadXLSX();

      const writePromises = [];
      let totalImported = 0;

      for (let file of files) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1, defval: '' });

        if (rows.length < 2) continue;

        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowStr = rows[i].join('');
          if (rowStr.includes('姓名') && rowStr.includes('狀態')) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rows[headerRowIdx].map(h => String(h || '').trim());
        const getIndex = (keys) => {
          for (let k of keys) {
            const idx = headers.findIndex(h => h.includes(k));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colMap = {
          status: getIndex(['狀態']),
          targetBranch: getIndex(['輪候院舍']),
          name: getIndex(['姓名']),
          gender: getIndex(['性別']),
          age: getIndex(['年齡', '歲數']),
          contactName: getIndex(['聯絡人']),
          contactPhone: getIndex(['聯絡電話', '聯絡人電話']),
          region: getIndex(['區域', '所在區域']),
          address: getIndex(['家訪地址', '地址']),
          medicalHistory: getIndex(['病史']),
          remarks: getIndex(['備註']),
          registerDate: getIndex(['登記日期']),
          evaluationDate: getIndex(['家訪時間', '預約時間']),
          evaluationComments: getIndex(['評估意見'])
        };

        if (colMap.name === -1) {
          colMap.status = 0; colMap.targetBranch = 1; colMap.name = 2; colMap.gender = 3;
          colMap.age = 4; colMap.contactName = 5; colMap.contactPhone = 6; colMap.region = 7;
          colMap.address = 8; colMap.medicalHistory = 9; colMap.remarks = 10;
          colMap.registerDate = 11; colMap.evaluationDate = 12; colMap.evaluationComments = 13;
        }

        for (let i = headerRowIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const nameVal = String(row[colMap.name] || '').trim();
          if (!nameVal || nameVal === '姓名') continue;

          const rawBranch = String(row[colMap.targetBranch] || '');
          let branchArr = rawBranch.split('、').map(b => b.trim()).filter(Boolean);
          if (branchArr.length === 0) branchArr = ['三院皆可'];

          let regDate = new Date().toISOString().split('T')[0];
          let rawRegDate = colMap.registerDate !== -1 ? String(row[colMap.registerDate]).trim() : '';
          if (rawRegDate) {
            if (!isNaN(rawRegDate) && Number(rawRegDate) > 20000) {
              const date = new Date(Math.round((rawRegDate - 25569) * 86400 * 1000));
              regDate = date.toISOString().split('T')[0];
            } else {
              const parsed = new Date(rawRegDate);
              if (!isNaN(parsed.getTime())) regDate = parsed.toISOString().split('T')[0];
              else regDate = rawRegDate;
            }
          }

          const patient = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6) + i,
            status: String(row[colMap.status] || '新登記').trim(),
            targetBranch: branchArr,
            name: nameVal,
            gender: String(row[colMap.gender] || '女').trim(),
            age: String(row[colMap.age] || '0').trim(),
            contactName: String(row[colMap.contactName] || '').trim(),
            contactPhone: String(row[colMap.contactPhone] || '').trim(),
            region: String(row[colMap.region] || '其他/未知').trim(),
            address: String(row[colMap.address] || '').trim(),
            medicalHistory: String(row[colMap.medicalHistory] || '').trim(),
            remarks: String(row[colMap.remarks] || '').trim(),
            registerDate: regDate,
            evaluationDate: String(row[colMap.evaluationDate] || '').trim(),
            evaluationComments: String(row[colMap.evaluationComments] || '').trim()
          };

          const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
          const docRef = doc(db, 'patients', patient.id);
          writePromises.push(setDoc(docRef, patient));
          totalImported++;
        }
      }
      await Promise.all(writePromises);
      console.log(`匯入完成，共處理 ${totalImported} 筆資料。`);
    } catch (error) {
      console.error('Excel 匯入失敗:', error);
    } finally {
      setLoading(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const exportToExcel = () => {
    const headers = ['狀態', '輪候院舍', '姓名', '性別', '年齡', '聯絡人', '聯絡電話', '區域', '家訪地址', '病史', '備註', '登記日期', '家訪時間', '評估意見'];
    const escapeCSV = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

    const rows = filteredPatients.map(p => [
      p.status,
      p.targetBranch.join('、'),
      p.name,
      p.gender,
      p.age,
      p.contactName,
      p.contactPhone,
      p.region,
      p.address,
      p.medicalHistory,
      p.remarks,
      p.registerDate,
      p.evaluationDate,
      p.evaluationComments
    ].map(escapeCSV));

    const csvContent = '﻿' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `輪候名單_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFormUI = (isEdit) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded border">
        <h3 className="font-semibold mb-3 text-emerald-800 border-b pb-1">當前進度管理</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">進度狀態</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 w-full border rounded p-2 focus:ring-emerald-500 font-bold">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">輪候院舍 (可多選)</label>
            <div className="mt-2 flex flex-wrap gap-4">
              {branches.map(b => (
                <label key={b} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-emerald-600"
                    checked={formData.targetBranch.includes(b)}
                    onChange={() => handleBranchChange(b)}
                  />
                  <span className="ml-2">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">評估預約時間</label>
            <div className="mt-1 flex gap-2">
              <input
                type="date"
                className="w-full border rounded p-2"
                value={formData.evaluationDate ? formData.evaluationDate.split(' ')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const timePart = formData.evaluationDate && formData.evaluationDate.includes(' ') ? formData.evaluationDate.split(' ')[1] : '10:00';
                  const newVal = newDate ? `${newDate} ${timePart}` : '';
                  setFormData(prev => ({
                    ...prev,
                    evaluationDate: newVal,
                    status: (prev.status === '新登記' && newVal) ? '評估預約中' : prev.status
                  }));
                }}
              />
              <select
                className="w-full border rounded p-2"
                value={formData.evaluationDate && formData.evaluationDate.includes(' ') ? formData.evaluationDate.split(' ')[1].split(':')[0] : ''}
                onChange={(e) => {
                  const newHour = e.target.value;
                  if (!newHour) return;
                  const existingDate = (formData.evaluationDate ? formData.evaluationDate.split(' ')[0] : '') || new Date().toISOString().split('T')[0];
                  const existingMin = (formData.evaluationDate && formData.evaluationDate.includes(' ')) ? formData.evaluationDate.split(' ')[1].split(':')[1] : '00';
                  const newVal = `${existingDate} ${newHour}:${existingMin}`;
                  setFormData(prev => ({
                    ...prev,
                    evaluationDate: newVal,
                    status: prev.status === '新登記' ? '評估預約中' : prev.status
                  }));
                }}
              >
                <option value="">時</option>
                {hourOptions.map(h => <option key={h} value={h}>{h}時</option>)}
              </select>
              <select
                className="w-full border rounded p-2"
                value={formData.evaluationDate && formData.evaluationDate.includes(' ') ? formData.evaluationDate.split(' ')[1].split(':')[1] : ''}
                onChange={(e) => {
                  const newMin = e.target.value;
                  if (!newMin) return;
                  const existingDate = (formData.evaluationDate ? formData.evaluationDate.split(' ')[0] : '') || new Date().toISOString().split('T')[0];
                  const existingHour = (formData.evaluationDate && formData.evaluationDate.includes(' ')) ? formData.evaluationDate.split(' ')[1].split(':')[0] : '10';
                  const newVal = `${existingDate} ${existingHour}:${newMin}`;
                  setFormData(prev => ({
                    ...prev,
                    evaluationDate: newVal,
                    status: prev.status === '新登記' ? '評估預約中' : prev.status
                  }));
                }}
              >
                <option value="">分</option>
                {minuteOptions.map(m => <option key={m} value={m}>{m}分</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">登記日期</label>
            <input type="date" name="registerDate" value={formData.registerDate} onChange={handleInputChange} required className="mt-1 w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">評估後意見 (供內部參考)</label>
            <textarea name="evaluationComments" value={formData.evaluationComments} onChange={handleInputChange} rows="3" className="mt-1 w-full border rounded p-2 bg-yellow-50 placeholder-gray-400" placeholder="填寫適合或不適合的理由、家訪狀況、家屬期望等..."></textarea>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 border-b pb-1">長者基本資料</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">姓名</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">性別</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 w-full border rounded p-2">
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">年齡</label>
            <input type="number" name="age" value={formData.age} onChange={handleInputChange} required className="mt-1 w-full border rounded p-2" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 border-b pb-1">聯絡與居住資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">聯絡人 (關係)</label>
            <input type="text" name="contactName" value={formData.contactName} onChange={handleInputChange} placeholder="例如: 陳先生(子)" required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">聯絡電話</label>
            <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">所在區域</label>
            <select name="region" value={formData.region} onChange={handleInputChange} className="mt-1 w-full border rounded p-2">
              <option value="">請選擇區域...</option>
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">家訪地址</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 border-b pb-1">病史與備註</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">病史及身體狀況</label>
            <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} rows="2" className="mt-1 w-full border rounded p-2"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">其他備註</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows="2" className="mt-1 w-full border rounded p-2"></textarea>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {isEdit && (
          <button type="button" onClick={() => setSelectedPatient(null)} className="px-6 py-2 border rounded text-gray-600 hover:bg-gray-100">取消</button>
        )}
        <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold">
          儲存資料
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="bg-emerald-700 text-white p-2 sm:p-4 shadow-md sticky top-0 z-40">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold">頤安三院輪候及評估管理系統</h1>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className="text-sm opacity-80 mr-2">{user?.email}</span>
          {saveMessage && (
            <span className={`text-sm font-semibold px-2 py-1 rounded ${saveMessage.includes('✗') ? 'bg-red-500' : 'bg-green-500'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 font-semibold"
          >
            登出
          </button>
          <div className="border-l border-emerald-500 h-6 mx-2"></div>
          <button
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`px-4 py-2 rounded ${activeTab === 'list' ? 'bg-emerald-900' : 'hover:bg-emerald-600'}`}
          >
            名單總覽
          </button>
          <button
            onClick={() => { setActiveTab('new'); resetForm(); }}
            className={`px-4 py-2 rounded ${activeTab === 'new' ? 'bg-emerald-900' : 'hover:bg-emerald-600'}`}
          >
            + 新增登記
          </button>

          {isAdmin && (
            <>
              <div className="border-l border-emerald-500 h-6 mx-2"></div>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded ${activeTab === 'admin' ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                用戶管理
              </button>
            </>
          )}

          <div className="border-l border-emerald-500 h-6 mx-2"></div>

          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImportJson}
          />
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            multiple
            style={{ display: 'none' }}
            ref={excelInputRef}
            onChange={handleImportExcel}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 font-semibold disabled:opacity-50"
          >
            匯入 JSON
          </button>
          <button
            onClick={exportToJson}
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            匯出 JSON
          </button>
          <button
            onClick={() => excelInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 font-semibold disabled:opacity-50"
          >
            導入 Excel
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 font-semibold"
          >
            導出 Excel
          </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">輪候院舍</label>
                <select className="border rounded p-2" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                  <option value="All">全部</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">進度狀態</label>
                <select className="border rounded p-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="All">全部狀態</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">性別</label>
                <select className="border rounded p-2" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                  <option value="All">全部</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">登記年份</label>
                <select className="border rounded p-2" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  <option value="All">全部</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="flex-grow">
                <label className="text-sm font-semibold text-gray-600 block mb-1">關鍵字搜尋</label>
                <input
                  type="text"
                  className="border rounded p-2 w-full max-w-sm"
                  placeholder="輸入長者姓名、電話或聯絡人..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ml-auto flex items-end">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded">
                  共 {filteredPatients.length} 筆資料
                </span>
              </div>
            </div>

            {/* 狀態統計 */}
            <div className="bg-white rounded shadow p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">各狀態統計</h3>
              <div className="flex flex-wrap gap-2">
                {statuses.filter(s => s !== '已刪除').map(status => (
                  <span
                    key={status}
                    className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all ${
                      filterStatus === status
                        ? 'ring-2 ring-emerald-500'
                        : 'hover:ring-1 ring-gray-300'
                    } ${
                      status === '適合輪候' ? 'bg-green-100 text-green-800' :
                      status === '評估預約中' ? 'bg-blue-100 text-blue-800' :
                      status === '新登記' ? 'bg-yellow-100 text-yellow-800' :
                      status === '已入住' ? 'bg-purple-100 text-purple-800' :
                      status === '已取消' ? 'bg-gray-200 text-gray-600' :
                      'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setFilterStatus(filterStatus === status ? 'All' : status)}
                  >
                    {status}: {statusCounts[status]}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded shadow overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('status')}>
                      狀態 {renderSortIcon('status')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('targetBranch')}>
                      輪候院舍 {renderSortIcon('targetBranch')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('name')}>
                      姓名 {renderSortIcon('name')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('region')}>
                      所在區域 {renderSortIcon('region')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('gender')}>
                      性別 {renderSortIcon('gender')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('age')}>
                      年齡 {renderSortIcon('age')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('contactName')}>
                      聯絡人 {renderSortIcon('contactName')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('registerDate')}>
                      登記日期 {renderSortIcon('registerDate')}
                    </th>
                    <th className="p-3 font-semibold cursor-pointer hover:bg-gray-200 select-none transition-colors" onClick={() => requestSort('evaluationDate')}>
                      家訪時間 {renderSortIcon('evaluationDate')}
                    </th>
                    <th className="p-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" className="p-6 text-center text-gray-500">資料處理中...</td></tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-6 text-center text-gray-500">
                        查無符合條件之名單
                        {patients.length === 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">系統目前無任何資料。您可以點擊下方按鈕載入 10 筆預設測試資料。</p>
                            <button
                              onClick={loadSampleData}
                              className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 font-semibold"
                            >
                              載入 10 筆範本資料
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((p, idx) => (
                      <React.Fragment key={p.id}>
                        <tr
                          className={`border-b transition-colors cursor-pointer ${selectedPatient?.id === p.id ? 'bg-emerald-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50`}
                          onClick={() => selectedPatient?.id === p.id ? setSelectedPatient(null) : openPatientModal(p)}
                        >
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              p.status === '已刪除' ? 'bg-red-100 text-red-800' :
                              p.status === '已入住' ? 'bg-purple-100 text-purple-800' :
                              p.status === '適合輪候' ? 'bg-green-100 text-green-800' :
                              p.status === '評估預約中' ? 'bg-blue-100 text-blue-800' :
                              p.status === '已取消' ? 'bg-gray-200 text-gray-600' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3">{p.targetBranch.join('、')}</td>
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3 text-sm text-gray-600">{p.region || '-'}</td>
                          <td className="p-3">{p.gender}</td>
                          <td className="p-3">{p.age}</td>
                          <td className="p-3">{p.contactName} <br/><span className="text-sm text-gray-500">{p.contactPhone}</span></td>
                          <td className="p-3">{p.registerDate}</td>
                          <td className="p-3 text-sm text-blue-600">{p.evaluationDate || '-'}</td>
                          <td className="p-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPatientToDelete(p); }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                        {selectedPatient?.id === p.id && (
                          <tr className="bg-white">
                            <td colSpan="10" className="p-0 border-b-4 border-emerald-500 shadow-inner">
                              <div className="p-6 bg-emerald-50/50">
                                <div className="flex justify-between items-center mb-6 border-b border-emerald-200 pb-2">
                                  <h3 className="text-xl font-bold text-emerald-800">正在編輯：{p.name} 的資料</h3>
                                  <button onClick={() => setSelectedPatient(null)} className="text-emerald-600 hover:text-emerald-900 font-semibold">
                                    ▲ 收起面板
                                  </button>
                                </div>
                                {renderFormUI(true)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold">新增輪候登記</h2>
            </div>
            {renderFormUI(false)}
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPage onBack={() => setActiveTab('list')} />
        )}
      </main>

      {patientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">確認移至已刪除</h3>
            <p className="text-gray-600 mb-6">
              確定要將長者 <strong>{patientToDelete.name}</strong> 的資料移至「已刪除」狀態嗎？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPatientToDelete(null)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 font-semibold"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                確定移至已刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
