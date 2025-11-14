import React, { useState, useRef, useEffect } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import BukuKasUmum from './pages/BukuKasUmum';
import BukuKasPembantu from './pages/BukuKasPembantu';
import Peminjam from './pages/Peminjam';
import Setoran from './pages/Setoran';
import RekapPeminjam from './pages/RekapPeminjam';
import SaldoAkhir from './pages/SaldoAkhir';
import Rekonsiliasi from './pages/Rekonsiliasi';
import LaporanRekonsiliasiAkhir from './pages/LaporanRekonsiliasiAkhir';
import SplashScreen from './pages/SplashScreen';
import DisclaimerPage from './pages/DisclaimerPage';
import AuthPage from './pages/AuthPage';
import PlaceholderPage from './pages/PlaceholderPage';
import LogoutConfirmationModal from './components/shared/LogoutConfirmationModal';
import ConfirmationModal from './components/shared/ConfirmationModal';
import Notification from './components/shared/Notification';
import Spinner from './components/shared/Spinner';
import { useMockData } from './hooks/useMockData';
import type { BkuData, BkpData, PeminjamData, SetoranData, User } from './types';
import { exportAllDataToExcel, importAllDataFromExcel } from './utils/fileHandlers';
import { formatDate } from './utils/formatter';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [loginFlowActive, setLoginFlowActive] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // State for Restore from Backup feature
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<{[key: string]: any[]} | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [showRestoreSuccess, setShowRestoreSuccess] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);


  const {
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
  } = useMockData();

  useEffect(() => {
    if (currentUser) {
      setIsAppLoading(false);
    }
  }, [currentUser]);

  const handleLoginClick = () => {
    setLoginFlowActive(true);
  };

  const handleDisclaimerContinue = () => {
    setDisclaimerAccepted(true);
  };
  
  const appLogoutHandler = () => {
    handleLogout();
    setLoginFlowActive(false);
    setDisclaimerAccepted(false);
    setIsLogoutConfirmOpen(false);
  };

  const handleExportAndLogout = async () => {
    const sheets = [
      {
        sheetName: 'Buku Kas Umum',
        data: bkuData.map(item => ({
          'Tanggal': formatDate(item.tanggal),
          'Kode Rekening': item.kode, 'Uraian': item.uraian, 'Kategori': item.kategori,
          'Penerimaan': item.penerimaan, 'Pengeluaran': item.pengeluaran
        }))
      },
      {
        sheetName: 'Buku Kas Pembantu',
        data: bkpData.map(item => ({
          'Tanggal': formatDate(item.tanggal), 'Bukti Transaksi': item.bukti, 'Uraian': item.uraian,
          'Kategori': item.kategori, 'Kode Rincian Belanja': item.kode, 'Debet (Penerimaan)': item.debet,
          'Kredit (Pengeluaran)': item.kredit
        }))
      },
      {
        sheetName: 'Peminjam',
        data: peminjamData.map(item => ({
          'Tanggal': formatDate(item.tanggal), 'Kode Rekening': item.kodeRekening, 'Nama Peminjam': item.nama,
          'Jumlah Pinjaman': item.jumlahPinjaman, 'Bunga': item.bunga, 'Status': item.status, 'Uraian': item.uraian
        }))
      },
      {
        sheetName: 'Setoran',
        data: setoranData.map(item => {
           const peminjam = peminjamData.find(p => p.id === item.peminjamId);
           return {
            'Tanggal': formatDate(item.tanggal), 'Kode Rekening': item.kodeRekening, 'Nama Peminjam': item.namaPeminjam,
            'peminjamId': item.peminjamId, // Critical for restore
            'Tanggal Pinjaman': peminjam ? formatDate(peminjam.tanggal) : '', // Key for re-linking
            'Jumlah Pinjaman': item.jumlahPinjaman, 'Jumlah Setoran': item.jumlahSetoran, 'Bunga': item.bunga,
            'Pokok': item.pokok, 'Uraian': item.uraian
           }
        })
      }
    ];

    const fileName = `Bacol_Backup_${currentUser?.email}_${new Date().toISOString().split('T')[0]}`;
    exportAllDataToExcel(sheets, fileName);

    setIsLogoutConfirmOpen(false);
    setShowExportSuccess(true);
    setTimeout(() => {
      appLogoutHandler();
    }, 2500);
  };
  
  const handleRestoreClick = () => {
    restoreFileInputRef.current?.click();
  };
  
  const handleFileRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await importAllDataFromExcel(file);
      setRestoreData(data);
      setRestoreFileName(file.name);
      setIsRestoreConfirmOpen(true);
    } catch (error: any) {
      console.error("Error restoring from backup:", error);
      alert(error.message || "Gagal memulihkan data dari file backup.");
    } finally {
      if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
    }
  };

  const confirmRestore = () => {
    if (restoreData) {
      try {
        handleRestoreFromBackup(restoreData);
        setShowRestoreSuccess(true);
      } catch (error: any) {
        alert(error.message);
      }
    }
    setIsRestoreConfirmOpen(false);
    setRestoreData(null);
    setRestoreFileName('');
  };


  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard bkuData={bkuData} />;
      case 'Buku Kas Umum':
        return <BukuKasUmum bkuData={bkuData} onSubmit={handleBkuSubmit} onDelete={handleBkuDelete} onImport={handleBkuImport} categories={categories} />;
      case 'Buku Kas Pembantu':
        return <BukuKasPembantu bkpData={bkpData} onSubmit={handleBkpSubmit} onDelete={handleBkpDelete} onImport={handleBkpImport} categories={categories} />;
      case 'Peminjam':
        return <Peminjam peminjamData={peminjamData} onSubmit={handlePeminjamSubmit} onDelete={handlePeminjamDelete} onToggleStatus={handlePeminjamToggleStatus} onImport={handlePeminjamImport}/>;
      case 'Setoran':
        return <Setoran setoranData={setoranData} peminjamData={peminjamData} onSubmit={handleSetoranSubmit} onDelete={handleSetoranDelete} onSaveSummaryToBku={handleSaveSummaryToBku} onImport={handleSetoranImport}/>;
      case 'Rekap Peminjam':
        return <RekapPeminjam peminjamData={peminjamData} setoranData={setoranData} />;
      case 'Saldo Akhir':
        return <SaldoAkhir bkuData={bkuData} />;
      case 'Rekonsiliasi':
        return <Rekonsiliasi bkuData={bkuData} bkpData={bkpData} onSaveReconciliation={handleSaveReconciliation} />;
      case 'Laporan Rekonsiliasi Akhir':
        return <LaporanRekonsiliasiAkhir history={reconciliationHistory} />;
      default:
        return <PlaceholderPage title={activePage} />;
    }
  };

  if (isAppLoading) {
    return <Spinner text="Mempersiapkan data Anda..." />;
  }
  
  if (currentUser) {
    return (
      <>
        <input type="file" ref={restoreFileInputRef} onChange={handleFileRestore} className="hidden" accept=".xlsx, .xls" />
        <Layout 
          activePage={activePage} 
          setActivePage={setActivePage} 
          currentUser={currentUser} 
          onLogout={appLogoutHandler}
          onLogoutClick={() => setIsLogoutConfirmOpen(true)}
          onRestoreClick={handleRestoreClick}
        >
          {renderPage()}
        </Layout>
        <LogoutConfirmationModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onLogout={appLogoutHandler}
          onExportAndLogout={handleExportAndLogout}
        />
        <ConfirmationModal
          isOpen={isRestoreConfirmOpen}
          onClose={() => setIsRestoreConfirmOpen(false)}
          onConfirm={confirmRestore}
          title="Konfirmasi Pulihkan Data"
          message={`Anda akan memulihkan data dari file "${restoreFileName}". Tindakan ini akan MENGGANTI SEMUA DATA yang ada saat ini. Apakah Anda yakin?`}
          confirmText="Ya, Pulihkan"
        />
        <Notification
          message="Data berhasil di-export! Anda akan log out."
          show={showExportSuccess}
          onClose={() => setShowExportSuccess(false)}
        />
        <Notification
          message="Data berhasil dipulihkan dari backup!"
          show={showRestoreSuccess}
          onClose={() => setShowRestoreSuccess(false)}
        />
      </>
    );
  }

  if (loginFlowActive) {
    if (!disclaimerAccepted) {
        return <DisclaimerPage onContinue={handleDisclaimerContinue} />;
    }
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} setIsAppLoading={setIsAppLoading} />;
  }
  
  return <SplashScreen onLoginClick={handleLoginClick} />;
}

export default App;