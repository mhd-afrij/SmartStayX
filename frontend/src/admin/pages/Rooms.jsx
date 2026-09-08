import { useEffect, useState } from 'react';
import { DoorOpen, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { Toggle } from '../../components/ui/Field';
import Badge from '../../components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';

const STATUS_TONE = {
  available: 'success',
  occupied: 'progress',
  reserved: 'pending',
  cleaning: 'cleaning',
  maintenance: 'maintenance',
  out_of_service: 'neutral',
};

const AMENITY_COLORS = [
  'bg-[#A67C52]/10 text-[#8A643F] dark:text-[#C5A47E]',
  'bg-[#A67C52]/15 text-[#8A643F] dark:text-[#C5A47E]',
  'bg-green-50 text-green-700 dark:text-green-300',
  'bg-purple-50 text-purple-700 dark:text-purple-300',
  'bg-cyan-50 text-cyan-700 dark:text-cyan-300',
];

const Rooms = () => {
  const { axios, formatPrice } = useAppContext();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hotelFilter, setHotelFilter] = useState('');
  const [roomType, setRoomType] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/rooms', {
        params: {
          page,
          limit: 10,
          hotel: hotelFilter || undefined,
          roomType: roomType || undefined,
          availability: availability || undefined,
        },
      });
      if (data.success) {
        setRooms(data.rooms);
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
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hotelFilter, availability]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchRooms();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType]);

  // Hotel options for the filter dropdown
  useEffect(() => {
    let active = true;
    axios
      .get('/api/admin/hotels', { params: { limit: 200 } })
      .then(({ data }) => {
        if (active && data.success) setHotels(data.hotels || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [axios]);

  const handleToggle = async (room) => {
    setBusyId(room._id);
    try {
      const { data } = await axios.patch(`/api/admin/rooms/${room._id}`, { isAvailable: !room.isAvailable });
      if (data.success) {
        setRooms((prev) => prev.map((r) => (r._id === room._id ? { ...r, ...data.room } : r)));
      } else {
        window.alert(data.message || 'Failed to update room');
      }
    } catch {
      window.alert('Failed to update room');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Room Management" description="Every room across all hotels — monitor availability and operational status." />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-[#E3E0D8] dark:border-[#303631]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#72766F] dark:text-[#A9AEA7] pointer-events-none" />
              <select
                value={hotelFilter}
                onChange={(e) => {
                  setPage(1);
                  setHotelFilter(e.target.value);
                }}
                className="pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-[#183B35] dark:text-[#F2EFE8] outline-none focus:border-[#A67C52]/60 transition-colors cursor-pointer"
              >
                <option value="">All hotels</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Room type..."
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-40 pl-3 pr-3 py-2 text-xs rounded-lg border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-[#183B35] dark:text-[#F2EFE8] placeholder:text-[#72766F] dark:placeholder:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors"
            />
            <Select
              value={availability}
              onChange={(e) => {
                setPage(1);
                setAvailability(e.target.value);
              }}
              className="!h-9 !text-xs w-40"
            >
              <option value="">All availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState description="Could not load rooms." onRetry={fetchRooms} />
        ) : rooms.length === 0 ? (
          <EmptyState icon={DoorOpen} title="No rooms found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E3E0D8] dark:border-[#303631] bg-[#F7F5F0] dark:bg-[#111412]">
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Room</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Hotel</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Price / night</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Amenities</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room._id} className="border-b border-[#E3E0D8] dark:border-[#303631] last:border-b-0 hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {room.images?.[0] ? (
                            <img src={room.images[0]} alt={room.roomNumber} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#A67C52]/10 text-[#8A643F] dark:text-[#C5A47E] flex items-center justify-center">
                              <DoorOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-[#183B35] dark:text-[#F2EFE8] truncate">{room.roomNumber}</p>
                            <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] truncate">{room.roomType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-[#183B35] dark:text-[#F2EFE8] truncate">{room.hotel?.name || '—'}</p>
                        <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] truncate">{room.hotel?.city || '—'}</p>
                      </td>
                      <td className="py-3 px-4 text-[#183B35] dark:text-[#F2EFE8] font-medium whitespace-nowrap">{formatPrice(room.pricePerNight)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(room.amenities || []).slice(0, 3).map((a, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${AMENITY_COLORS[i % AMENITY_COLORS.length]}`}
                            >
                              {a}
                            </span>
                          ))}
                          {(room.amenities || []).length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EFEEE8] dark:bg-[#111412] text-[#72766F] dark:text-[#A9AEA7]">
                              +{(room.amenities || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={STATUS_TONE[room.status] || 'neutral'}>{room.status || (room.isAvailable ? 'available' : 'out_of_service')}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end">
                          <Toggle
                            checked={!!room.isAvailable}
                            onChange={() => handleToggle(room)}
                            disabled={busyId === room._id}
                            label=""
                          />
                        </div>
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
    </div>
  );
};

export default Rooms;
