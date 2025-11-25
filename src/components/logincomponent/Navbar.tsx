import { useState } from "react";

function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Logo */}
          <img
            src="/Digitals45.jpg"
            alt="Digitals Logo"
            className="w-auto object-contain"
            style={{ height: "65px", width: "50px" }}
          />

          {/* Right Logo */}
          <img
            src="/colored-logo.png"
            alt="BOI Logo"
            className=" w-auto object-contain"
            style={{ height: "60px", width: "50px" }}
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
