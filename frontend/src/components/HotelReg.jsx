// HotelReg — Hotel registration form modal for new property owners
import { useState } from 'react'
import { assets, cities } from '../assets/assets'
import { useAppContext } from '../../src/context/AppContext';
import toast from 'react-hot-toast'

const HotelReg = () => {
  const{setShowHotelReg,axios,getToken,refreshUser,navigate}=useAppContext()

    const[name,setName]=useState("")
    const[address,setAddress]=useState("")
    const[contact,setContact]=useState("")
    const[city,setCity]=useState("")

    // Submit hotel registration form to the API
    const onSubmitHandler =async (event)=>{
      try {
        event.preventDefault();
        const {data} =await axios.post ('/api/hotels/',{name,contact,address,city},{headers: {Authorization : `Bearer ${await getToken()}`}})

        if(data.success){
          toast.success(data.message)
          await refreshUser()
          setShowHotelReg(false)
          navigate('/Owner')
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }

  return (
    <div onClick={()=>setShowHotelReg(false)} className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center justify-center bg-black/20">

      <form onSubmit={onSubmitHandler} onClick={(e)=>e.stopPropagation()} className="flex rounded-2xl md:max-w-4xl max-md:mx-2 overflow-hidden border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
        <img
          src={assets.regImage}
          alt="reg-Image"
          className="w-1/2 object-cover hidden md:block"
        />
        <div className="relative flex flex-col items-center md:w-1/2 p-8 md:p-10">
          <img
            src={assets.closeIcon}
            alt="close-icon"
            className="absolute top-4 right-4 h-4 w-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" onClick={()=>setShowHotelReg(false)}/>
          <p className="text-2xl font-bold text-slate-900 tracking-tight mt-6">Register your Hotel</p>

          <div className='w-full mt-6 space-y-4'>
            <div>
              <label htmlFor='name' className='text-sm font-medium text-slate-600'>Hotel Name</label>
              <input type="text" id='name' onChange={(e)=>setName(e.target.value)} value={name} placeholder="Type here" className="luxury-input text-sm mt-1.5" required/>
            </div>

            <div>
              <label htmlFor='contact' className='text-sm font-medium text-slate-600'>Phone</label>
              <input id='contact' onChange={(e)=>setContact(e.target.value)} value={contact} type="text" placeholder="Type here" className="luxury-input text-sm mt-1.5" required/>
            </div>

            <div>
              <label htmlFor='address' className='text-sm font-medium text-slate-600'>Address</label>
              <input id='address' onChange={(e)=>setAddress(e.target.value)} value={address} type="text" placeholder="Type here" className="luxury-input text-sm mt-1.5" required/>
            </div>

            <div>
              <label htmlFor="city" className='text-sm font-medium text-slate-600'>Destination</label>
              <select onChange={(e)=>setCity(e.target.value)} value={city} id="city" className="luxury-select text-sm mt-1.5 cursor-pointer" required>
                <option value="" className="bg-white">Select Destination</option>
                {cities.map((city)=>(
                    <option key={city} value={city} className="bg-white">{city}</option>
                ))}
              </select>
            </div>
          </div>

          <button className='gold-button w-full px-5 py-2.5 text-sm mt-6'>
            Register Hotel
          </button>
        </div>
      </form>
    </div>
  )
}

export default HotelReg
