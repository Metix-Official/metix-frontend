'use client';

import React from 'react';
import { MasterOrderTicket } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Ticket,
  UserCheck,
  Mail,
  IdCard,
  Pencil,
} from 'lucide-react';

interface TicketHoldersTableProps {
  tickets: MasterOrderTicket[];
  isLoading?: boolean;
  onEditTicket: (ticket: MasterOrderTicket) => void;
  emptyDescription?: string;
}

function renderTicketStatusBadge(status?: string | null) {
  const s = (status || 'ACTIVE').toUpperCase();
  if (s === 'USED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
        USED
      </span>
    );
  }
  if (s === 'CANCELLED' || s === 'REFUNDED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
      {s}
    </span>
  );
}

export function TicketHoldersTable({
  tickets,
  isLoading = false,
  onEditTicket,
  emptyDescription = 'Belum ada tiket terbit untuk pesanan ini. Tiket akan muncul setelah order berstatus PAID.',
}: TicketHoldersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100">
            <Skeleton className="w-28 h-5 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="py-10 text-center space-y-2.5 bg-slate-50/70 rounded-2xl border border-slate-200/80 px-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
          <Ticket className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-extrabold text-slate-900">
          Belum Ada Tiket Terbit
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600 border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4 whitespace-nowrap">Kode & Tipe Tiket</th>
            <th className="py-3 px-4 whitespace-nowrap">Pemegang Tiket</th>
            <th className="py-3 px-4 whitespace-nowrap">Email Pemegang</th>
            <th className="py-3 px-4 whitespace-nowrap">KTP / Passport</th>
            <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
            <th className="py-3 px-4 text-center whitespace-nowrap">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {tickets.map((ticket, index) => {
            const fullName = ticket.attendee?.full_name || ticket.holder_name || '-';
            const email = ticket.attendee?.email || '-';
            const identityType = ticket.attendee?.identity_type;
            const identityNumber = ticket.attendee?.identity_number;

            return (
              <tr key={ticket.id || index} className="hover:bg-blue-50/40 transition-colors">
                <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                  <div className="space-y-1">
                    <span className="font-mono font-black text-blue-700 text-[11px] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80 inline-block">
                      {ticket.ticket_code}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-slate-800">{ticket.ticket_type_name}</span>
                      {ticket.category && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          {ticket.category}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                  <div className="inline-flex items-center gap-1.5 font-extrabold text-slate-900">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{fullName}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                  <div className="inline-flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{email}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                  {identityType || identityNumber ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                      <IdCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {identityType && (
                        <span className="font-black text-[10px] text-slate-700 uppercase">
                          {identityType}
                        </span>
                      )}
                      {identityNumber && (
                        <span className="font-mono text-[11px] text-slate-800">
                          {identityNumber}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                  {renderTicketStatusBadge(ticket.status)}
                </td>

                <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                  <button
                    type="button"
                    onClick={() => onEditTicket(ticket)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Ubah Pemegang</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

