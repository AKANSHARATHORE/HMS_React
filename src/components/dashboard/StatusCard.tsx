import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | React.ReactNode;
  color: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, color, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className="group relative overflow-hidden h-24"
    >
      {/* Animated bubble background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {/* Large floating bubbles */}
        <div 
          className="absolute -top-4 -right-4 w-16 h-16 rounded-full animate-float-slow opacity-30"
          style={{ backgroundColor: color }}
        />
        <div 
          className="absolute top-1/2 -right-2 w-8 h-8 rounded-full animate-float-medium opacity-40"
          style={{ backgroundColor: color, animationDelay: '1s' }}
        />
        <div 
          className="absolute bottom-2 right-8 w-12 h-12 rounded-full animate-float-fast opacity-25"
          style={{ backgroundColor: color, animationDelay: '2s' }}
        />
        <div 
          className="absolute top-3 right-12 w-4 h-4 rounded-full animate-float-medium opacity-50"
          style={{ backgroundColor: color, animationDelay: '0.5s' }}
        />
        <div 
          className="absolute bottom-8 right-16 w-6 h-6 rounded-full animate-float-slow opacity-35"
          style={{ backgroundColor: color, animationDelay: '1.5s' }}
        />
        {/* Small bubbles */}
        <div 
          className="absolute top-6 right-20 w-2 h-2 rounded-full animate-bubble-rise opacity-60"
          style={{ backgroundColor: color, animationDelay: '3s' }}
        />
        <div 
          className="absolute top-12 right-6 w-3 h-3 rounded-full animate-bubble-rise opacity-45"
          style={{ backgroundColor: color, animationDelay: '4s' }}
        />
      </div>

      {/* Main card */}
      <div className="relative h-full backdrop-blur-sm bg-white/80  border border-white/40 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out overflow-hidden">
        
        {/* Background bubble animation inside main card */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute left-4 top-4 w-16 h-16 rounded-full opacity-20 animate-float-slow"
            style={{ backgroundColor: color }}
          />
          <div 
            className="absolute right-8 top-10 w-10 h-10 rounded-full opacity-15 animate-float-medium"
            style={{ backgroundColor: color, animationDelay: '1.2s' }}
          />
          
          
        </div>

        {/* Background gradient animation */}
       
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* Content */}
        <div className="relative h-full p-4 flex items-center justify-between">
          
          {/* Icon - Similar to your reference */}
          <div className="flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-3 group-hover:scale-110 transition-all duration-300 ease-out relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              }}
            >
              {/* Icon shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex flex-col h-full justify-center">
              <h3 className="text-sm text-gray-600 font-bold mb-1 truncate group-hover:text-gray-700 transition-colors duration-200">
                {title}
              </h3>
              <div className="text-lg font-bold text-gray-800 truncate group-hover:scale-105 transition-transform duration-200 origin-left">
                <span style={{ color }}>{value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{ backgroundColor: color }}
        />
        
        {/* Floating dots animation */}
        <div className="absolute top-1 right-1 w-1 h-1 rounded-full opacity-40 animate-pulse" style={{ backgroundColor: color }} />
        <div className="absolute top-3 right-3 w-0.5 h-0.5 rounded-full opacity-60 animate-ping" style={{ backgroundColor: color, animationDelay: '0.5s' }} />
      </div>

    
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-10px) translateX(-5px);
          }
          66% {
            transform: translateY(-5px) translateX(5px);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) translateX(-10px) scale(1.1);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-8px) translateX(8px);
          }
          50% {
            transform: translateY(-12px) translateX(-3px);
          }
          75% {
            transform: translateY(-6px) translateX(-8px);
          }
        }

        @keyframes bubble-rise {
          0% {
            transform: translateY(0px) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(0.6);
            opacity: 0.2;
          }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 3s ease-in-out infinite;
        }

        .animate-bubble-rise {
          animation: bubble-rise 8s ease-in-out infinite;
        }
        
        .group:active::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${color}40;
          transform: translate(-50%, -50%);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};


const SIAStatusCard: React.FC<StatusCardProps> = ({ title, value, color, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      title={title}
      className="group relative overflow-hidden cursor-pointer h-24"
    >
      {/* Animated bubble background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {/* Large floating bubbles */}
        <div 
          className="absolute -top-4 -right-4 w-16 h-16 rounded-full animate-float-slow opacity-30"
          style={{ backgroundColor: color }}
        />
        <div 
          className="absolute top-1/2 -right-2 w-8 h-8 rounded-full animate-float-medium opacity-40"
          style={{ backgroundColor: color, animationDelay: '1s' }}
        />
        <div 
          className="absolute bottom-2 right-8 w-12 h-12 rounded-full animate-float-fast opacity-25"
          style={{ backgroundColor: color, animationDelay: '2s' }}
        />
        <div 
          className="absolute top-3 right-12 w-4 h-4 rounded-full animate-float-medium opacity-50"
          style={{ backgroundColor: color, animationDelay: '0.5s' }}
        />
        <div 
          className="absolute bottom-8 right-16 w-6 h-6 rounded-full animate-float-slow opacity-35"
          style={{ backgroundColor: color, animationDelay: '1.5s' }}
        />
        {/* Small bubbles */}
        <div 
          className="absolute top-6 right-20 w-2 h-2 rounded-full animate-bubble-rise opacity-60"
          style={{ backgroundColor: color, animationDelay: '3s' }}
        />
        <div 
          className="absolute top-12 right-6 w-3 h-3 rounded-full animate-bubble-rise opacity-45"
          style={{ backgroundColor: color, animationDelay: '4s' }}
        />
      </div>

      {/* Main card */}
      <div className="relative h-full backdrop-blur-sm bg-white/80  border border-white/40 shadow-md hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 ease-out overflow-hidden">
        
        {/* Background bubble animation inside main card */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute left-4 top-4 w-16 h-16 rounded-full opacity-20 animate-float-slow"
            style={{ backgroundColor: color }}
          />
          <div 
            className="absolute right-8 top-10 w-10 h-10 rounded-full opacity-15 animate-float-medium"
            style={{ backgroundColor: color, animationDelay: '1.2s' }}
          />
          
          
        </div>

        {/* Background gradient animation */}
       
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* Content */}
        <div className="relative h-full p-4 flex items-center justify-between">
          
          {/* Icon - Similar to your reference */}
          <div className="flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:rotate-3 group-hover:scale-110 transition-all duration-300 ease-out relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              }}
            >
              {/* Icon shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Text content */}
          <div className="flex-1 ml-4 min-w-0">
            <div className="flex flex-col h-full justify-center">
              <h3 className="text-sm text-gray-600 font-bold mb-1 truncate group-hover:text-gray-700 transition-colors duration-200">
                {title}
              </h3>
              <div className="text-lg font-bold text-gray-800 truncate group-hover:scale-105 transition-transform duration-200 origin-left">
                <span style={{ color }}>{value}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{ backgroundColor: color }}
        />
        
        {/* Floating dots animation */}
        <div className="absolute top-1 right-1 w-1 h-1 rounded-full opacity-40 animate-pulse" style={{ backgroundColor: color }} />
        <div className="absolute top-3 right-3 w-0.5 h-0.5 rounded-full opacity-60 animate-ping" style={{ backgroundColor: color, animationDelay: '0.5s' }} />
      </div>

    
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-10px) translateX(-5px);
          }
          66% {
            transform: translateY(-5px) translateX(5px);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          50% {
            transform: translateY(-15px) translateX(-10px) scale(1.1);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-8px) translateX(8px);
          }
          50% {
            transform: translateY(-12px) translateX(-3px);
          }
          75% {
            transform: translateY(-6px) translateX(-8px);
          }
        }

        @keyframes bubble-rise {
          0% {
            transform: translateY(0px) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-40px) scale(0.6);
            opacity: 0.2;
          }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 3s ease-in-out infinite;
        }

        .animate-bubble-rise {
          animation: bubble-rise 8s ease-in-out infinite;
        }
        
        .group:active::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${color}40;
          transform: translate(-50%, -50%);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default StatusCard;
export { SIAStatusCard };

