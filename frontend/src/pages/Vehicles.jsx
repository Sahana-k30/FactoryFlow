import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  // Form
  const [registration, setRegistration] = useState('');
  const [type, setType] = useState('Truck');
  const [capacity, setCapacity] = useState('');
  const [efficiency, setEfficiency] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/vehicles', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [userInfo.token]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ registration, type, capacity: Number(capacity), fuelEfficiency: Number(efficiency) })
      });
      setShowModal(false);
      setRegistration(''); setCapacity(''); setEfficiency('');
      fetchVehicles(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white tracking-wide">Smart Vehicle Management</h2>
        <button onClick={() => setShowModal(true)} className="bg-accent hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Add Vehicle
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Vehicle</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Registration (e.g. TRK-9999)</label>
                <input required type="text" value={registration} onChange={e => setRegistration(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white">
                  <option>Truck</option><option>Van</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Capacity (kg)</label>
                <input required type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Fuel Efficiency (km/l)</label>
                <input required type="number" step="0.1" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-accent hover:bg-emerald-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle._id} className="glass-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              vehicle.status === 'Available' ? 'bg-green-500' :
              vehicle.status === 'In Transit' ? 'bg-blue-500' : 'bg-red-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{vehicle.registration}</h3>
                <p className="text-slate-400">{vehicle.type}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold
                ${vehicle.status === 'Available' ? 'bg-green-500/20 text-green-400' :
                vehicle.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}
              `}>
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Capacity</span>
                <span className="text-slate-200 font-medium">{vehicle.capacity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Fuel Efficiency</span>
                <span className="text-slate-200 font-medium">{vehicle.fuelEfficiency} km/l</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Current Utilization</span>
                <span className="text-slate-200">{vehicle.metrics?.utilization || 0}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${vehicle.metrics?.utilization || 0}%` }}></div>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vehicles;
