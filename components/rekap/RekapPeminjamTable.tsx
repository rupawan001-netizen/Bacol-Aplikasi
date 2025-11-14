import React from 'react';
import { RekapData } from '../../types';
import { formatCurrency } from '../../utils/formatter';

interface RekapPeminjamTableProps {
  data: RekapData[];
}

const RekapPeminjamTable: React.FC<RekapPeminjamTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-300 uppercase bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3">Nama Peminjam</th>
            <th scope="col" className="px-4 py-3 text-right">Jumlah Setoran</th>
            <th scope="col" className="px-4 py-3 text-right">Jumlah Bunga</th>
            <th scope="col" className="px-4 py-3 text-right">Jumlah Pokok</th>
            <th scope="col" className="px-4 py-3 text-center">Jumlah Transaksi</th>
            <th scope="col" className="px-4 py-3 text-center">Bulan Tidak Bayar</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.peminjamId} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50 align-top">
              <td className="px-4 py-4 font-medium text-white">{item.namaPeminjam}</td>
              <td className="px-4 py-4 text-right text-green-400 font-semibold">{formatCurrency(item.totalSetoran)}</td>
              <td className="px-4 py-4 text-right text-orange-400">{formatCurrency(item.totalBunga)}</td>
              <td className="px-4 py-4 text-right text-sky-400">{formatCurrency(item.totalPokok)}</td>
              <td className="px-4 py-4 text-center">{item.jumlahTransaksi} kali</td>
              <td className="px-4 py-4 text-center font-bold text-red-400">{item.jumlahTidakBayar > 0 ? `${item.jumlahTidakBayar} bulan` : '-'}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                Tidak ada data rekapitulasi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RekapPeminjamTable;
