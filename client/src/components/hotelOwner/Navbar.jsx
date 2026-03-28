import React from 'react'
import{Link} from 'react-router-dom'
import { assets } from '../../assets/assets'
import { UserButton } from '@clerk/clerk-react'


const Navbar = () => {
  return (
    <div className='flex items-center justify-between px-4 md:px-6 border-b border-gray-200 py-2.5 bg-white transition-all duration-300'>
    <Link to='/'>
    <img src={assets.logo} alt="logo" className='h-10 opacity-100' />
    </Link>
    <UserButton/>



    </div>
  )
}

export default Navbar