import { useEffect, useState } from 'react';
import { Hotel as HotelIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';

const Hotels = () => {
  const { axios } = useAppContext();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchHotels = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/hotels', { params: { page, limit: 10 } });
      if (data.success) {
        setHotels(data.hotels);
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
    fetchHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div>
      <PageHeader title="Hotels" description="Every hotel registered on SmartStayX, across all owners." />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : error ? (
        <ErrorState description="Could not load hotels." onRetry={fetchHotels} />
      ) : hotels.length === 0 ? (
        <EmptyState icon={HotelIcon} title="No hotels yet" description="No hotels have been registered on the platform." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E0D8] dark:border-[#303631] bg-[#F7F5F0] dark:bg-[#111412]">
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Hotel</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">City</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Owner</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Contact</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Currency</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel._id} className="border-b border-[#E3E0D8] dark:border-[#303631] last:border-b-0 hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {hotel.image ? (
                          <img src={hotel.image} alt={hotel.name} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#A67C52]/10 text-[#8A643F] dark:text-[#C5A47E] flex items-center justify-center">
                            <HotelIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#183B35] dark:text-[#F2EFE8] truncate">{hotel.name}</p>
                          <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] truncate">{hotel.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#183B35] dark:text-[#F2EFE8]">{hotel.city}</td>
                    <td className="py-3 px-4">
                      <p className="text-[#183B35] dark:text-[#F2EFE8]">{hotel.owner?.name || '—'}</p>
                      <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7]">{hotel.owner?.email || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-[#5C6B64] dark:text-[#A9AEA7]">{hotel.contact}</td>
                    <td className="py-3 px-4 text-[#5C6B64] dark:text-[#A9AEA7]">{hotel.currency}</td>
                    <td className="py-3 px-4 text-[#5C6B64] dark:text-[#A9AEA7] text-xs">
                      {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : '—'}
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
        </Card>
      )}
    </div>
  );
};

export default Hotels;
