import { useEffect, useState } from 'react';
import { UserRound, Search, ChevronLeft, ChevronRight, Eye, X, CalendarCheck, Heart, BedDouble } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';

const BOOKING_STATUS_TONE = {
  pending: 'pending',
  confirmed: 'confirmed',
  checked_in: 'checkedIn',
  checked_out: 'completed',
  cancelled: 'cancelled',
  expired: 'expired',
  reservation: 'progress',
};

const dateFmt = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0">
    <span className="text-xs text-[#879497] dark:text-[#6B828A]">{label}</span>
    <span className="text-sm text-[#003844] dark:text-[#E9F1F2] text-right font-medium">{value || '—'}</span>
  </div>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-1.5 text-xs font-medium text-[#879497] dark:text-[#6B828A] uppercase tracking-wider mb-3">
    <Icon className="w-3.5 h-3.5" /> {children}
  </p>
);

const GuestDetail = ({ guest, bookings, formatPrice, loading, onClose }) => {
  if (!guest) return null;
  const p = guest.profile || {};
  const prefs = p.preferences || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-[#E8E0D1] dark:border-[#232737]">
          <div className="flex items-center gap-4 min-w-0">
            {guest.image ? (
              <img src={guest.image} alt={guest.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center text-lg font-semibold shrink-0">
                {guest.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[#003844] dark:text-[#E9F1F2] truncate">{guest.name}</h3>
              <p className="text-xs text-[#879497] dark:text-[#6B828A] truncate">{guest.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F3ECDE] dark:hover:bg-[#232737] text-[#879497] dark:text-[#6B828A] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <SectionTitle icon={UserRound}>Profile</SectionTitle>
              <DetailRow label="Status" value={guest.status || 'active'} />
              <DetailRow label="Phone" value={p.phone} />
              <DetailRow label="Country" value={p.country} />
              <DetailRow label="Preferred language" value={p.preferredLanguage} />
              <DetailRow label="Preferred currency" value={p.preferredCurrency} />
              <DetailRow label="Member since" value={dateFmt(guest.createdAt)} />
            </div>
            <div>
              <SectionTitle icon={Heart}>Preferences & requests</SectionTitle>
              <DetailRow label="Room type" value={prefs.roomType} />
              <DetailRow label="Travel purpose" value={prefs.travelPurpose} />
              <DetailRow label="Special requests" value={prefs.specialRequests} />
              {prefs.amenities?.length > 0 && (
                <div className="py-2 border-b border-[#E8E0D1] dark:border-[#232737]">
                  <p className="text-xs text-[#879497] dark:text-[#6B828A] mb-1.5">Preferred amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {prefs.amenities.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {guest.recentSearchedCities?.length > 0 && (
                <div className="py-2">
                  <p className="text-xs text-[#879497] dark:text-[#6B828A] mb-1.5">Recently searched cities</p>
                  <div className="flex flex-wrap gap-1">
                    {guest.recentSearchedCities.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-[#F3ECDE] dark:bg-[#10131D] text-[#879497] dark:text-[#6B828A]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle icon={CalendarCheck}>Booking history ({bookings.length})</SectionTitle>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#879497] dark:text-[#6B828A]">
                This guest has no bookings yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E8E0D1] dark:border-[#232737]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                      <th className="py-2.5 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Hotel / Room</th>
                      <th className="py-2.5 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Dates</th>
                      <th className="py-2.5 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Total</th>
                      <th className="py-2.5 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id} className="border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0">
                        <td className="py-2.5 px-4">
                          <p className="text-[#003844] dark:text-[#E9F1F2] truncate">{b.hotel?.name || '—'}</p>
                          <p className="text-xs text-[#4D6166] dark:text-[#9FB2B8] truncate">
                            <BedDouble className="w-3 h-3 inline mr-1" />
                            {b.room?.roomNumber ? `${b.room.roomNumber} · ${b.room.roomType}` : '—'}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 text-[#4D6166] dark:text-[#9FB2B8] text-xs whitespace-nowrap">
                          {dateFmt(b.checkInDate)} → {dateFmt(b.checkOutDate)}
                        </td>
                        <td className="py-2.5 px-4 text-[#003844] dark:text-[#E9F1F2] font-medium whitespace-nowrap">{formatPrice(b.totalPrice)}</td>
                        <td className="py-2.5 px-4">
                          <Badge tone={BOOKING_STATUS_TONE[b.status] || 'neutral'}>{b.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Guests = () => {
  const { axios, formatPrice } = useAppContext();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailBookings, setDetailBookings] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchGuests = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/guests', {
        params: { page, limit: 10, search: search || undefined },
      });
      if (data.success) {
        setGuests(data.guests);
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
    fetchGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchGuests();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openDetail = async (guest) => {
    setSelected(guest);
    setDetailBookings([]);
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/guests/${guest._id}`);
      if (data.success) setDetailBookings(data.bookings || []);
    } catch {
      setDetailBookings([]);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Guest Management" description="Guest profiles, preferences, and booking history across the platform." />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E8E0D1] dark:border-[#232737]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879497] dark:text-[#6B828A]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] text-[#003844] dark:text-[#E9F1F2] placeholder:text-[#879497] dark:placeholder:text-[#6B828A] outline-none focus:border-[#D4A853]/60 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState description="Could not load guests." onRetry={fetchGuests} />
        ) : guests.length === 0 ? (
          <EmptyState icon={UserRound} title="No guests found" description="Try adjusting your search." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Guest</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Bookings</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Total spent</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Last booking</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Joined</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g._id} className="border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0 hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-colors cursor-pointer" onClick={() => openDetail(g)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {g.image ? (
                            <img src={g.image} alt={g.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center text-xs font-semibold">
                              {g.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#003844] dark:text-[#E9F1F2] truncate">{g.name}</p>
                            <p className="text-xs text-[#4D6166] dark:text-[#9FB2B8] truncate">{g.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[#003844] dark:text-[#E9F1F2]">
                          <CalendarCheck className="w-3.5 h-3.5 text-[#879497] dark:text-[#6B828A]" />
                          {g.bookings}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#003844] dark:text-[#E9F1F2] font-medium whitespace-nowrap">{formatPrice(g.totalSpent)}</td>
                      <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8] text-xs">{dateFmt(g.lastBooking)}</td>
                      <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8] text-xs">{dateFmt(g.createdAt)}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          icon={Eye}
                          variant="ghost"
                          size="sm"
                          label="View guest"
                          onClick={() => openDetail(g)}
                          className="text-[#B58A2E] dark:text-[#E6C075]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-[#E8E0D1] dark:border-[#232737]">
                <span className="text-xs text-[#879497] dark:text-[#6B828A]">Page {page} of {pages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <GuestDetail
        guest={selected}
        bookings={detailBookings}
        formatPrice={formatPrice}
        loading={detailLoading}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

export default Guests;
