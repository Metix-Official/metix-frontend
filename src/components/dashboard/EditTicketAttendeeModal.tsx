'use client';

import React, { useState } from 'react';
import {
  MasterOrderTicket,
  updateOwnerTicketAttendeeApi,
} from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import {
  X,
  UserCheck,
  Ticket,
  Mail,
  IdCard,
  ShieldCheck,
  Loader2,
  Save,
  User,
} from 'lucide-react';

interface EditTicketAttendeeModalProps {
  ticket: MasterOrderTicket | null;
  buyerName?: string;
  buyerEmail?: string;
  onClose: () => void;
  onSuccess: (updatedTicket: MasterOrderTicket) => void;
}

const IDENTITY_NONE = 'NONE';

function resolveInitialIdentityType(ticket: MasterOrderTicket): string {
  const rawType = ticket.attendee?.identity_type
    ? String(ticket.attendee.identity_type).toUpperCase()
    : '';
  return rawType === 'KTP' || rawType === 'PASSPORT' || rawType === 'OTHER'
    ? rawType
    : IDENTITY_NONE;
}

export function EditTicketAttendeeModal({
  ticket,
  buyerName,
  buyerEmail,
  onClose,
  onSuccess,
}: EditTicketAttendeeModalProps) {
  if (!ticket) return null;

  return (
    <EditTicketAttendeeModalContent
      key={ticket.id}
      ticket={ticket}
      buyerName={buyerName}
      buyerEmail={buyerEmail}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface EditTicketAttendeeModalContentProps {
  ticket: MasterOrderTicket;
  buyerName?: string;
  buyerEmail?: string;
  onClose: () => void;
  onSuccess: (updatedTicket: MasterOrderTicket) => void;
}

function EditTicketAttendeeModalContent({
  ticket,
  buyerName,
  buyerEmail,
  onClose,
  onSuccess,
}: EditTicketAttendeeModalContentProps) {
  const [fullName, setFullName] = useState(
    () => ticket.attendee?.full_name || ticket.holder_name || ''
  );
  const [email, setEmail] = useState(() => ticket.attendee?.email || '');
  const [identityType, setIdentityType] = useState<string>(() =>
    resolveInitialIdentityType(ticket)
  );
  const [identityNumber, setIdentityNumber] = useState(
    () => ticket.attendee?.identity_number || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      toast.error('Nama lengkap pemegang tiket minimal 2 karakter.');
      return;
    }

    setIsSaving(true);
    try {
      const resolvedIdentityType =
        identityType === 'KTP' || identityType === 'PASSPORT' || identityType === 'OTHER'
          ? identityType
          : null;
      const cleanEmail = email.trim();
      const cleanIdentityNumber = identityNumber.trim();

      const res = await updateOwnerTicketAttendeeApi(ticket.id, {
        full_name: cleanName,
        email: cleanEmail !== '' ? cleanEmail : null,
        identity_type: resolvedIdentityType,
        identity_number: cleanIdentityNumber !== '' ? cleanIdentityNumber : null,
      });

      toast.success(res.message || 'Data pemegang tiket berhasil diperbarui.');
      onSuccess(res.data);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan ke server.';
      toast.error('Gagal Memperbarui Pemegang Tiket', {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in-0"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-5 text-white flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-blue-200">
              <Ticket className="w-3 h-3" />
              <span>{ticket.ticket_code}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Ubah Data Pemegang Tiket
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              {ticket.ticket_type_name}
              {ticket.category ? ` • ${ticket.category}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Buyer vs Ticket Holder Clarity Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-blue-950 font-bold">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Pembeli Order (Tetap):</span>
              </span>
              <span className="truncate max-w-[230px]" title={buyerName || '-'}>
                {buyerName || '-'}
              </span>
            </div>
            {buyerEmail && (
              <div className="text-[11px] text-blue-800/80 text-right truncate">
                {buyerEmail}
              </div>
            )}
            <div className="flex items-start gap-1.5 pt-1.5 border-t border-blue-200/70 text-[11px] text-blue-900 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Perubahan hanya tersimpan pada data <strong>pemegang tiket ini</strong>. Akun login pembeli dan data pembeli di order tidak akan berubah.
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Nama Lengkap Pemegang Tiket</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={255}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap sesuai identitas pemegang tiket"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email Pemegang Tiket (Opsional)</span>
            </label>
            <input
              type="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: teman.pemegang@email.com"
              className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
            />
          </div>

          {/* Identity Type & Number (KTP / Passport) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Jenis Identitas</span>
              </label>
              <Select value={identityType} onValueChange={setIdentityType}>
                <SelectTrigger className="w-full h-10 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  <SelectValue placeholder="Pilih identitas" />
                </SelectTrigger>
                <SelectContent className="z-[80]">
                  <SelectItem value={IDENTITY_NONE}>Tidak diisi</SelectItem>
                  <SelectItem value="KTP">KTP</SelectItem>
                  <SelectItem value="PASSPORT">PASSPORT</SelectItem>
                  <SelectItem value="OTHER">Lainnya (OTHER)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nomor KTP / Passport
              </label>
              <input
                type="text"
                maxLength={100}
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder={
                  identityType === 'PASSPORT'
                    ? 'Contoh: A1234567'
                    : 'Contoh: 3171012345670001'
                }
                className="w-full h-10 px-3.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pemegang Tiket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
