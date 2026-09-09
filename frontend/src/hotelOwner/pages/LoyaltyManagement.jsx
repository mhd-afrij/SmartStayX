import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { SkeletonCard, EmptyState, ErrorState } from "../../components/ui/States";

const LoyaltyManagement = () => {
  const { axios, getToken } = useAppContext();
  const [config, setConfig] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data } = await axios.get("/api/loyalty/config", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setConfig(data.config);
    } catch {
      setError(true);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get("/api/loyalty/members", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setMembers(data.members || []);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchMembers();
    setLoading(false);
  }, []);

  if (loading) return <SkeletonCard className="h-10 w-full" />;
  if (error) return <ErrorState description="Could not load loyalty data." onRetry={() => (fetchConfig(), fetchMembers())} />;
  if (!config && members.length === 0) return <EmptyState icon={null} title="No loyalty data" description="Configure the loyalty program to get started." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Loyalty Management</h1>
      <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Configure tiers, view members, award and redeem points.</p>
      {/* TODO: add config form, members table, award/redeem actions */}
    </div>
  );
};

export default LoyaltyManagement;