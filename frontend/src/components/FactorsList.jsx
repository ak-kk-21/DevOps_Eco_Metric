import { useState, useEffect } from 'react';
import { getFactors } from '../services/api';
import toast from 'react-hot-toast';
import { Server, MapPin, TrendingUp, TrendingDown } from 'lucide-react';

function FactorsList() {
  const [hardware, setHardware] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await getFactors();
      setHardware(response.data.hardware || []);
      setRegions(response.data.regions || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCarbonBadge = (intensity) => {
    if (intensity < 100) return 'bg-green-100 text-green-800';
    if (intensity < 300) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) return <div className="text-center py-8">Loading carbon factors...</div>;

  const greenestRegion = regions.length > 0 ? regions.reduce((min, r) => 
    r.carbon_intensity < min.carbon_intensity ? r : min, regions[0]) : null;
  const dirtiestRegion = regions.length > 0 ? regions.reduce((max, r) => 
    r.carbon_intensity > max.carbon_intensity ? r : max, regions[0]) : null;

  return (
    <div className="space-y-6">
      {regions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <TrendingDown size={20} />
              <span className="font-semibold">Greenest Region</span>
            </div>
            <p className="text-lg font-bold">{greenestRegion?.name}</p>
            <p className="text-sm">{greenestRegion?.carbon_intensity} gCO₂/kWh</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <TrendingUp size={20} />
              <span className="font-semibold">Dirtiest Region</span>
            </div>
            <p className="text-lg font-bold">{dirtiestRegion?.name}</p>
            <p className="text-sm">{dirtiestRegion?.carbon_intensity} gCO₂/kWh</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-3 flex items-center gap-2">
          <Server size={20} />
          <h2 className="text-xl font-semibold">Hardware TDP Values</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Hardware</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-right">TDP (Watts)</th>
              </tr>
            </thead>
            <tbody>
              {hardware.map((h, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-6 py-3 font-mono">{h.name}</td>
                  <td className="px-6 py-3">{h.description}</td>
                  <td className="px-6 py-3 text-right font-semibold">{h.tdp}W</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-3 flex items-center gap-2">
          <MapPin size={20} />
          <h2 className="text-xl font-semibold">Regional Carbon Intensity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Region Code</th>
                <th className="px-6 py-3 text-left">Location</th>
                <th className="px-6 py-3 text-right">gCO₂/kWh</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-6 py-3 font-mono">{r.name}</td>
                  <td className="px-6 py-3">{r.location}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-sm ${getCarbonBadge(r.carbon_intensity)}`}>
                      {r.carbon_intensity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FactorsList;