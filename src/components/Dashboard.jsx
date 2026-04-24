import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
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

const statusStyles = {
  '已刪除': { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  '已入住': { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
  '適合輪候': { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  '評估預約中': { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200' },
  '已取消': { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
  '家屬未考慮清楚': { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
  '未能聯絡': { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-200' },
  '新登記': { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
  '已評估(不適合/其他)': { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [isAdmin, setIsAdmin] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [convertTwToCn, setConvertTwToCn] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'registerDate', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const formRef = useRef(null);
  const tableRef = useRef(null);

  const [formData, setFormData] = useState({
    targetBranch: ['三院皆可'], name: '', age: '', gender: '女', registerDate: new Date().toISOString().split('T')[0],
    contactName: '', contactPhone: '', region: '', address: '', medicalHistory: '', remarks: '',
    status: '新登記', evaluationDate: '', evaluationComments: ''
  });

  const statusCounts = useMemo(() => {
    const counts = {};
    statuses.forEach(s => counts[s] = 0);
    patients.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [patients]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const adminEmail = 'kennykam2004@gmail.com';
      const userEmail = user.email ? user.email.toLowerCase() : '';
      const adminEmailLower = adminEmail.toLowerCase();
      setIsAdmin(userEmail === adminEmailLower);
    };
    checkAdmin();
  }, [user]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus form first field when new tab opens
  useEffect(() => {
    if (activeTab === 'new' && formRef.current) {
      const firstInput = formRef.current.querySelector('input[name="name"]');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  }, [activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPatient(null);
        setPatientToDelete(null);
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setActiveTab('new');
        resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist filter settings to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('careHomeFilters');
    if (saved) {
      try {
        const { filterBranch: sb, filterStatus: ss, filterGender: sg, filterYear: sy } = JSON.parse(saved);
        if (sb) setFilterBranch(sb);
        if (ss) setFilterStatus(ss);
        if (sg) setFilterGender(sg);
        if (sy) setFilterYear(sy);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('careHomeFilters', JSON.stringify({
      filterBranch, filterStatus, filterGender, filterYear
    }));
  }, [filterBranch, filterStatus, filterGender, filterYear]);

  // Click outside to close expanded row
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedPatient && tableRef.current && !tableRef.current.contains(e.target)) {
        const isInsideExpandedRow = e.target.closest('tr.bg-white');
        if (!isInsideExpandedRow) {
          setSelectedPatient(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPatient]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formDirty]);

  // Persist sort config
  useEffect(() => {
    const saved = localStorage.getItem('careHomeSort');
    if (saved) {
      try {
        setSortConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('careHomeSort', JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => {
    if (!user) return;

    const appId = import.meta.env.VITE_FIREBASE_APP_ID || 'care-home-app';
    const patientsRef = collection(db, 'patients');

    const unsubscribe = onSnapshot(patientsRef, (snapshot) => {
      const fetchedPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(fetchedPatients);
      setLoading(false);
      setIsLocalMode(false);
    }, (error) => {
      console.error('讀取資料失敗: ', error);
      setIsLocalMode(true);
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
    setFormDirty(true);
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
      setFormDirty(true);
      return { ...prev, targetBranch: newBranches };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const patientData = { ...formData };
    let docId = patientData.id;

    if (!docId) {
      docId = Date.now().toString() + Math.random().toString(36).substr(2, 6);
      patientData.id = docId;
    }

    try {
      if (isLocalMode) {
        setPatients(prev => {
          const existing = prev.findIndex(p => p.id === docId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = patientData;
            return updated;
          }
          return [...prev, patientData];
        });
        addToast('資料已儲存（本地模式）', 'success');
      } else {
        const docRef = doc(db, 'patients', docId);
        await setDoc(docRef, patientData);
        addToast('資料已儲存', 'success');
      }
      setActiveTab('list');
      resetForm();
    } catch (error) {
      console.error('儲存資料失敗:', error);
      addToast('儲存失敗，請稍後再試', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      targetBranch: ['三院皆可'], name: '', age: '', gender: '女', registerDate: new Date().toISOString().split('T')[0],
      contactName: '', contactPhone: '', region: '', address: '', medicalHistory: '', remarks: '',
      status: '新登記', evaluationDate: '', evaluationComments: ''
    });
    setSelectedPatient(null);
    setFormDirty(false);
  };

  const openPatientModal = (patient) => {
    setFormData(patient);
    setSelectedPatient(patient);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      if (isLocalMode) {
        setPatients(prev => prev.map(p =>
          p.id === patientToDelete.id ? { ...p, status: '已刪除' } : p
        ));
        addToast(`已將 ${patientToDelete.name} 移至已刪除（本地模式）`, 'warning');
      } else {
        const docRef = doc(db, 'patients', patientToDelete.id);
        await updateDoc(docRef, { status: '已刪除' });
        addToast(`已將 ${patientToDelete.name} 移至已刪除`, 'success');
      }
      setPatientToDelete(null);
    } catch (error) {
      console.error('更新刪除狀態失敗:', error);
      addToast('刪除失敗，請稍後再試', 'error');
    }
  };

  const loadSampleData = async () => {
    setLoading(true);
    try {
      if (isLocalMode) {
        setPatients(initialData);
        addToast('已載入 10 筆範本資料（本地模式）', 'info');
      } else {
        for (const p of initialData) {
          const docRef = doc(db, 'patients', p.id);
          await setDoc(docRef, p);
        }
        addToast('已載入 10 筆範本資料', 'success');
      }
    } catch (e) {
      console.error('載入預設資料失敗', e);
      setPatients(initialData);
      setIsLocalMode(true);
      addToast('載入失敗，已切換至本地模式', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} 已複製`, 'success');
    } catch {
      addToast(`複製失敗`, 'error');
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
    if (sortConfig.key !== key) return <span className="text-gray-400 ml-1 text-xs opacity-40">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="text-emerald-500 ml-1 text-xs font-bold">↑</span> : <span className="text-emerald-500 ml-1 text-xs font-bold">↓</span>;
  };

  const filteredPatients = useMemo(() => {
    const filtered = patients.filter(p => {
      const matchBranch = filterBranch === 'All' || p.targetBranch.includes(filterBranch) || p.targetBranch.includes('三院皆可');
      const matchStatus = filterStatus === 'All'
        ? p.status !== '已刪除'
        : p.status === filterStatus;
      const matchGender = filterGender === 'All' || p.gender === filterGender;
      const matchYear = filterYear === 'All' || (p.registerDate && p.registerDate.startsWith(filterYear));

      const keyword = searchQuery.trim().toLowerCase();
      const normalize = (str) => {
        const lowerStr = str.toLowerCase();
        return convertTwToCn ? convertTwToCn(lowerStr) : lowerStr;
      };
      const query = normalize(keyword);
      const matchSearch = !debouncedQuery ||
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
  }, [patients, filterBranch, filterStatus, filterGender, filterYear, debouncedQuery, convertTwToCn, sortConfig]);

  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPatients.slice(startIndex, startIndex + pageSize);
  }, [filteredPatients, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPatients.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBranch, filterStatus, filterGender, filterYear, debouncedQuery]);

  const handleImportExcel = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
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

          const docRef = doc(db, 'patients', patient.id);
          writePromises.push(setDoc(docRef, patient));
          totalImported++;
        }
      }
      await Promise.all(writePromises);
      addToast(`匯入完成，共處理 ${totalImported} 筆資料`, 'success');
    } catch (error) {
      console.error('Excel 匯入失敗:', error);
      addToast('Excel 匯入失敗', 'error');
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          當前進度管理
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">進度狀態</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">輪候院舍 (可多選)</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {branches.map(b => (
                <label key={b} className="inline-flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-emerald-500 rounded-md border-slate-300 focus:ring-emerald-400"
                    checked={formData.targetBranch.includes(b)}
                    onChange={() => handleBranchChange(b)}
                  />
                  <span className="text-slate-700 group-hover:text-emerald-600 transition-colors">{b}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">評估預約時間</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all"
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
                className="w-20 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all"
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
                {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select
                className="w-20 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all"
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
                {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">登記日期 <span className="text-rose-400">*</span></label>
            <input type="date" name="registerDate" value={formData.registerDate} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-2">評估後意見 (供內部參考)</label>
            <textarea name="evaluationComments" value={formData.evaluationComments} onChange={handleInputChange} rows="3" className="w-full border border-slate-300 rounded-xl p-3 bg-amber-50 placeholder-slate-400 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 shadow-sm transition-all" placeholder="填寫適合或不適合的理由、家訪狀況、家屬期望等..."></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
          長者基本資料
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">姓名 <span className="text-rose-400">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required autoFocus={selectedPatient !== null} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">性別</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all">
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">年齡</label>
            <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="0" max="150" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
          聯絡與居住資訊
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">聯絡人 (關係) <span className="text-rose-400">*</span></label>
            <input type="text" name="contactName" value={formData.contactName} onChange={handleInputChange} placeholder="例如: 陳先生(子)" required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">聯絡電話 <span className="text-rose-400">*</span></label>
            <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">所在區域</label>
            <select name="region" value={formData.region} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white shadow-sm transition-all">
              <option value="">請選擇區域...</option>
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">家訪地址</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-rose-400 rounded-full"></span>
          病史與備註
        </h3>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">病史及身體狀況</label>
            <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} rows="2" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">其他備註</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows="2" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 shadow-sm transition-all"></textarea>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
        {isEdit && (
          <button type="button" onClick={() => setSelectedPatient(null)} className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all font-medium">取消</button>
        )}
        <button type="submit" disabled={isSaving} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-semibold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-70">
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              儲存中...
            </>
          ) : '儲存資料'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50 text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">頤安三院輪候系統</h1>
            {isLocalMode && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold flex items-center gap-1 shadow-md">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                本地模式
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-sm opacity-80 whitespace-nowrap hidden md:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 font-medium backdrop-blur-sm transition-all text-sm whitespace-nowrap"
            >
              登出
            </button>
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            <button
              onClick={() => { setActiveTab('list'); resetForm(); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${activeTab === 'list' ? 'bg-white/20 backdrop-blur-sm shadow-lg' : 'hover:bg-white/10'}`}
            >
              名單總覽
            </button>
            <button
              onClick={() => { setActiveTab('new'); resetForm(); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all text-sm whitespace-nowrap ${activeTab === 'new' ? 'bg-orange-500 shadow-lg shadow-orange-500/40' : 'bg-orange-500/80 hover:bg-orange-500 shadow-md hover:shadow-lg hover:shadow-orange-500/30'}`}
              title="快捷鍵: Ctrl+N"
            >
              + 新增登記
            </button>

            {isAdmin && (
              <>
                <div className="w-px h-6 bg-white/30 mx-1"></div>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${activeTab === 'admin' ? 'bg-purple-500/80 backdrop-blur-sm shadow-lg' : 'bg-purple-600/60 hover:bg-purple-600/80'}`}
                >
                  用戶管理
                </button>
              </>
            )}

            <div className="w-px h-6 bg-white/30 mx-1"></div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              multiple
              style={{ display: 'none' }}
              ref={excelInputRef}
              onChange={handleImportExcel}
            />
            <button
              onClick={() => excelInputRef.current?.click()}
              disabled={loading || isLocalMode}
              className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 font-medium disabled:opacity-50 transition-all text-sm whitespace-nowrap"
              title={isLocalMode ? '本地模式無法導入 Excel' : ''}
            >
              導入
            </button>
            <button
              onClick={exportToExcel}
              className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 font-medium transition-all text-sm whitespace-nowrap"
            >
              導出
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'list' && (
          <div className="space-y-5">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-200/50">
              {/* Status filter chips */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-500 block mb-2">快速篩選狀態</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterStatus('All')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === 'All' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    全部 ({patients.length})
                  </button>
                  {statuses.filter(s => s !== '已刪除').map(s => {
                    const sStyle = statusStyles[s] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                    const isActive = filterStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(isActive ? 'All' : s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive ? `${sStyle.bg} ${sStyle.text} ring-2 ring-offset-1 ring-slate-300` : `${sStyle.bg} ${sStyle.text} hover:ring-2 hover:ring-slate-200`}`}
                      >
                        {s} ({statusCounts[s] || 0})
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-5 items-end">
                <div className="min-w-[140px]">
                  <label className="text-sm font-semibold text-slate-500 block mb-2">輪候院舍</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                    <option value="All">全部</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="min-w-[100px]">
                  <label className="text-sm font-semibold text-slate-500 block mb-2">性別</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                    <option value="All">全部</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="min-w-[120px]">
                  <label className="text-sm font-semibold text-slate-500 block mb-2">登記年份</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                    <option value="All">全部</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                </div>
                <div className="flex-grow min-w-[280px]">
                  <label className="text-sm font-semibold text-slate-500 block mb-2">關鍵字搜尋</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                    placeholder="輸入長者姓名、電話或聯絡人..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-200 rounded-xl p-2 bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 text-sm"
                  >
                    <option value={10}>10 筆/頁</option>
                    <option value={25}>25 筆/頁</option>
                    <option value={50}>50 筆/頁</option>
                  </select>
                  <span className="text-sm text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl font-medium">
                    第 <span className="text-emerald-600 font-bold">{currentPage}</span>/<span className="text-emerald-600 font-bold">{totalPages || 1}</span> 頁，共 <span className="text-emerald-600 font-bold">{filteredPatients.length}</span> 筆
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table ref={tableRef} className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('status')}>
                        狀態 {renderSortIcon('status')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('targetBranch')}>
                        輪候院舍 {renderSortIcon('targetBranch')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('name')}>
                        姓名 {renderSortIcon('name')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('region')}>
                        所在區域 {renderSortIcon('region')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('gender')}>
                        性別 {renderSortIcon('gender')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('age')}>
                        年齡 {renderSortIcon('age')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('contactName')}>
                        聯絡人 {renderSortIcon('contactName')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('registerDate')}>
                        登記日期 {renderSortIcon('registerDate')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/50 select-none transition-colors" onClick={() => requestSort('evaluationDate')}>
                        家訪時間 {renderSortIcon('evaluationDate')}
                      </th>
                      <th className="p-4 font-semibold text-slate-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="border-b border-slate-100 animate-pulse">
                            <td className="p-4"><span className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-200 text-xs">XXXXXXXX</span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-16 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-20 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-14 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-10 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-10 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-24 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-20 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-4 w-28 rounded"></span></td>
                            <td className="p-4"><span className="bg-slate-200 h-8 w-16 rounded-lg"></span></td>
                          </tr>
                        ))}
                      </tr>
                    ) : filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-12 text-center">
                          <div className="text-slate-300 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          </div>
                          <p className="text-slate-400 mb-4">查無符合條件之名單</p>
                          {patients.length === 0 && (
                            <button
                              onClick={loadSampleData}
                              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-semibold shadow-lg shadow-emerald-200 transition-all"
                            >
                              載入 10 筆範本資料
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedPatients.map((p, idx) => {
                        const s = statusStyles[p.status] || { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200' };
                        return (
                          <React.Fragment key={p.id}>
                            <tr
                              className={`border-b border-slate-100 transition-all cursor-pointer ${selectedPatient?.id === p.id ? 'bg-emerald-50/70' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/80`}
                              onClick={() => selectedPatient?.id === p.id ? setSelectedPatient(null) : openPatientModal(p)}
                              onDoubleClick={() => { openPatientModal(p); setActiveTab('new'); }}
                            >
                              <td className="p-4">
                                <span className={`px-3 py-1.5 text-xs rounded-full font-semibold ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-slate-600">{p.targetBranch.join('、')}</td>
                              <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                              <td className="p-4 text-sm text-slate-500">{p.region || '-'}</td>
                              <td className="p-4 text-sm text-slate-600">{p.gender}</td>
                              <td className="p-4 text-sm text-slate-600">{p.age}</td>
                              <td className="p-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-700">{p.contactName}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(p.contactName, '聯絡人'); }}
                                    className="p-1 text-slate-300 hover:text-emerald-500 transition-colors"
                                    title="複製聯絡人"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                  </button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`tel:${p.contactPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-slate-400 text-xs hover:text-emerald-600 transition-colors"
                                  >
                                    {p.contactPhone}
                                  </a>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(p.contactPhone, '電話'); }}
                                    className="p-1 text-slate-300 hover:text-emerald-500 transition-colors"
                                    title="複製電話"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                  </button>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-slate-600">{p.registerDate}</td>
                              <td className="p-4 text-sm text-sky-600">{p.evaluationDate || '-'}</td>
                              <td className="p-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setPatientToDelete(p); }}
                                  className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-sm font-semibold transition-all ring-1 ring-rose-200"
                                >
                                  刪除
                                </button>
                              </td>
                            </tr>
                            {selectedPatient?.id === p.id && (
                              <tr className="bg-white">
                                <td colSpan="10" className="p-0 border-b-4 border-emerald-400">
                                  <div className="p-8 bg-gradient-to-br from-emerald-50/50 to-slate-50/50">
                                    <div className="flex justify-between items-center mb-6 border-b border-emerald-100 pb-4">
                                      <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        正在編輯：{p.name} 的資料
                                      </h3>
                                      <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors">
                                        收起 ▲
                                      </button>
                                    </div>
                                    {renderFormUI(true)}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-200 bg-slate-50/50">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      最首
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      上一頁
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-emerald-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      下一頁
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      最尾
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-slate-200/50 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-700">新增輪候登記</h2>
              </div>
            </div>
            {renderFormUI(false)}
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPage onBack={() => setActiveTab('list')} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 md:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          <button
            onClick={() => { setActiveTab('list'); resetForm(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'list' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            <span className="text-xs font-medium">名單</span>
          </button>
          <button
            onClick={() => { setActiveTab('new'); resetForm(); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'new' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <div className={`w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg ${activeTab === 'new' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <span className="text-xs font-medium">新增</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'admin' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <span className="text-xs font-medium">管理</span>
            </button>
          )}
        </div>
      </nav>

      {patientToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 transform transition-all">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 text-center mb-2">確認移至已刪除</h3>
            <p className="text-slate-500 text-center mb-8">
              確定要將長者 <strong className="text-slate-700">{patientToDelete.name}</strong> 的資料移至「已刪除」狀態嗎？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPatientToDelete(null)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 font-semibold shadow-lg shadow-rose-200 transition-all"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
