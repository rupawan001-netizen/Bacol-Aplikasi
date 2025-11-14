import { useState, useCallback, useEffect } from 'react';
import type { BkuData, BkpData, PeminjamData, SetoranData, ReconciliationHistoryEntry, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { safeFormatDateForImport } from '../utils/formatter';

const DATA_VERSION = '1.3'; // Version bump for user-specific data
const USERS_STORAGE_KEY = 'bacolBigalowUsers';

const getInitialUsers = (): User[] => {
    try {
        const item = window.localStorage.getItem(USERS_STORAGE_KEY);
        if (item) {
            return JSON.parse(item);
        }
    } catch (error) {
        console.error("Error reading users from localStorage", error);
    }
    // Default admin user
    return [{
        id: uuidv4(),
        email: 'admin@bacol.dev',
        password: 'admin', // In a real app, this should be hashed
        role: 'admin',
    }];
};

/**
 * Parses a 'YYYY-MM-DD' string into a Date object, treating it as a local date
 * to prevent timezone-related date shifts.
 * @param dateString The date string to parse.
 * @returns A Date object.
 */
const parseDateAsLocal = (dateString: string): Date => new Date(`${dateString}T00:00:00`);


// Helper to safely calculate BKU saldo
const calculateBkuSaldo = (data: Omit<BkuData, 'id' | 'saldo'>[]): BkuData[] => {
  let currentSaldo = 0;
  // Sort oldest first. For same-day entries, use a secondary sort key for stability.
  const sorted = [...data].sort((a, b) => {
    const dateComparison = parseDateAsLocal(a.tanggal).getTime() - parseDateAsLocal(b.tanggal).getTime();
    if (dateComparison !== 0) return dateComparison;
    // Fallback to a deterministic key (uraian) to ensure stable sort for same-day items.
    return (a.uraian || '').localeCompare(b.uraian || '');
  });
  
  const processedData = sorted.map(item => {
      const penerimaan = Number(item.penerimaan) || 0;
      const pengeluaran = Number(item.pengeluaran) || 0;
      currentSaldo = currentSaldo + penerimaan - pengeluaran;
      return { ...item, id: (item as any).id || uuidv4(), saldo: currentSaldo };
  });
  // Sort newest first for display.
  return processedData.sort((a, b) => {
      const dateComparison = parseDateAsLocal(b.tanggal).getTime() - parseDateAsLocal(a.tanggal).getTime();
      if (dateComparison !== 0) return dateComparison;
      // Use the same stable sort fallback for descending order.
      return (b.uraian || '').localeCompare(a.uraian || '');
  });
};

// Helper to safely calculate BKP saldo
const calculateBkpSaldo = (data: Omit<BkpData, 'id' | 'saldo'>[]): BkpData[] => {
    let currentSaldo = 0;
    // Sort oldest first. For same-day entries, use a secondary sort key for stability.
    const sorted = [...data].sort((a, b) => {
        const dateComparison = parseDateAsLocal(a.tanggal).getTime() - parseDateAsLocal(b.tanggal).getTime();
        if (dateComparison !== 0) return dateComparison;
        // Fallback to a deterministic key (uraian) to ensure stable sort.
        return (a.uraian || '').localeCompare(b.uraian || '');
    });
    
    const processed = sorted.map(item => {
        const debet = Number(item.debet) || 0;
        const kredit = Number(item.kredit) || 0;
        currentSaldo = currentSaldo + debet - kredit;
        return { ...item, id: (item as any).id || uuidv4(), saldo: currentSaldo };
    });
    // Sort newest first for display.
    return processed.sort((a, b) => {
        const dateComparison = parseDateAsLocal(b.tanggal).getTime() - parseDateAsLocal(a.tanggal).getTime();
        if (dateComparison !== 0) return dateComparison;
        // Use the same stable sort fallback for descending order.
        return (b.uraian || '').localeCompare(a.uraian || '');
    });
}

export const useMockData = () => {
    const [users, setUsers] = useState<User[]>(getInitialUsers);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [bkuData, setBkuData] = useState<BkuData[]>([]);
    const [bkpData, setBkpData] = useState<BkpData[]>([]);
    const [peminjamData, setPeminjamData] = useState<PeminjamData[]>([]);
    const [setoranData, setSetoranData] = useState<SetoranData[]>([]);
    const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationHistoryEntry[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    // Save users to localStorage whenever they change
    useEffect(() => {
        try {
            window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        } catch (error) {
            console.error("Error writing users to localStorage", error);
        }
    }, [users]);
    
    // Load/save user-specific data when currentUser changes
    useEffect(() => {
        if (currentUser) {
            const USER_DATA_KEY = `bacolBigalowData_v${DATA_VERSION}_${currentUser.id}`;
            try {
                const item = window.localStorage.getItem(USER_DATA_KEY);
                const data = item ? JSON.parse(item) : {
                    bkuData: [], bkpData: [], peminjamData: [], setoranData: [], reconciliationHistory: [], 
                    categories: ['Umum', 'ATK', 'Operasional', 'Penerimaan Bunga', 'Penerimaan Pokok', 'Perjalanan Dinas', 'Gaji Karyawan']
                };
                setBkuData(data.bkuData);
                setBkpData(data.bkpData);
                setPeminjamData(data.peminjamData);
                setSetoranData(data.setoranData);
                setReconciliationHistory(data.reconciliationHistory);
                setCategories(data.categories);
            } catch (error) {
                console.error("Error loading user data from localStorage", error);
            }
        } else {
            // Clear data on logout
            setBkuData([]);
            setBkpData([]);
            setPeminjamData([]);
            setSetoranData([]);
            setReconciliationHistory([]);
            setCategories([]);
        }
    }, [currentUser]);

    // Persist data for the logged-in user
    useEffect(() => {
        if (currentUser) {
            const USER_DATA_KEY = `bacolBigalowData_v${DATA_VERSION}_${currentUser.id}`;
            try {
                const stateToSave = { bkuData, bkpData, peminjamData, setoranData, reconciliationHistory, categories };
                window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Error writing user data to localStorage", error);
            }
        }
    }, [currentUser, bkuData, bkpData, peminjamData, setoranData, reconciliationHistory, categories]);

    const handleLogin = useCallback(async (email: string, password: string): Promise<User> => {
        const user = users.find(u => u.email === email);
        if (user && user.password === password) { // Plain text comparison
            setCurrentUser(user);
            return user;
        }
        throw new Error("Email atau kata sandi salah.");
    }, [users]);

    const handleRegister = useCallback(async (email: string, password: string): Promise<User> => {
        if (users.some(u => u.email === email)) {
            throw new Error("Email ini sudah terdaftar.");
        }
        const newUser: User = {
            id: uuidv4(),
            email,
            password,
            role: email === 'admin@bacol.dev' ? 'admin' : 'user',
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    }, [users]);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    const reprocessBku = (newData: BkuData[]) => {
       const processed = calculateBkuSaldo(newData);
       setBkuData(processed);
    };

     const reprocessBkp = (newData: BkpData[]) => {
       const processed = calculateBkpSaldo(newData);
       setBkpData(processed);
    };

    const handleBkuSubmit = useCallback((formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => {
        if (formData.kategori && !categories.includes(formData.kategori)) {
            setCategories(prev => [...new Set([...prev, formData.kategori])].sort());
        }
        let newData;
        if (id) {
            newData = bkuData.map(item => item.id === id ? { ...item, ...formData } : item);
        } else {
            newData = [...bkuData, { ...formData, id: uuidv4(), saldo: 0 }];
        }
        reprocessBku(newData);
    }, [bkuData, categories]);
    
    const handleBkuDelete = useCallback((id: string) => {
        const newData = bkuData.filter(item => item.id !== id);
        reprocessBku(newData);
    }, [bkuData]);
    
    const handleBkuImport = useCallback((data: BkuData[]) => {
        const newCategories = [...new Set(data.map(item => item.kategori).filter(Boolean))];
        if (newCategories.length > 0) {
            setCategories(prev => [...new Set([...prev, ...newCategories])].sort());
        }
        reprocessBku(data);
    }, []);

    const handleBkpSubmit = useCallback((formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => {
        if (formData.kategori && !categories.includes(formData.kategori)) {
            setCategories(prev => [...new Set([...prev, formData.kategori])].sort());
        }
        let newData;
        if (id) {
            newData = bkpData.map(item => item.id === id ? { ...item, ...formData } : item);
        } else {
            newData = [...bkpData, { ...formData, id: uuidv4(), saldo: 0 }];
        }
        reprocessBkp(newData);
    }, [bkpData, categories]);
    
    const handleBkpDelete = useCallback((id: string) => {
        const newData = bkpData.filter(item => item.id !== id);
        reprocessBkp(newData);
    }, [bkpData]);

    const handleBkpImport = useCallback((data: BkpData[]) => {
        const newCategories = [...new Set(data.map(item => item.kategori).filter(Boolean))];
        if (newCategories.length > 0) {
            setCategories(prev => [...new Set([...prev, ...newCategories])].sort());
        }
        reprocessBkp(data);
    }, []);
    
    const handlePeminjamSubmit = useCallback((formData: Omit<PeminjamData, 'id' | 'bunga' | 'status'>, id?: string) => {
        const bunga = formData.jumlahPinjaman * 0.02;
        if (id) {
            setPeminjamData(peminjamData.map(item => item.id === id ? { ...item, ...formData, bunga } : item));
        } else {
            const newEntry: PeminjamData = {
                ...formData,
                id: uuidv4(),
                bunga,
                status: 'Belum Lunas',
            };
            setPeminjamData(prev => [...prev, newEntry].sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
        }
    }, [peminjamData]);

    const handlePeminjamDelete = useCallback((id: string) => {
        setPeminjamData(peminjamData.filter(item => item.id !== id));
        setSetoranData(s => s.filter(item => item.peminjamId !== id));
    }, [peminjamData]);
    
    const handlePeminjamToggleStatus = useCallback((id: string) => {
        setPeminjamData(peminjamData.map(item => item.id === id ? { ...item, status: item.status === 'Lunas' ? 'Belum Lunas' : 'Lunas' } : item));
    }, [peminjamData]);

    const handlePeminjamImport = useCallback((data: PeminjamData[]) => {
        setPeminjamData(data.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    }, []);
    
    const handleSetoranSubmit = useCallback((formData: Omit<SetoranData, 'id'>, id?: string) => {
        let newSetoranData;
        const bkpEntry: Omit<BkpData, 'id'|'saldo'> = {
            tanggal: formData.tanggal,
            kode: formData.kodeRekening,
            bukti: `Setoran ${formData.namaPeminjam}`,
            uraian: formData.uraian,
            kategori: 'Penerimaan Setoran',
            debet: formData.jumlahSetoran,
            kredit: 0,
        };

        if (id) {
            newSetoranData = setoranData.map(item => item.id === id ? { id, ...formData } : item);
            const newBkpData = bkpData.map(item => (item as any).sourceId === id ? { ...item, ...bkpEntry } : item);
            reprocessBkp(newBkpData);
        } else {
            const newSetoranId = uuidv4();
            newSetoranData = [...setoranData, { ...formData, id: newSetoranId }];
            const newBkpData = [...bkpData, { ...bkpEntry, id: uuidv4(), saldo: 0, sourceId: newSetoranId }];
            reprocessBkp(newBkpData);
        }
        setSetoranData(newSetoranData.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
    }, [setoranData, bkpData]);
    
    const handleSetoranDelete = useCallback((id: string) => {
        setSetoranData(setoranData.filter(item => item.id !== id));
        const newBkpData = bkpData.filter(item => (item as any).sourceId !== id);
        reprocessBkp(newBkpData);
    }, [setoranData, bkpData]);

    const handleSetoranImport = useCallback((data: SetoranData[]) => {
        setSetoranData(data.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
        // Note: Importing setoran does not auto-populate BKP to avoid complexity.
    }, []);

    const handleSaveSummaryToBku = useCallback((summaryData: { totalBunga: number, totalPokok: number, month: string, year: string }) => {
        const { totalBunga, totalPokok, month, year } = summaryData;
        const monthName = new Date(0, parseInt(month) - 1).toLocaleString('id-ID', { month: 'long' });
        
        // FIX: Construct date string manually to avoid timezone issues.
        // Use the last day of the month for accuracy.
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const entryDate = `${year}-${month.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

        const bungaEntry: Omit<BkuData, 'id' | 'saldo'> = {
            tanggal: entryDate,
            kode: '4.1.4.03.01',
            uraian: `Penerimaan Bunga Pinjaman Bulan ${monthName} ${year}`,
            kategori: 'Penerimaan Bunga',
            penerimaan: totalBunga,
            pengeluaran: 0,
        };
        const pokokEntry: Omit<BkuData, 'id' | 'saldo'> = {
            tanggal: entryDate,
            kode: '1.1.5.01.01',
            uraian: `Penerimaan Pokok Pinjaman Bulan ${monthName} ${year}`,
            kategori: 'Penerimaan Pokok',
            penerimaan: totalPokok,
            pengeluaran: 0,
        };

        const newData = [...bkuData, { ...bungaEntry, id: uuidv4(), saldo: 0 }, { ...pokokEntry, id: uuidv4(), saldo: 0 }];
        reprocessBku(newData);
    }, [bkuData]);

    const handleSaveReconciliation = useCallback((entry: Omit<ReconciliationHistoryEntry, 'id'>) => {
        const id = `${entry.year}-${entry.month}`;
        setReconciliationHistory(prev => {
            const existing = prev.find(item => item.id === id);
            if (existing) {
                return prev.map(item => item.id === id ? { ...entry, id } : item);
            }
            return [...prev, { ...entry, id }];
        });
    }, []);

    const handleRestoreFromBackup = useCallback((data: { [sheetName: string]: any[] }) => {
        try {
            // Peminjam (must be processed first to map IDs)
            const newPeminjamMap = new Map<string, PeminjamData>();
            if (data['Peminjam'] && Array.isArray(data['Peminjam'])) {
                const importedPeminjam: PeminjamData[] = data['Peminjam'].map((row: any) => ({
                    id: uuidv4(), // Generate new ID
                    tanggal: safeFormatDateForImport(row['Tanggal']),
                    kodeRekening: String(row['Kode Rekening'] || '011.01'),
                    nama: String(row['Nama Peminjam'] || ''),
                    jumlahPinjaman: Number(row['Jumlah Pinjaman'] || 0),
                    bunga: Number(row['Bunga'] || 0),
                    status: row['Status'] === 'Lunas' ? 'Lunas' : 'Belum Lunas',
                    uraian: String(row['Uraian'] || ''),
                }));
                 // Create a map from old nama+tanggal to new ID for setoran mapping
                importedPeminjam.forEach(p => newPeminjamMap.set(`${p.nama}_${p.tanggal}`, p));
                setPeminjamData(importedPeminjam.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
            }

            // Setoran
            if (data['Setoran'] && Array.isArray(data['Setoran'])) {
                const importedSetoran: SetoranData[] = data['Setoran'].map((row: any) => {
                    const peminjamKey = `${String(row['Nama Peminjam'] || '')}_${safeFormatDateForImport(row['Tanggal Pinjaman'])}`; // Use a key to find the new peminjam
                    const correspondingPeminjam = newPeminjamMap.get(peminjamKey);
                    return {
                        id: uuidv4(),
                        tanggal: safeFormatDateForImport(row['Tanggal']),
                        kodeRekening: String(row['Kode Rekening'] || '011.01'),
                        peminjamId: correspondingPeminjam?.id || 'unknown',
                        namaPeminjam: String(row['Nama Peminjam'] || ''),
                        jumlahPinjaman: Number(row['Jumlah Pinjaman'] || 0),
                        jumlahSetoran: Number(row['Jumlah Setoran'] || 0),
                        bunga: Number(row['Bunga'] || 0),
                        pokok: Number(row['Pokok'] || 0),
                        uraian: String(row['Uraian'] || ''),
                    };
                });
                setSetoranData(importedSetoran.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
            }

            // BKU and BKP
            let importedBku: BkuData[] = [];
            if (data['Buku Kas Umum'] && Array.isArray(data['Buku Kas Umum'])) {
                importedBku = data['Buku Kas Umum'].map((row: any) => ({
                    id: uuidv4(),
                    tanggal: safeFormatDateForImport(row['Tanggal']),
                    kode: String(row['Kode Rekening'] || ''),
                    uraian: String(row['Uraian'] || ''),
                    kategori: String(row['Kategori'] || 'Lain-lain'),
                    penerimaan: Number(row['Penerimaan'] || 0),
                    pengeluaran: Number(row['Pengeluaran'] || 0),
                    saldo: 0,
                }));
            }
            
            let importedBkp: BkpData[] = [];
            if (data['Buku Kas Pembantu'] && Array.isArray(data['Buku Kas Pembantu'])) {
                importedBkp = data['Buku Kas Pembantu'].map((row: any) => ({
                    id: uuidv4(),
                    tanggal: safeFormatDateForImport(row['Tanggal']),
                    bukti: String(row['Bukti Transaksi'] || ''),
                    uraian: String(row['Uraian'] || ''),
                    kategori: String(row['Kategori'] || 'Lain-lain'),
                    kode: String(row['Kode Rincian Belanja'] || ''),
                    debet: Number(row['Debet (Penerimaan)'] || 0),
                    kredit: Number(row['Kredit (Pengeluaran)'] || 0),
                    saldo: 0,
                }));
            }
            
            // Reprocess BKU and BKP to calculate saldo
            reprocessBku(importedBku);
            reprocessBkp(importedBkp);
            
            // Categories
            const allImportedCategories = [
                ...importedBku.map(d => d.kategori),
                ...importedBkp.map(d => d.kategori)
            ].filter(Boolean);
            setCategories([...new Set(allImportedCategories)].sort());

        } catch (error) {
            console.error("Error restoring data from backup:", error);
            throw new Error("Gagal memproses file backup. Format mungkin tidak sesuai.");
        }
    }, []);

    return {
        currentUser,
        bkuData,
        bkpData,
        peminjamData,
        setoranData,
        reconciliationHistory,
        categories,
        handleLogin,
        handleRegister,
        handleLogout,
        handleBkuSubmit,
        handleBkuDelete,
        handleBkuImport,
        handleBkpSubmit,
        handleBkpDelete,
        handleBkpImport,
        handlePeminjamSubmit,
        handlePeminjamDelete,
        handlePeminjamToggleStatus,
        handlePeminjamImport,
        handleSetoranSubmit,
        handleSetoranDelete,
        handleSetoranImport,
        handleSaveSummaryToBku,
        handleSaveReconciliation,
        handleRestoreFromBackup
    };
};