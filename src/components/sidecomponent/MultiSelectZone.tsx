import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

export interface MultiSelectZoneProps {
  selectedZones: string[];
  onZoneChange: (zones: string[]) => void;
  disabledZones?: string[];
}

const MultiSelectZone: React.FC<MultiSelectZoneProps> = ({
  selectedZones,
  onZoneChange,
  disabledZones = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDirection, setOpenDirection] = useState<'down' | 'up'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allZones = Array.from({ length: 40 }, (_, i) => `ZONE${i + 1}`);

  const filteredZones = allZones.filter((zone) =>
    zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300;

      if (spaceBelow < dropdownHeight) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }

      dropdownRef.current.scrollIntoView({
        behavior: 'smooth',
        block: spaceBelow < dropdownHeight ? 'end' : 'start',
        inline: 'nearest'
      });
    }
  }, [isOpen]);

  const toggleZone = (zone: string) => {
    const newZones = selectedZones.includes(zone)
      ? selectedZones.filter((z) => z !== zone)
      : [...selectedZones, zone];
    onZoneChange(newZones);
  };

  const getDisplayText = () => {
    if (selectedZones.length === 0) return 'Select Zone';
    if (selectedZones.length === 1) return selectedZones[0];
    return selectedZones.join(', ');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
        variant="outline"
      >
        <span className="truncate text-left flex-1">{getDisplayText()}</span>
        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
      </Button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 ${
            openDirection === 'down' ? 'top-full mt-1' : 'bottom-full mb-1'
          } bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden`}
        >
          <div className="p-2 border-b border-gray-200">
            <Input
              type="text"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm"
            />
          </div>

          <div className="max-h-48 overflow-y-auto mb-3">
            {filteredZones.map((zone) => {
              const isDisabled = disabledZones.includes(zone) && !selectedZones.includes(zone);
              return (
                <label
                  key={zone}
                  className={`flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedZones.includes(zone)}
                    onChange={() => !isDisabled && toggleZone(zone)}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isDisabled}
                  />
                  <span className="text-sm text-gray-700">{zone}</span>
                </label>
              );
            })}

            {filteredZones.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No zones found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectZone;
