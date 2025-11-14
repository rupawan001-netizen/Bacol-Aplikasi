import React, { useState, useEffect, useMemo } from 'react';
import type { SetoranData, PeminjamData } from '../../types';
import { X } from 'lucide-react';
import { numberToWords, formatCurrency } from '../../utils/formatter';

interface SetoranFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<SetoranData, 'id'>, id?: string) => void;
    entryToEdit?: SetoranData | null;
    peminjamData: PeminjamData[];
}

const SetoranFormModal: React.FC<SetoranFormModalProps> = ({ isOpen, onClose, onSubmit, entryToEdit, peminjamData }) => {
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [kodeRekening, setKodeRekening] = useState('011.01');
    const [peminjamId, setPeminjamId] = useState('');
    const [jumlahSetoran, setJumlahSetoran] = useState<number | string>('');
    const [uraian, setUraian] = useState('');

    const selectedPeminjam = useMemo(() => {
        return peminjamData.find(p => p.id === peminjamId);
    }, [peminjamId, peminjamData]);
    
    const jumlahPinjaman = selectedPeminjam?.jumlahPinjaman ?? 0;
    const bunga = selectedPeminjam?.bunga ?? 0;
    const pokok = useMemo(() => {
        return (Number(jumlahSetoran) || 0) - bunga;
    }, [jumlahSetoran, bunga]);

    useEffect(() => {
        if (entryToEdit) {
            setTanggal(entryToEdit.tanggal);
            setKodeRekening(entryToEdit.kodeRekening);
            setPeminjamId(entryToEdit.peminjamId);
            setJumlahSetoran(entryToEdit.jumlahSetoran);
            setUraian(entryToEdit.uraian);
        } else {
            // Reset form for new entry
            const defaultDate = new Date().toISOString().split('T')[0];
            setTanggal(defaultDate);
            setKodeRekening('011.01');
            setPeminjamId('');
            setJumlahSetoran('');
            setUraian(`Setoran Bulan ${new Date(defaultDate).toLocaleString('id-ID', { month: 'long' })}`);
        }
    }, [entryToEdit, isOpen]);

    useEffect(() => {
        // Auto-update uraian when date changes for a new entry
        if (!entryToEdit) {
            const monthName = new Date(tanggal).toLocaleString('id-ID', { month: 'long' });
            setUraian(`Setoran Bulan ${monthName}`);
        }
    }, [tanggal, entryToEdit]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPeminjam) {
            alert("Silakan pilih peminjam terlebih dahulu.");
            return;
        }
        const data: Omit<SetoranData, 'id'> = {
            tanggal,
            kodeRekening,
            peminjamId,
            namaPeminjam: selectedPeminjam.nama,
            jumlahPinjaman,
            bunga,
            jumlahSetoran: Number(jumlahSetoran) || 0,
            pokok,
            uraian,
        };
        onSubmit(data, entryToEdit?.id);
    };

    if (!isOpen) return null;

    const terbilangText = jumlahSetoran ? numberToWords(Number(jumlahSetoran)) + ' Rupiah' : 'Nol Rupiah';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-gray-700 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-teal-500">
                    <h3 className="text-xl font-semibold text-white">Data Setoran TigaLikur</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 text-right">
                            <label htmlFor="tanggal" className="block text-sm font-medium text-gray-300 mb-1 text-left">Tanggal Setor</label>
                            <input type="date" id="tanggal" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full sm:w-auto bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                        </div>
                        <div>
                            <label htmlFor="kodeRekening" className="block text-sm font-medium text-gray-300 mb-1">Kode Rekening</label>
                            <input type="text" id="kodeRekening" value={kodeRekening} onChange={e => setKodeRekening(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                        </div>
                        <div>
                             <label htmlFor="peminjam" className="block text-sm font-medium text-gray-300 mb-1">Nama Peminjam</label>
                             <select id="peminjam" value={peminjamId} onChange={e => setPeminjamId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required>
                                <option value="" disabled>-- Pilih Peminjam --</option>
                                {peminjamData.map(p => (
                                    <option key={p.id} value={p.id}>{p.nama}</option>
                                ))}
                             </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Jumlah Pinjaman</label>
                            <input type="text" value={formatCurrency(jumlahPinjaman)} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none" readOnly />
                        </div>
                        <div>
                            <label htmlFor="jumlahSetoran" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Setoran</label>
                            <input type="number" id="jumlahSetoran" value={jumlahSetoran} onChange={e => setJumlahSetoran(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Bunga (2%)</label>
                            <input type="text" value={formatCurrency(bunga)} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none" readOnly />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Pokok</label>
                            <input type="text" value={formatCurrency(pokok)} className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none" readOnly />
                        </div>
                         <div className="md:col-span-2">
                             <p className="text-xs text-gray-400 mt-1 italic capitalize">{terbilangText}</p>
                         </div>
                         <div className="md:col-span-2">
                            <label htmlFor="uraian" className="block text-sm font-medium text-gray-300 mb-1">Uraian/Keterangan</label>
                            <textarea id="uraian" value={uraian} onChange={e => setUraian(e.target.value)} rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500" required></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors">{entryToEdit ? 'Simpan Perubahan' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetoranFormModal;