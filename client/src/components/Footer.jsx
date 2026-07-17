import React from 'react';
import { Camera, MessageCircle, AtSign, Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <footer className="bg-[#07111f] border-t border-white/8 pt-12 pb-8 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-between gap-12 md:gap-6">
          <div className="max-w-[300px]">
            <img src={assets.logo} alt="logo" className="mb-4 h-8 md:h-10" />
            <p className="text-sm text-white/55 leading-relaxed">
              SmartStayX is your premier destination for booking luxury accommodations worldwide. Experience unparalleled comfort, exceptional service, and exclusive deals tailored to discerning travelers.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform hover:-translate-y-1">
                <Camera className="w-5 h-5 text-white/70" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform hover:-translate-y-1">
                <MessageCircle className="w-5 h-5 text-white/70" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform hover:-translate-y-1">
                <AtSign className="w-5 h-5 text-white/70" />
              </a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl transition-transform hover:-translate-y-1">
                <Briefcase className="w-5 h-5 text-white/70" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-space text-xs uppercase tracking-[0.28em] text-white/50 mb-4">COMPANY</p>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><Link to="/about" className="nav-link">About</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Careers</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Press</a></li>
              <li><Link to="/blog" className="nav-link">Blog</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Partners</a></li>
            </ul>
          </div>

          <div>
            <p className="font-space text-xs uppercase tracking-[0.28em] text-white/50 mb-4">SUPPORT</p>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Help Center</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Safety Information</a></li>
              <li><Link to="/my-bookings" className="nav-link">Cancellation Options</Link></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Contact Us</a></li>
              <li><a href="#" className="nav-link opacity-50 cursor-not-allowed">Accessibility</a></li>
            </ul>
          </div>

          <div className="max-w-[300px]">
            <p className="font-space text-xs uppercase tracking-[0.28em] text-white/50 mb-4">STAY UPDATED</p>
            <p className="text-sm text-white/55 mb-4">
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
          <p className="text-xs text-white/40">© {new Date().getFullYear()} SmartStayX. All rights reserved.</p>
          <ul className="flex items-center gap-6 text-xs text-white/40">
            <li><a href="#" className="hover:text-white/60 transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-white/60 transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-white/60 transition-colors">Sitemap</a></li>
            <li><a href="#" className="hover:text-white/60 transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
