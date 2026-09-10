import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { SkeletonCard, EmptyState, ErrorState } from "../../components/ui/States";

const Inventory = () => {
  const { axios, getToken } = useAppContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchItems = async () => {
    try {
      const { data } = await axios.get("/api/inventory/items", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setItems(data.items || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <SkeletonCard className="h-10 w-full" />;
  if (error) return <ErrorState description="Could not load inventory items." onRetry={fetchItems} />;
  if (items.length === 0) return <EmptyState icon={null} title="No items yet" description="Add inventory items to track stock." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Inventory</h1>
      <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Track items, suppliers, and low‑stock alerts.</p>
      {/* TODO: add item list, create item form, restock actions */}
    </div>
  );
};

export default Inventory;