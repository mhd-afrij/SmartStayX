import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import Title from './Title';

const ServicePortal = ({ roomId, hotelId, onClose }) => {
    const { axios, getToken } = useAppContext();
    const [serviceType, setServiceType] = useState('Housekeeping');
    const [requestDetails, setRequestDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/services/request', {
                serviceType,
                requestDetails,
                roomId,
                hotelId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Room Service</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">How can we help you?</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Housekeeping', 'Maintenance', 'Room Service', 'Other'].map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setServiceType(type)}
                                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                                        serviceType === type 
                                        ? 'bg-[#2563eb] text-white shadow-[#2563eb]/20 shadow-lg' 
                                        : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Details (Optional)</label>
                        <textarea
                            value={requestDetails}
                            onChange={(e) => setRequestDetails(e.target.value)}
                            placeholder="e.g. Please bring extra towels or the AC is not cooling..."
                            className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 outline-none transition resize-none text-slate-700"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                            loading ? 'bg-slate-300' : 'bg-[#2563eb] hover:brightness-105 shadow-[#2563eb]/20 active:scale-[0.98]'
                        }`}
                    >
                        {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServicePortal;
