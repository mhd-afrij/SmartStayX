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
                <tr className="border-b border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Hotel</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">City</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Owner</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Contact</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Currency</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel._id} className="border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0 hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {hotel.image ? (
                          <img src={hotel.image} alt={hotel.name} className="w-9 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center">
                            <HotelIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#003844] dark:text-[#E9F1F2] truncate">{hotel.name}</p>
                          <p className="text-xs text-[#4D6166] dark:text-[#9FB2B8] truncate">{hotel.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#003844] dark:text-[#E9F1F2]">{hotel.city}</td>
                    <td className="py-3 px-4">
                      <p className="text-[#003844] dark:text-[#E9F1F2]">{hotel.owner?.name || '—'}</p>
                      <p className="text-xs text-[#4D6166] dark:text-[#9FB2B8]">{hotel.owner?.email || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8]">{hotel.contact}</td>
                    <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8]">{hotel.currency}</td>
                    <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8] text-xs">
                      {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : '—'}
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
        </Card>
      )}
    </div>
  );
};

export default Hotels;
