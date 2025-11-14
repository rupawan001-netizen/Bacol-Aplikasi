import React, { useState, useMemo, useRef } from 'react';
import BkpTable from '../components/bkp/BkpTable';
import type { BkpData } from '../types';
import Pagination from '../components/bku/Pagination';
import BkpFormModal from '../components/bkp/BkpFormModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import ExportModal from '../components/shared/ExportModal';
import { Plus, Download, Upload } from 'lucide-react';
import { exportToExcel, importFromExcel } from '../utils/fileHandlers';
import { formatDate, safeFormatDateForImport } from '../utils/formatter';
import { v4 as uuidv4 } from 'uuid';

interface BukuKasPembantuProps {
  bkpData: BkpData[];
  onSubmit: (formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => void;
  onDelete: (id: string) => void;
  onImport: (data: BkpData[]) => void;
  categories: string[];
}

const BukuKasPembantu: React.FC<BukuKasPembantuProps> = ({ bkpData, onSubmit, onDelete, onImport, categories }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BkpData | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importedData, setImportedData] = useState<BkpData[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 5;

  const totalPages = Math.ceil(bkpData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bkpData.slice(startIndex, endIndex);
  }, [bkpData, currentPage]);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleOpenModalForNew = () => {
      setEditingEntry(null);
      setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
      const entry = bkpData.find(item => item.id === id);
      if (entry) {
          setEditingEntry(entry);
          setIsModalOpen(true);
      }
  };
  
  const handleDeleteClick = (id: string) => {
      setDeletingId(id);
      setIsConfirmDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
    }
    setDeletingId(null);
    setIsConfirmDeleteModalOpen(false);
  };

  const handleFormSubmit = (formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => {
      onSubmit(formData, id);
      setIsModalOpen(false);
      setEditingEntry(null);
  };

  const handleExport = (fileName: string) => {
    const dataToExport = bkpData.map(item => ({
      'Tanggal': formatDate(item.tanggal),
      'Bukti Transaksi': item.bukti,
      'Uraian': item.uraian,
      'Kategori': item.kategori,
      'Kode Rincian Belanja': item.kode,
      'Debet (Penerimaan)': item.debet,
      'Kredit (Pengeluaran)': item.kredit,
    }));
    exportToExcel(dataToExport, fileName, 'Buku Kas Pembantu');
    setIsExportModalOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
        const rawData = await importFromExcel(file);
        const formattedData: BkpData[] = rawData.map((row: any) => ({
            id: uuidv4(),
            tanggal: safeFormatDateForImport(row['Tanggal']),
            bukti: String(row['Bukti Transaksi'] || '022.01'),
            uraian: String(row['Uraian'] || ''),
            kategori: String(row['Kategori'] || 'Lain-lain'),
            kode: String(row['Kode Rincian Belanja'] || ''),
            debet: Number(row['Debet (Penerimaan)'] || 0),
            kredit: Number(row['Kredit (Pengeluaran)'] || 0),
            saldo: 0, 
        }));
        setImportedData(formattedData);
        setIsImportConfirmOpen(true);
    } catch (error) {
        console.error("Error importing file:", error);
        alert("Gagal mengimpor file. Pastikan format file benar.");
    } finally {
       if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (importedData) {
        onImport(importedData);
    }
    setIsImportConfirmOpen(false);
    setImportedData(null);
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-800 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Buku Kas Pembantu</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".xlsx, .xls" />
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleOpenModalForNew}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Buat Data BKP Baru</span>
            </button>
        </div>
      </div>

      <BkpTable data={paginatedData} onEdit={handleEdit} onDelete={handleDeleteClick} />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <BkpFormModal 
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
        }}
        onSubmit={handleFormSubmit}
        entryToEdit={editingEntry}
        categories={categories}
      />
      
      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini tidak dapat dibatalkan."
      />

      <ConfirmationModal
        isOpen={isImportConfirmOpen}
        onClose={() => setIsImportConfirmOpen(false)}
        onConfirm={confirmImport}
        title="Konfirmasi Import"
        message={`Anda akan mengimpor ${importedData?.length || 0} baris data. Tindakan ini akan MENGGANTI semua data yang ada saat ini. Lanjutkan?`}
        confirmText="Ya, Import"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExport}
        defaultFileName={`Data_BKP_${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );
};

export default BukuKasPembantu;