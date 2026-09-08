import React from 'react';
import { Camera, MessageCircle, AtSign, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <footer className="bg-[#EFE5D3] dark:bg-[#122A32] border-t border-black/[0.08] dark:border-[#1D3842] pt-12 pb-8 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-between gap-12 md:gap-6">
          <div className="max-w-[300px]">
            <img src={assets.logo} alt="logo" className="mb-4 h-8 md:h-10" />
            <p className="text-sm text-slate-500 dark:text-[#8299A0] leading-relaxed">
              SmartStayX is your premier destination for booking luxury accommodations worldwide. Experience unparalleled comfort, exceptional service, and exclusive deals tailored to discerning travelers.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-[#1D3842] bg-black/[0.03] dark:bg-white/5 transition-transform hover:-translate-y-1">
                <Camera className="w-5 h-5 text-slate-600 dark:text-[#9FB2B8]" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-[#1D3842] bg-black/[0.03] dark:bg-white/5 transition-transform hover:-translate-y-1">
                <MessageCircle className="w-5 h-5 text-slate-600 dark:text-[#9FB2B8]" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-[#1D3842] bg-black/[0.03] dark:bg-white/5 transition-transform hover:-translate-y-1">
                <AtSign className="w-5 h-5 text-slate-600 dark:text-[#9FB2B8]" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] dark:border-[#1D3842] bg-black/[0.03] dark:bg-white/5 transition-transform hover:-translate-y-1">
                <Briefcase className="w-5 h-5 text-slate-600 dark:text-[#9FB2B8]" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-space text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-[#6B828A] mb-4">COMPANY</p>
            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-[#8299A0]">
              <li><Link to="/about" className="nav-link">About</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Careers</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Press</a></li>
              <li><Link to="/blog" className="nav-link">Blog</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Partners</a></li>
            </ul>
          </div>

          <div>
            <p className="font-space text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-[#6B828A] mb-4">SUPPORT</p>
            <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-[#8299A0]">
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Help Center</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Safety Information</a></li>
              <li><Link to="/my-bookings" className="nav-link">Cancellation Options</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Contact Us</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Accessibility</a></li>
            </ul>
          </div>

          <div className="max-w-[300px]">
            <p className="font-space text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-[#6B828A] mb-4">STAY UPDATED</p>
            <p className="text-sm text-slate-500 dark:text-[#8299A0] mb-4">
              Subscribe to our newsletter for inspiration and special offers.
            </p>
            <div className="flex items-center">
              <input
                type="email"
                className="luxury-input rounded-r-none h-10 text-sm"
                placeholder="Your email"
              />
              <button className="gold-button h-10 w-10 flex-shrink-0 rounded-l-none p-0">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="luxury-divider mt-12 mb-6" />

        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-[#6B828A]">© {new Date().getFullYear()} SmartStayX. All rights reserved.</p>
          <ul className="flex items-center gap-6 text-xs text-slate-400 dark:text-[#6B828A]">
            <li><a href="#" className="hover:text-slate-500 dark:hover:text-[#8299A0] transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-slate-500 dark:hover:text-[#8299A0] transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-slate-500 dark:hover:text-[#8299A0] transition-colors">Sitemap</a></li>
            <li><a href="#" className="hover:text-slate-500 dark:hover:text-[#8299A0] transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
