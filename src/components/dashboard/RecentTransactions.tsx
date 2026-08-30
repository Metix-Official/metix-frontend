'use me';
'use client';

import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock, RotateCcw, AlertCircle, Receipt } from 'lucide-react';
import { Transaction } from '@/data/mockData';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions = [],
}) => {
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
    <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Latest ticket sales and payment activities
          </p>
        </div>
        {transactions.length > 0 && (
          <a
            href="#"
            className="text-xs font-extrabold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[540px]">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 rounded-l-xl whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 whitespace-nowrap">Event & Ticket</th>
                <th className="py-3 px-4 whitespace-nowrap">Amount</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {tx.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {tx.customerEmail}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{tx.eventName}</span>
                      <span className="text-[11px] text-blue-700 font-bold">
                        {tx.quantity}x {tx.ticketType}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                    {tx.amount}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(tx.status)}</td>

                  <td className="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px] whitespace-nowrap">
                    {tx.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
