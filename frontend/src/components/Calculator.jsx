import { useState, useEffect } from 'react';
import { calculateTask, getFactors } from '../services/api';
import toast from 'react-hot-toast';
import { Leaf, AlertCircle } from 'lucide-react';

function Calculator() {
  const [formData, setFormData] = useState({
    hardware: 'A100',
    hours: 1,
    region: 'us-east-1',
    utilization: 0.8,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hardwareList, setHardwareList] = useState([]);
  const [regionList, setRegionList] = useState([]);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      const response = await getFactors();
      setHardwareList(response.data.hardware || []);
      setRegionList(response.data.regions || []);
    } catch (error) {
      toast.error('Failed to load factors. Is backend running?');
      console.error('Error loading factors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await calculateTask(formData);
      setResult(response.data);
      toast.success('Calculation complete!');
    } catch (error) {
      toast.error('Failed to calculate. Check your inputs.');
      console.error('Error calculating:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCarbonColor = (co2grams) => {
    if (co2grams < 100) return 'text-green-600';
    if (co2grams < 500) return 'text-yellow-600';
    if (co2grams < 1000) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Leaf className="text-green-600" />
          Calculate Carbon Footprint
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hardware</label>
              <select
                value={formData.hardware}
                onChange={(e) => setFormData({...formData, hardware: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {hardwareList.map((h) => (
                  <option key={h.name} value={h.name}>{h.name} - {h.tdp}W</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cloud Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {regionList.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} - {r.carbon_intensity} gCO₂/kWh
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Utilization (0-1)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formData.utilization}
                onChange={(e) => setFormData({...formData, utilization: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div className="text-sm text-gray-600 mt-1">{Math.round(formData.utilization * 100)}%</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Calculating...' : 'Calculate CO₂ Emissions'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Results</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Hardware:</span>
              <span className="font-semibold">{result.hardware_description}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Region:</span>
              <span className="font-semibold">{result.region_name}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Duration:</span>
              <span className="font-semibold">{result.hours} hours</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Energy Used:</span>
              <span className="font-semibold">{result.energy_kwh?.toFixed(2)} kWh</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-lg font-bold">CO₂ Emissions:</span>
              <span className={`text-2xl font-bold ${getCarbonColor(result.co2_grams)}`}>
                {result.co2_grams?.toFixed(1)} grams
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mt-2">
              <div className="flex items-center gap-2 text-gray-700">
                <AlertCircle size={18} />
                <span>{result.equivalent_to}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;