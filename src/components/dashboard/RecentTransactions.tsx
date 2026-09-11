'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Clock, RotateCcw, AlertCircle, Receipt } from 'lucide-react';
import { Transaction } from '@/data/mockData';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions = [],
}) => {
  // Batasi hanya 10 transaksi terbaru
  const displayedTransactions = transactions.slice(0, 10);

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            Pending
          </span>
        );
      case 'Refunded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            <RotateCcw className="w-3 h-3 text-slate-500 shrink-0" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Recent Transactions
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            10 transaksi penjualan tiket terbaru
          </p>
        </div>
        {transactions.length > 0 && (
          <Link
            href="/dashboard/reports"
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[11px] font-black text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition-all border border-blue-200/80 shadow-2xs whitespace-nowrap"
          >
            <span>Semua Data</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {displayedTransactions.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3.5 rounded-l-xl whitespace-nowrap">Customer</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Event & Ticket</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Amount</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3.5 text-right rounded-r-xl whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-xs">
                          {tx.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {tx.customerEmail}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-xs">{tx.eventName}</span>
                        <span className="text-[10px] text-blue-700 font-bold">
                          {tx.quantity}x {tx.ticketType}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 font-extrabold text-slate-900 whitespace-nowrap text-xs">
                      {tx.amount}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">{getStatusBadge(tx.status)}</td>

                    <td className="py-2.5 px-3.5 text-right text-slate-400 font-medium text-[10px] whitespace-nowrap">
                      {tx.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">
              Menampilkan <strong>{displayedTransactions.length}</strong> transaksi terbaru
            </span>
            <Link
              href="/dashboard/reports"
              className="font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline text-[11px]"
            >
              Lihat Semua Data Transaksi &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* Empty State Container */
        <div className="py-10 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
            <Receipt className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900">
              Belum Ada Transaksi
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Belum ada aktivitas penjualan tiket atau transaksi yang tercatat pada akun ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
