import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <div className='bg-[#DFE8F2] text-gray-700 pt-8 px-6 md:px-16 lg:px-24 xl:px-32'>
      <div className='flex flex-wrap justify-between gap-12 md:gap-6'>
        
        {/* Left section with logo and social links */}
        <div className='max-w-[300px]'>
          <img src={assets.logo} alt="logo" className='mb-4 h-8 md:h-10' />
          <p className='text-sm text-gray-600'>
            SmartStayX is your premier destination for booking luxury accommodations worldwide. Experience unparalleled comfort, exceptional service, and exclusive deals tailored to discerning travelers.
          </p>
          <div className='flex items-center gap-4 mt-4'>
            {/* Instagram */}
            <img src={assets.instagramIcon} alt="instagram-icon" className='w-6' />
            {/* Facebook */}
            <img src={assets.facebookIcon} alt="facebook-icon" className='w-6' />
            {/* Twitter */}
            <img src={assets.twitterIcon} alt="twitter-icon" className='w-6' />
            {/* LinkedIn */}
            <img src={assets.linkendinIcon} alt="linkedin-icon" className='w-6' />
          </div>
        </div>

        {/* Company Links Section */}
        <div>
          <p className='font-playfair text-lg text-gray-800'>COMPANY</p>
          <ul className='mt-3 flex flex-col gap-2 text-sm text-gray-600'>
            <li><a href="#">About</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Partners</a></li>
          </ul>
        </div>

        {/* Support Links Section */}
        <div>
          <p className='font-playfair text-lg text-gray-800'>SUPPORT</p>
          <ul className='mt-3 flex flex-col gap-2 text-sm text-gray-600'>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Safety Information</a></li>
            <li><a href="#">Cancellation Options</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Accessibility</a></li>
          </ul>
        </div>

        {/* Stay Updated Section */}
        <div className='max-w-[300px]'>
          <p className='font-playfair text-lg text-gray-800'>STAY UPDATED</p>
          <p className='mt-3 text-sm text-gray-600'>
            Subscribe to our newsletter for inspiration and special offers.
          </p>
          <div className='flex items-center mt-4'>
            <input
              type="text"
              className='bg-white rounded-l border border-gray-300 h-9 px-3 outline-none'
              placeholder='Your email'
            />
            <button className='flex items-center justify-center bg-black h-9 w-9 aspect-square rounded-r'>
              {/* Arrow icon */}
              <img src={assets.arrowIcon} alt="arrow-icon" className='w-3.5 invert' />
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className='border-gray-300 mt-8' />

      {/* Bottom Section with Copyright and Links */}
      <div className='flex flex-col md:flex-row gap-2 items-center justify-between py-5'>
        <p className='text-sm text-gray-600'>© {new Date().getFullYear()} SmartStayX. All rights reserved.</p>
        <ul className='flex items-center gap-4 text-sm text-gray-600'>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Sitemap</a></li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
