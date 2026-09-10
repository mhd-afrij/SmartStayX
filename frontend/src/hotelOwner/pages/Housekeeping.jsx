import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { SkeletonCard, EmptyState, ErrorState } from "../../components/ui/States";

const Housekeeping = () => {
  const { axios, getToken } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("/api/housekeeping", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setTasks(data.tasks || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <SkeletonCard className="h-10 w-full" />;
  if (error) return <ErrorState description="Could not load housekeeping tasks." onRetry={fetchTasks} />;
  if (tasks.length === 0) return <EmptyState icon={null} title="No tasks yet" description="Create a new housekeeping task to get started." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Housekeeping</h1>
      <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Manage room cleaning workflow.</p>
      {/* TODO: add task list, create task form, status transitions */}
    </div>
  );
};

export default Housekeeping;