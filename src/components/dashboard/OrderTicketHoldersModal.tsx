'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchMasterOrderDetail,
  MasterOrder,
  MasterOrderTicket,
} from '@/lib/api';
import { TicketHoldersTable } from './TicketHoldersTable';
import { EditTicketAttendeeModal } from './EditTicketAttendeeModal';
import { toast } from '@/components/ui/sonner';
import { X, Users, ExternalLink, Ticket } from 'lucide-react';

interface OrderTicketHoldersModalProps {
  order: MasterOrder | null;
  onClose: () => void;
}

export function OrderTicketHoldersModal({
  order,
  onClose,
}: OrderTicketHoldersModalProps) {
  if (!order) return null;

  return (
    <OrderTicketHoldersModalContent
      key={order.id}
      order={order}
      onClose={onClose}
    />
  );
}

interface OrderTicketHoldersModalContentProps {
  order: MasterOrder;
  onClose: () => void;
}

function OrderTicketHoldersModalContent({
  order,
  onClose,
}: OrderTicketHoldersModalContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<MasterOrderTicket[]>([]);
  const [editingTicket, setEditingTicket] = useState<MasterOrderTicket | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMasterOrderDetail(order.id)
      .then((detail) => {
        if (!cancelled) {
          setTickets(detail?.tickets || []);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'Tidak dapat mengambil daftar tiket untuk order ini.';
          toast.error('Gagal Memuat Tiket Order', {
            description: message,
          });
          setTickets([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const handleTicketUpdated = (updatedTicket: MasterOrderTicket) => {
    setTickets((prev) =>
      prev.map((item) => (item.id === updatedTicket.id ? updatedTicket : item))
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0"
        onClick={(e) => {
          if (e.target === e.currentTarget && !editingTicket) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    Pemegang Tiket — Order #{order.order_number}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Pembeli Order: <strong className="text-slate-700">{order.buyer_name}</strong> ({order.buyer_email})
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/dashboard/orders/${order.id}/items`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-colors"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Buka Detail Order</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            <TicketHoldersTable
              tickets={tickets}
              isLoading={isLoading}
              onEditTicket={(t) => setEditingTicket(t)}
            />
          </div>
        </div>
      </div>

      <EditTicketAttendeeModal
        ticket={editingTicket}
        buyerName={order.buyer_name}
        buyerEmail={order.buyer_email}
        onClose={() => setEditingTicket(null)}
        onSuccess={handleTicketUpdated}
      />
    </>
  );
}
