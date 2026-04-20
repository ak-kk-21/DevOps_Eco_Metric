import { useState, useEffect } from 'react';

function App() {
  const [formData, setFormData] = useState({
    hardware: '',
    hours: 1,
    region: '',
    utilization: 0.8,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hardwareList, setHardwareList] = useState([]);
  const [regionList, setRegionList] = useState([]);
  const [backendError, setBackendError] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Load factors when app starts
  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    try {
      console.log('Fetching factors from backend...');
      const response = await fetch('http://localhost:8001/factors');
      const data = await response.json();
      
      // Convert hardware object to array - keep the name as the key
      let hardware = [];
      if (data.hardware && typeof data.hardware === 'object') {
        hardware = Object.keys(data.hardware).map(key => ({
          name: key,  // This is the hardware code (e.g., "A100")
          ...data.hardware[key]
        }));
      }
      
      // Convert regions object to array - keep the name as the region code
      let regions = [];
      if (data.regions && typeof data.regions === 'object') {
        regions = Object.keys(data.regions).map(key => ({
          code: key,  // This is the region code (e.g., "us-east-1")
          ...data.regions[key]
        }));
      }
      
      console.log('Hardware list:', hardware);
      console.log('Regions list:', regions);
      
      setHardwareList(hardware);
      setRegionList(regions);
      
      // Set default selections
      if (hardware.length > 0 && !formData.hardware) {
        setFormData(prev => ({ ...prev, hardware: hardware[0].name }));
      }
      if (regions.length > 0 && !formData.region) {
        setFormData(prev => ({ ...prev, region: regions[0].code }));
      }
      
      setBackendError(false);
    } catch (error) {
      console.error('Error fetching factors:', error);
      setBackendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage('');
    
    try {
      const payload = {
        hardware: formData.hardware,
        hours: parseFloat(formData.hours),
        region: formData.region,  // This is now the region code (e.g., "us-east-1")
        utilization: parseFloat(formData.utilization),
      };
      
      console.log('Sending calculation request:', payload);
      
      const response = await fetch('http://localhost:8001/calculate/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Calculation result:', data);
      setResult(data);
    } catch (error) {
      console.error('Calculation error:', error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHardwareChange = (e) => {
    setFormData(prev => ({ ...prev, hardware: e.target.value }));
  };

  const handleRegionChange = (e) => {
    setFormData(prev => ({ ...prev, region: e.target.value }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const getCarbonColor = (co2grams) => {
    if (co2grams < 100) return '#10b981';
    if (co2grams < 500) return '#eab308';
    if (co2grams < 1000) return '#f97316';
    return '#ef4444';
  };

  const getCarbonEmoji = (co2grams) => {
    if (co2grams < 100) return '🌱';
    if (co2grams < 500) return '⚠️';
    if (co2grams < 1000) return '⚡';
    return '🔥';
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌱</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Eco-Metric</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Loading carbon footprint calculator...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Main Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '20px 32px',
          marginBottom: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                fontSize: '40px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>🌱</div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>Eco-Metric</h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Carbon Footprint Estimator for Cloud Computing</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setActiveTab('calculator')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: activeTab === 'calculator' ? '#10b981' : 'transparent',
                  color: activeTab === 'calculator' ? 'white' : '#374151',
                  border: activeTab === 'calculator' ? 'none' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                📊 Calculator
              </button>
              <button
                onClick={() => setActiveTab('factors')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  backgroundColor: activeTab === 'factors' ? '#10b981' : 'transparent',
                  color: activeTab === 'factors' ? 'white' : '#374151',
                  border: activeTab === 'factors' ? 'none' : '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                📋 Carbon Factors
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            <strong>❌ Error:</strong> {errorMessage}
          </div>
        )}

        {backendError && (
          <div style={{ 
            backgroundColor: '#fef3c7', 
            color: '#92400e', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            border: '1px solid #fde68a'
          }}>
            ⚠️ Cannot connect to backend. Make sure it's running on http://localhost:8001
          </div>
        )}

        {activeTab === 'calculator' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Calculator Form */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                Calculate Carbon Footprint
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="hardware" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    🖥️ Hardware
                  </label>
                  <select
                    id="hardware"
                    name="hardware"
                    value={formData.hardware}
                    onChange={handleHardwareChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      fontSize: '14px',
                      transition: 'border-color 0.3s'
                    }}
                    required
                  >
                    <option value="">Select hardware...</option>
                    {hardwareList.map((h) => (
                      <option key={h.name} value={h.name}>
                        {h.name} - {h.tdp}W ({h.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="region" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    🌍 Cloud Region
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleRegionChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      fontSize: '14px'
                    }}
                    required
                  >
                    <option value="">Select region...</option>
                    {regionList.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} - {r.location} ({r.carbon_intensity} gCO₂/kWh)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="hours" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    ⏱️ Hours
                  </label>
                  <input
                    id="hours"
                    name="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours}
                    onChange={handleInputChange}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="utilization" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                    📊 Utilization: {Math.round(formData.utilization * 100)}%
                  </label>
                  <input
                    id="utilization"
                    name="utilization"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.utilization}
                    onChange={handleInputChange}
                    style={{ width: '100%' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <span>Idle (0%)</span>
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                    <span>Max (100%)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.hardware || !formData.region}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: (loading || !formData.hardware || !formData.region) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !formData.hardware || !formData.region) ? 0.5 : 1,
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'transform 0.2s'
                  }}
                >
                  {loading ? 'Calculating...' : 'Calculate CO₂ Emissions →'}
                </button>
              </form>
            </div>

            {/* Results Panel */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                Results
              </h2>
              
              {!result ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <p>Enter your workload details and click calculate to see the carbon footprint</p>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '24px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>{getCarbonEmoji(result.co2_grams)}</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: getCarbonColor(result.co2_grams) }}>
                      {result.co2_grams?.toFixed(1)} grams
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                      CO₂ equivalent emissions
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      <span style={{ color: '#6b7280' }}>Hardware:</span>
                      <span style={{ fontWeight: '600' }}>{result.hardware_description}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      <span style={{ color: '#6b7280' }}>Region:</span>
                      <span style={{ fontWeight: '600' }}>{result.region_name}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      <span style={{ color: '#6b7280' }}>Duration:</span>
                      <span style={{ fontWeight: '600' }}>{result.hours} hours</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      paddingBottom: '12px', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      <span style={{ color: '#6b7280' }}>Energy Used:</span>
                      <span style={{ fontWeight: '600' }}>{result.energy_kwh?.toFixed(3)} kWh</span>
                    </div>
                    <div style={{ 
                      backgroundColor: '#f0fdf4', 
                      padding: '16px', 
                      borderRadius: '12px', 
                      marginTop: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#166534' }}>
                        <span style={{ fontSize: '20px' }}>💡</span>
                        <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{result.equivalent_to}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'factors' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Hardware Table */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
                🖥️ Hardware TDP Values
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Hardware</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>TDP (Watts)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hardwareList.map((h, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '500' }}>{h.name}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{h.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>{h.tdp}W</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regions Table */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
                🌍 Regional Carbon Intensity
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Region Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Location</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>gCO₂/kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionList.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: '500' }}>{r.code}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{r.location}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '500',
                            backgroundColor: r.carbon_intensity < 100 ? '#d1fae5' : r.carbon_intensity < 300 ? '#fef3c7' : '#fee2e2',
                            color: r.carbon_intensity < 100 ? '#065f46' : r.carbon_intensity < 300 ? '#92400e' : '#991b1b'
                          }}>
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
        )}
      </div>
    </div>
  );
}

export default App;