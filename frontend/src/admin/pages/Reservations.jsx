import { useEffect, useState } from 'react';
import { CalendarCheck, Search, ChevronLeft, ChevronRight, Eye, X, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { IconButton } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';

const BOOKING_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired', 'reservation'];

const STATUS_TONE = {
  pending: 'pending',
  confirmed: 'confirmed',
  checked_in: 'checkedIn',
  checked_out: 'completed',
  cancelled: 'cancelled',
  expired: 'expired',
  reservation: 'progress',
};

const dateFmt = (value) => (value ? new Date(value).toLocaleDateString() : '—');
const dateTimeFmt = (value) => (value ? new Date(value).toLocaleString() : '—');

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-[#E3E0D8] dark:border-[#303631] last:border-b-0">
    <span className="text-xs text-[#72766F] dark:text-[#A9AEA7]">{label}</span>
    <span className="text-sm text-[#183B35] dark:text-[#F2EFE8] text-right font-medium">{value}</span>
  </div>
);

const ReservationDetail = ({ booking, formatPrice, onClose }) => {
  if (!booking) return null;
  const statusHistory = booking.statusHistory || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[#E3E0D8] dark:border-[#303631]">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[#183B35] dark:text-[#F2EFE8]">Reservation details</h3>
            <p className="text-xs text-[#72766F] dark:text-[#A9AEA7] mt-0.5 break-all">ID: {booking._id}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={STATUS_TONE[booking.status] || 'neutral'}>{booking.status}</Badge>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#EFEEE8] dark:hover:bg-[#303631] text-[#72766F] dark:text-[#A9AEA7]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-xs font-medium text-[#72766F] dark:text-[#A9AEA7] uppercase tracking-wider mb-3">Guest</p>
            <DetailRow label="Name" value={booking.guestDisplayName || booking.user?.name || '—'} />
            <DetailRow label="Email" value={booking.guestEmail || booking.user?.email || '—'} />
            <DetailRow label="Guests" value={booking.guests ?? '—'} />

            <p className="text-xs font-medium text-[#72766F] dark:text-[#A9AEA7] uppercase tracking-wider mt-6 mb-3">Stay</p>
            <DetailRow label="Hotel" value={booking.hotel?.name || '—'} />
            <DetailRow label="Room" value={booking.room?.roomNumber ? `${booking.room.roomNumber} · ${booking.room.roomType}` : '—'} />
            <DetailRow label="Check-in" value={dateFmt(booking.checkInDate)} />
            <DetailRow label="Check-out" value={dateFmt(booking.checkOutDate)} />
            <DetailRow label="Nights" value={booking.nights ?? '—'} />
          </div>

          <div>
            <p className="text-xs font-medium text-[#72766F] dark:text-[#A9AEA7] uppercase tracking-wider mb-3">Payment</p>
            <DetailRow label="Total" value={formatPrice(booking.totalPrice)} />
            <DetailRow label="Base / night" value={booking.basePricePerNight != null ? formatPrice(booking.basePricePerNight) : '—'} />
            <DetailRow label="Dynamic / night" value={booking.dynamicPricePerNight != null ? formatPrice(booking.dynamicPricePerNight) : '—'} />
            <DetailRow label="Multiplier" value={booking.priceMultiplier != null ? `${booking.priceMultiplier}×` : '—'} />
            <DetailRow label="Method" value={booking.paymentMethod || '—'} />
            <DetailRow label="Paid" value={booking.isPaid ? 'Yes' : 'No'} />
            <DetailRow label="Offer discount" value={booking.offerDiscountPercent != null ? `${booking.offerDiscountPercent}%` : '—'} />

            <p className="text-xs font-medium text-[#72766F] dark:text-[#A9AEA7] uppercase tracking-wider mt-6 mb-3">Booking</p>
            <DetailRow label="Created" value={dateTimeFmt(booking.createdAt)} />
            <DetailRow label="Hold expires" value={booking.holdExpiresAt ? dateTimeFmt(booking.holdExpiresAt) : '—'} />
          </div>
        </div>

        {statusHistory.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-xs font-medium text-[#72766F] dark:text-[#A9AEA7] uppercase tracking-wider mb-3">Status history</p>
            <div className="space-y-2">
              {statusHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <Clock className="w-3.5 h-3.5 mt-1 text-[#72766F] dark:text-[#A9AEA7] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#183B35] dark:text-[#F2EFE8]">
                      <span className="text-[#72766F] dark:text-[#A9AEA7]">{h.from || '—'}</span>
                      <span className="mx-1.5 text-[#72766F] dark:text-[#A9AEA7]">→</span>
                      {h.to}
                    </p>
                    <p className="text-xs text-[#72766F] dark:text-[#A9AEA7]">
                      {dateTimeFmt(h.at)}{h.actor ? ` · by ${h.actor}` : ''}
                      {h.reason ? ` · ${h.reason}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Reservations = () => {
  const { axios, formatPrice } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/bookings', {
        params: { page, limit: 10, status: status || undefined, search: search || undefined },
      });
      if (data.success) {
        setBookings(data.bookings);
        setPages(data.pages || 1);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchBookings();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div>
      <PageHeader title="Reservation Management" description="Every booking across all hotels — filter, search, and inspect details." />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E3E0D8] dark:border-[#303631]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#72766F] dark:text-[#A9AEA7]" />
            <input
              type="text"
              placeholder="Search by guest name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-[#183B35] dark:text-[#F2EFE8] placeholder:text-[#72766F] dark:placeholder:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="!h-9 !text-xs w-44"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState description="Could not load reservations." onRetry={fetchBookings} />
        ) : bookings.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No reservations found" description="Try adjusting your search or status filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E3E0D8] dark:border-[#303631] bg-[#F7F5F0] dark:bg-[#111412]">
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Guest</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Hotel / Room</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Dates</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Total</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Payment</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-[#E3E0D8] dark:border-[#303631] last:border-b-0 hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A67C52]/10 text-[#8A643F] dark:text-[#C5A47E] flex items-center justify-center text-xs font-semibold shrink-0">
                            {(b.guestDisplayName || b.user?.name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#183B35] dark:text-[#F2EFE8] truncate">{b.guestDisplayName || b.user?.name || 'Guest'}</p>
                            <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] truncate">{b.guestEmail || b.user?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[#183B35] dark:text-[#F2EFE8] truncate">{b.hotel?.name || '—'}</p>
                        <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] truncate">{b.room?.roomNumber ? `${b.room.roomNumber} · ${b.room.roomType}` : '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-[#5C6B64] dark:text-[#A9AEA7] text-xs whitespace-nowrap">
                        {dateFmt(b.checkInDate)} → {dateFmt(b.checkOutDate)}
                        {b.nights != null && <span className="text-[#72766F] dark:text-[#A9AEA7]"> ({b.nights}n)</span>}
                      </td>
                      <td className="py-3 px-4 text-[#183B35] dark:text-[#F2EFE8] font-medium whitespace-nowrap">{formatPrice(b.totalPrice)}</td>
                      <td className="py-3 px-4">
                        <p className="text-[#183B35] dark:text-[#F2EFE8] text-xs">{b.paymentMethod || '—'}</p>
                        <p className={`text-xs ${b.isPaid ? 'text-green-600 dark:text-green-300' : 'text-[#72766F] dark:text-[#A9AEA7]'}`}>
                          {b.isPaid ? 'Paid' : 'Unpaid'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <IconButton
                          icon={Eye}
                          variant="ghost"
                          size="sm"
                          label="View details"
                          onClick={() => setSelected(b)}
                          className="text-[#8A643F] dark:text-[#C5A47E]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-[#E3E0D8] dark:border-[#303631]">
                <span className="text-xs text-[#72766F] dark:text-[#A9AEA7]">Page {page} of {pages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-[#E3E0D8] dark:border-[#303631] text-[#72766F] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg border border-[#E3E0D8] dark:border-[#303631] text-[#72766F] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ReservationDetail booking={selected} formatPrice={formatPrice} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Reservations;
