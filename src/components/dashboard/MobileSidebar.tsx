import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import { ArrowLeft, X } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MobileSidebar = ({ isOpen, setIsOpen }: MobileSidebarProps) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-50 flex lg:hidden transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" onClick={() => setIsOpen(false)} />
      <div className={`relative w-64 max-w-[80%] bg-white h-full shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button className="absolute top-5 right-3 text-white hover:text-red-500 z-50" onClick={() => setIsOpen(false)}>
          <ArrowLeft size={22} />
        </button>
        <Sidebar collapsed={false} onLinkClick={() => setIsOpen(false)} />
      </div>
    </div>
  );
};

export default MobileSidebar;
