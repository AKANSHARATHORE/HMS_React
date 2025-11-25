import React, { useState, useEffect } from "react";
import {
  Phone,
  Headphones,
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  FileText,
} from "lucide-react";

const HelpCenter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const supportCards = [
    {
      icon: Phone,
      title: "Customer Support",
      phone: "+91 8448990237",
      hours: ["Mon–Fri: 8AM–8PM EST", "Sat: 9AM–5PM EST", "Sun: Closed"],
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-purple-50",
    },
    {
      icon: Headphones,
      title: "Technical Support",
      phone: "+91 8448990237",
      hours: ["Available 24/7", "Emergency Support", "Priority Queue"],
      color: "from-green-500 to-teal-600",
      bgColor: "bg-gradient-to-br from-green-50 to-teal-50",
    },
  ];

  const resources = [
    { icon: HelpCircle, label: "FAQs", color: "text-purple-600" },
    { icon: BookOpen, label: "User Manual", color: "text-blue-600" },
    { icon: Video, label: "Tutorials", color: "text-green-600" },
  ];

  const contactMethods = [
    { icon: MessageCircle, label: "Live Chat", color: "text-blue-600" },
    { icon: Mail, label: "Email Support", color: "text-purple-600" },
    { icon: FileText, label: "Submit Ticket", color: "text-green-600" },
  ];

  const handleUserManualDownload = () => {
    const link = document.createElement('a');
    link.href = './User_Manual.pdf';
    link.download = 'User_Manual.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-r from-green-400/15 to-teal-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className={`text-center mb-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="inline-block">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent leading-tight mb-4">
                Need Help?
              </h1>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mb-4"></div>
            </div>
            <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
              We're here to support you every step of the way. Choose your preferred method and get instant assistance.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Contact Methods - Left Column */}
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Get In Touch</h2>
              <div className="space-y-3">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={index}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/20 hover:bg-white/90 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${method.color.includes('blue') ? 'from-blue-500 to-blue-600' : method.color.includes('purple') ? 'from-purple-500 to-purple-600' : 'from-green-500 to-green-600'} shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <Icon className="text-white" size={16} />
                      </div>
                      <span className={`font-medium text-sm ${method.color} group-hover:translate-x-1 transition-transform duration-300`}>
                        {method.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Support Cards - Right Columns */}
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {supportCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`transform transition-all duration-1000 delay-${500 + index * 200} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`${card.bgColor} backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer group ${hoveredCard === index ? 'scale-105 -rotate-1' : 'scale-100 rotate-0'}`}>
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-md group-hover:shadow-lg transition-all duration-300 ${hoveredCard === index ? 'animate-pulse' : ''}`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 ml-3 group-hover:text-gray-900 transition-colors duration-300">
                          {card.title}
                        </h3>
                      </div>
                      
                      <div className={`text-xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent mb-3 ${hoveredCard === index ? 'animate-pulse' : ''}`}>
                        {card.phone}
                      </div>
                      
                      <div className="space-y-1">
                        {card.hours.map((hour, idx) => (
                          <p key={idx} className={`text-sm text-gray-600 ${idx === card.hours.length - 1 && card.title === "Customer Support" ? 'text-gray-400 italic' : ''}`}>
                            {hour}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Resources Card */}
              <div className={`md:col-span-2 transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="bg-gradient-to-br from-slate-50 to-white backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 group">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-md group-hover:shadow-lg transition-all duration-300">
                      <HelpCircle className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 ml-3">Online Resources</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {resources.map((resource, index) => {
                      const Icon = resource.icon;
                      const isUserManual = resource.label === "User Manual";
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 rounded-lg border border-gray-500 bg-white/70 hover:bg-white hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer group/item"
                          onClick={isUserManual ? handleUserManualDownload : undefined}
                        >
                          <Icon className={`${resource.color} group-hover/item:animate-bounce`} size={16} />
                          <span className={`font-medium text-sm ${resource.color} group-hover/item:translate-x-1 transition-transform duration-300`}>
                            {resource.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className={`text-center mt-12 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="inline-block p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group hover:scale-105">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:animate-pulse">
                Still Need Help?
              </h3>
              <p className="text-sm text-blue-100">
                Our support team is standing by to assist you personally
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
