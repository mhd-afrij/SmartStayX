import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { SkeletonCard, EmptyState, ErrorState } from "../../components/ui/States";

const Attendance = () => {
  const { axios, getToken } = useAppContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRecords = async () => {
    try {
      const { data } = await axios.get("/api/attendance", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setRecords(data.attendance || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) return <SkeletonCard className="h-10 w-full" />;
  if (error) return <ErrorState description="Could not load attendance records." onRetry={fetchRecords} />;
  if (records.length === 0) return <EmptyState icon={null} title="No attendance records yet" description="Staff can check in/out from the dashboard." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Attendance</h1>
      <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Staff check‑in/check‑out and leave management.</p>
      {/* TODO: add check‑in/out buttons, monthly report, leave requests */}
    </div>
  );
};

export default Attendance;