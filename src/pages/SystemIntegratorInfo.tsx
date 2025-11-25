import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, ServerCog } from "lucide-react";

const SystemIntegratorInfo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-r from-green-400/15 to-teal-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div
            className={`text-center mb-12 transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="inline-block">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gray-700 to-gray-900 bg-clip-text text-transparent leading-normal mb-3">
                System Integrator Information
              </h1>
              <div className="h-1 w-24 bg-gradient-to-br from-gray-700 to-gray-900 mx-auto rounded-full mb-4"></div>
            </div>
          </div>

          {/* Cards */}
          <div className="flex flex-wrap justify-between gap-y-10 gap-x-6">
            {/* Card 1 */}
            <Link to="/makeandmodel" className="w-full md:w-[47%]">
              <div
                className={`transform transition-all duration-1000 delay-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                onMouseEnter={() => setHoveredCard(0)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group ${
                    hoveredCard === 0 ? "scale-105 -rotate-0" : "scale-100 rotate-0"
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-md group-hover:shadow-lg transition-all duration-300 ${
                        hoveredCard === 0 ? "animate-pulse" : ""
                      }`}
                    >
                      <PackageCheck className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 ml-3 group-hover:text-gray-900 transition-colors duration-300">
                      Make & Model Details
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Make and Model Information</p>
                    <p className="text-sm text-gray-600">
                      This section outlines the manufacturer (make) and specific model information of each component.
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 2 */}
            <div className="w-full md:w-[47%]">
              <Link to="/qualitycheckdetails" className="w-full md:w-[47%]">
              <div
                className={`transform transition-all duration-1000 delay-700 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`bg-gradient-to-br from-green-50 to-teal-50 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group ${
                    hoveredCard === 1 ? "scale-105 -rotate-0" : "scale-100 rotate-0"
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 shadow-md group-hover:shadow-lg transition-all duration-300 ${
                        hoveredCard === 1 ? "animate-pulse" : ""
                      }`}
                    >
                      <ServerCog className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 ml-3 group-hover:text-gray-900 transition-colors duration-300">
                      Quality Check Details
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Quality Check Information</p>
                    <p className="text-sm text-gray-600">
                      This section provides detailed information about the devices used in the system, including their specifications and configurations.
                    </p>
                  </div>
                </div>
              </div>
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SystemIntegratorInfo;
