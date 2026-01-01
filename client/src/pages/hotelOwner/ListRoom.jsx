import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const ListRoom = () => {
  const [rooms, setRooms] = useState([]);
  const {axios,getToken,user,currency} = useAppContext();
  const navigate = useNavigate();


  // Fetch rooms data when hotel owner 

  const fetchRooms = async () => {
    try {
      const {data} = await axios.get('/api/rooms/Owner', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      }); 
      if(data.success){
        setRooms(data.rooms)
      }else{
        toast.error(data.message)
      }
      
    } catch (error) {
      toast.error(error.message)
    }
  }

  //Toggle Room Availability
  const toggleAvailability = async(roomId)=>{
    const {data} =await axios.post('/api/rooms/toggle-availability',{roomId},{
      headers: { Authorization: `Bearer ${await getToken()}`}})
      if(data.success){
        toast.success(data.message);
        fetchRooms();
      }else{
        toast.error(data.message);
      }
    }



  useEffect(()=>{
    if(user){
      fetchRooms();
    }
  },[user])

  return (
    <div>
      <Title
        align="left"
        font="outfit"
        title="Room Listings"
        subtitle="View, edit, or manage all listed rooms. Keep the information up-to-date to provide the best experience for users."
      />
      <p className="text-gray-500 mt-8">All Rooms</p>

      <div className="w-full max-w-3xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-gray-800 font-medium">Name</th>
              <th className="py-3 px-4 text-gray-800 font-medium max-sm:hidden">
                Facility
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center">
                Price / night
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center">
                Status
              </th>
              <th className="py-3 px-4 text-gray-800 font-medium text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rooms.map((item, index) => (
              <tr key={index}>
                <td className="py-3 px-4 text-gray-700 border-t border-gray-300">
                  {item.roomType}
                </td>
                <td className="py-3 px-4 text-gray-700 border-t border-gray-300 max-sm:hidden">
                  {item.amenities.join(', ')}
                </td>
                <td className="py-3 px-4 text-gray-700 border-t border-gray-300 text-center">
                 {currency} {item.pricePerNight}
                </td>
                <td className="py-3 px-4 border-t border-gray-300 text-sm text-center">
                  <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                    <input 
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.isAvailable}
                      onChange={() => toggleAvailability(item._id)}
                    />
                    <div className="h-7 w-12 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                    <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                  </label>
                </td>
                <td className="py-3 px-4 border-t border-gray-300 text-center">
                  <button
                    onClick={() => navigate(`/Owner/edit-room/${item._id}`)}
                    className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListRoom;
