import React, { useMemo } from 'react';
import type { PeminjamData, SetoranData, RekapData } from '../types';
import RekapPeminjamTable from '../components/rekap/RekapPeminjamTable';
import { BookUser } from 'lucide-react';

interface RekapPeminjamProps {
  peminjamData: PeminjamData[];
  setoranData: SetoranData[];
}

const RekapPeminjam: React.FC<RekapPeminjamProps> = ({ peminjamData, setoranData }) => {

  const rekapData = useMemo((): RekapData[] => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    return peminjamData.map(peminjam => {
      const peminjamSetorans = setoranData.filter(s => s.peminjamId === peminjam.id);

      const totalSetoran = peminjamSetorans.reduce((acc, s) => acc + s.jumlahSetoran, 0);
      const totalBunga = peminjamSetorans.reduce((acc, s) => acc + s.bunga, 0);
      const totalPokok = peminjamSetorans.reduce((acc, s) => acc + s.pokok, 0);
      const jumlahTransaksi = peminjamSetorans.length;

      // Calculate missed payments
      const loanStartDate = new Date(peminjam.tanggal);
      const loanStartYear = loanStartDate.getFullYear();
      const loanStartMonth = loanStartDate.getMonth();
      
      let activeMonths = 0;
      if (loanStartYear === currentYear) {
        activeMonths = currentMonth - loanStartMonth + 1;
      } else if (loanStartYear < currentYear) {
        activeMonths = currentMonth + 1;
      }
      activeMonths = Math.max(0, activeMonths);

      const paidMonths = new Set(
        peminjamSetorans
          .filter(s => new Date(s.tanggal).getFullYear() === currentYear)
          .map(s => new Date(s.tanggal).getMonth())
      );
      
      const jumlahTidakBayar = Math.max(0, activeMonths - paidMonths.size);

      return {
        peminjamId: peminjam.id,
        namaPeminjam: peminjam.nama,
        totalSetoran,
        totalBunga,
        totalPokok,
        jumlahTransaksi,
        jumlahTidakBayar,
      };
    });
  }, [peminjamData, setoranData]);

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-800 space-y-4">
      <div className="flex items-center gap-3">
        <BookUser className="h-8 w-8 text-teal-400" />
        <h2 className="text-xl font-semibold text-white">Rekapitulasi Peminjam</h2>
      </div>
      <p className="text-gray-400">Ringkasan aktivitas setoran untuk setiap peminjam selama tahun berjalan.</p>
      
      <RekapPeminjamTable data={rekapData} />
    </div>
  );
};

export default RekapPeminjam;
