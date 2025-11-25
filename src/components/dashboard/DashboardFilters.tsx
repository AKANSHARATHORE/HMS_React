import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from "@/config/api";
import Select from 'react-select';

interface BranchOption {
  label: string;
  value: string;
}

const DashboardFilters = ({ onFilterChange }: {
  onFilterChange?: (filters: { headOffice: string; controllingOffice: string; site: string }) => void;
}) => {
  // Track if Apply button was clicked
  const [applied, setApplied] = useState(false);
  const [displayBranchLabel, setDisplayBranchLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [headOffices, setHeadOffices] = useState<BranchOption[]>([]);
  const [controllingOffices, setControllingOffices] = useState<BranchOption[]>([]);
  const [sites, setSites] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert selected states to option objects (react-select)
  const [selectedHeadOffice, setSelectedHeadOffice] = useState<BranchOption | null>(null);
  const [selectedControllingOffice, setSelectedControllingOffice] = useState<BranchOption | null>(null);
  const [selectedSite, setSelectedSite] = useState<BranchOption | null>(null);

  const branchCode = sessionStorage.getItem('branch') || '';

  // ✅ Store original branch if not already saved
  useEffect(() => {
    const originalBranch = sessionStorage.getItem('originalBranch');
    if (!originalBranch && branchCode) {
      sessionStorage.setItem('originalBranch', branchCode);
    }
  }, [branchCode]);

  // Function to check branch code match and API response
  const checkBranchCode = (dataSplit: string[]) => {
    const localBranchCode = sessionStorage.getItem('branch') || '';
    if (dataSplit[0] === localBranchCode) {
      alert('Branch code matches local storage!');
    } else {
      fetch(`${API_BASE_URL}/getAllChildren?branchCode=${localBranchCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.payload && data.payload.some((item: any) => item.branchCode === localBranchCode)) {
            alert('Matched branch code found in API response!');
          }
        });
    }
  };

  // Track if head office was fetched from getAllChildren
  const [headOfficeFromChildren, setHeadOfficeFromChildren] = useState(false);

  useEffect(() => {
    // Helper to fetch head offices by branch code
    const fetchHeadOffices = (code: string) => {
      fetch(`${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.payload) {
            const items = Array.isArray(data.payload) ? data.payload : [data.payload];
            const options = items.map((item: any) => ({
              label: item.branchDesc,
              value: item.branchCode,
            }));
            setHeadOffices(options);
            setHeadOfficeFromChildren(false);
            // clear selectedHeadOffice when fresh headOffices are loaded
            setSelectedHeadOffice(null);
          } else {
            // If no payload, try to get parentCode from getAllChildren
            fetch(`${API_BASE_URL}/getAllChildren?branchCode=${code}`)
              .then(res => res.json())
              .then(childData => {
                if (
                  childData.payload &&
                  Array.isArray(childData.payload) &&
                  childData.payload.length > 0 &&
                  childData.payload[0].parentCode
                ) {
                  const parentCode = childData.payload[0].parentCode;
                  if (parentCode) {
                    fetch(`${API_BASE_URL}/getHeadOfficeByBranchCode?branchCode=${parentCode}`)
                      .then(res => res.json())
                      .then(parentData => {
                        if (parentData.payload) {
                          const items = Array.isArray(parentData.payload) ? parentData.payload : [parentData.payload];
                          const options = items.map((item: any) => ({
                            label: item.branchDesc,
                            value: item.branchCode,
                          }));
                          setHeadOffices(options);
                          setHeadOfficeFromChildren(true);
                          // select parentCode by default if present in options
                          const match = options.find(o => o.value === parentCode) || null;
                          setSelectedHeadOffice(match);
                        } else {
                          setHeadOffices([]);
                          setHeadOfficeFromChildren(false);
                          setSelectedHeadOffice(null);
                        }
                      })
                      .catch(() => {
                        setHeadOffices([]);
                        setHeadOfficeFromChildren(false);
                        setSelectedHeadOffice(null);
                      });
                  } else {
                    setHeadOffices([]);
                    setHeadOfficeFromChildren(false);
                    setSelectedHeadOffice(null);
                  }
                } else {
                  setHeadOffices([]);
                  setHeadOfficeFromChildren(false);
                  setSelectedHeadOffice(null);
                }
              })
              .catch(() => {
                setHeadOffices([]);
                setHeadOfficeFromChildren(false);
                setSelectedHeadOffice(null);
              });
          }
        })
        .catch(() => {
          setHeadOffices([]);
          setHeadOfficeFromChildren(false);
          setSelectedHeadOffice(null);
        });
    };

    if (branchCode) {
      fetchHeadOffices(branchCode);
    } else {
      setHeadOffices([]);
      setHeadOfficeFromChildren(false);
    }
  }, [branchCode]);
  
  useEffect(() => {
    // Use selectedHeadOffice.value if available, otherwise use logged-in branchCode
    const branchForControllingOffice = selectedHeadOffice?.value || branchCode;
    if (branchForControllingOffice) {
      fetch(`${API_BASE_URL}/getAllZonesByBranchCode?branchCode=${branchForControllingOffice}`)
        .then(res => res.json())
        .then(data => {
          if (data.payload) {
            let options = data.payload.map((item: any) => ({
              label: item.branchDesc,
              value: item.branchCode,
            }));
            // If head office is not selected, filter to only show logged-in branchCode
            if (!selectedHeadOffice) {
              options = options.filter(opt => opt.value === branchCode);
            }
            // If head office was fetched from getAllChildren and multiple controlling offices, filter to logged-in branch
            if (headOfficeFromChildren && options.length > 1) {
              options = options.filter(opt => opt.value === branchCode);
            }
            setControllingOffices(options);
          } else {
            setControllingOffices([]);
          }
          setSelectedControllingOffice(null);
          setSites([]);
          setSelectedSite(null);
        });
    } else {
      setControllingOffices([]);
      setSites([]);
      setSelectedControllingOffice(null);
      setSelectedSite(null);
    }
  }, [selectedHeadOffice, branchCode, headOfficeFromChildren]);

  useEffect(() => {
    if (selectedControllingOffice) {
      fetch(`${API_BASE_URL}/getAllBranchesAndDevicesbyBranchCode?branchCode=${selectedControllingOffice.value}`)
        .then(res => res.json())
        .then(data => {
          if (data.payload) {
            const options = data.payload.map((item: any) => ({
              label: item.branchName,
              value: item.branchCode,
            }));
            setSites(options);
          } else {
            setSites([]);
          }
          setSelectedSite(null);
        });
    } else {
      setSites([]);
      setSelectedSite(null);
    }
  }, [selectedControllingOffice]);

  const handleApply = () => {
    setShowFilters(false);
    setApplied(true);
    let newBranchCode = '';
    let branchLabel = '';
    if (selectedSite) {
      newBranchCode = selectedSite.value;
      branchLabel = selectedSite.label;
    } else if (selectedControllingOffice) {
      newBranchCode = selectedControllingOffice.value;
      branchLabel = selectedControllingOffice.label;
    } else if (selectedHeadOffice) {
      newBranchCode = selectedHeadOffice.value;
      branchLabel = selectedHeadOffice.label;
    }
    if (newBranchCode) {
      setLoading(true);
      setTimeout(() => {
        sessionStorage.setItem('branch', newBranchCode);
        sessionStorage.setItem('lastAppliedBranchLabel', branchLabel);
        window.location.reload();
      }, 500);
    } else {
      alert('Please select at least one filter before applying.');
    }
    setDisplayBranchLabel(branchLabel);
    onFilterChange?.({
      headOffice: selectedHeadOffice?.value || '',
      controllingOffice: selectedControllingOffice?.value || '',
      site: selectedSite?.value || ''
    });
  };

  const handleReset = () => {
    setSelectedHeadOffice(null);
    setSelectedControllingOffice(null);
    setSelectedSite(null);
    setControllingOffices([]);
    setSites([]);
    setLoading(true);

    const originalBranchCode = sessionStorage.getItem('originalBranch') || '';
    setTimeout(() => {
      sessionStorage.setItem('branch', originalBranchCode);
      window.location.reload();
    }, 500);

    sessionStorage.removeItem('lastAppliedBranchLabel');

    onFilterChange?.({ headOffice: '', controllingOffice: '', site: '' });
  };

  useEffect(() => {
    // On mount, check if last applied branch label exists in sessionStorage
    const lastBranchLabel = sessionStorage.getItem('lastAppliedBranchLabel') || '';
    if (lastBranchLabel) {
      setApplied(true);
      setDisplayBranchLabel(lastBranchLabel);
    }
  }, []);

  return (
    <div>
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-blue-700 font-semibold">Loading...</span>
          </div>
        </div>
      )}
      <div className="flex justify-end items-center gap-3 min-h-[36px]">
         {applied && displayBranchLabel && (
          <span className="flex items-center mb-2 px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-semibold border border-blue-200 h-[36px]">Now Showing : {displayBranchLabel}</span>
        )}
        <button
          className="flex items-center gap-1 mb-2 px-3 py-1 rounded bg-white text-gray-700 hover:bg-blue-100 transition-all border border-gray-300 shadow-sm text-xs md:text-sm font-semibold h-[36px]"
          onClick={() => setShowFilters(v => !v)}
        >
          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 009 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z" />
          </svg>
          <span>Filter</span>
        </button>
      </div>
      {showFilters && (
        <div className="bg-white rounded-md border border-gray-200 mb-2">
          <div className="p-2 bg-gray-600 text-white font-medium flex items-center justify-between">
            <span>View Branch Wise Info</span>
          </div>
          <div className="flex flex-row flex-wrap gap-4 items-end bg-white rounded-md p-4 shadow-inner">
            {/* Head Office - react-select */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Head Office</label>
              <Select<BranchOption>
                options={headOffices}
                value={selectedHeadOffice}
                onChange={(opt) => setSelectedHeadOffice(opt)}
                isDisabled={headOffices.length === 0}
                placeholder="All Head Offices"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
              />
            </div>

            {/* Controlling Office - react-select */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Controlling Office</label>
              <Select<BranchOption>
                options={controllingOffices}
                value={selectedControllingOffice}
                onChange={(opt) => setSelectedControllingOffice(opt)}
                isDisabled={controllingOffices.length === 0 || !selectedHeadOffice}
                placeholder="All Controlling Offices"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
              />
            </div>

            {/* Site - react-select */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm mb-1 font-semibold text-blue-900">Site</label>
              <Select<BranchOption>
                options={sites}
                value={selectedSite}
                onChange={(opt) => setSelectedSite(opt)}
                isDisabled={sites.length === 0 || !selectedControllingOffice}
                placeholder="All Sites"
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
              />
            </div>

            <div className="flex-1 flex justify-end items-end min-w-[150px]">
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-2 py-1 rounded text-sm font-semibold shadow transition"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded text-sm font-semibold shadow transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;
