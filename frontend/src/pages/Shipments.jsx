import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, Activity, CheckCircle, Zap } from 'lucide-react';

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  // Form State
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [urgency, setUrgency] = useState('Medium');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/shipments', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        const data = await res.json();
        setShipments(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (userInfo?.token) {
      fetchShipments();
    }
    
    const socket = io('http://localhost:5000');
    socket.on('shipment-updated', (newShipment) => {
      setShipments((prev) => {
        const exists = prev.find(s => s._id === newShipment._id);
        if (exists) {
          return prev.map(s => s._id === newShipment._id ? newShipment : s);
        } else {
          return [newShipment, ...prev];
        }
      });
    });

    return () => socket.disconnect();
  }, [userInfo]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/shipments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ weight: Number(weight), origin, destination, urgency })
      });
      setShowModal(false);
      setWeight(''); setOrigin(''); setDestination('');
    } catch (err) {
      console.error(err);
    }
  };

  const assignFleet = async (shipment) => {
    try {
      const headers = { Authorization: `Bearer ${userInfo.token}`, 'Content-Type': 'application/json' };
      const recRes = await fetch(`http://localhost:5000/api/shipments/${shipment._id}/recommend-vehicle`, { headers });
      const recData = await recRes.json();
      
      if (recData.recommendation) {
        await fetch(`http://localhost:5000/api/shipments/${shipment._id}/assign`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ vehicleId: recData.recommendation._id })
        });
      } else {
        alert("No suitable vehicles currently available! Please wait.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dispatchNow = async (shipment) => {
    try {
      await fetch(`http://localhost:5000/api/shipments/${shipment._id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userInfo.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Transit' })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: 'Manufacturing Queue', status: 'Ready for Dispatch', icon: Package, color: 'text-yellow-400', border: 'border-yellow-400/50' },
    { title: 'Fleet Allocated', status: 'Vehicle Assigned', icon: Truck, color: 'text-purple-400', border: 'border-purple-400/50' },
    { title: 'Live Transit', status: 'In Transit', icon: Activity, color: 'text-primary', border: 'border-primary/50' },
    { title: 'Delivered', status: 'Delivered', icon: CheckCircle, color: 'text-accent', border: 'border-accent/50' }
  ];

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide">Logistics Workflow</h2>
          <p className="text-slate-400 mt-1">Manage the end-to-end manufacturing pipeline.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(14,165,233,0.4)] flex items-center gap-2"
        >
          <Package size={18} /> New Order
        </button>
      </div>

      {/* Kanban Board Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start mt-6 overflow-x-auto pb-4">
        {columns.map((col, idx) => (
          <div key={idx} className="flex flex-col gap-4 min-w-[300px]">
            {/* Column Header */}
            <div className={`glass-card p-4 border-t-4 ${col.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <col.icon size={20} className={col.color} />
                <h3 className="font-bold text-white tracking-wide">{col.title}</h3>
              </div>
              <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-full font-bold">
                {shipments.filter(s => s.status === col.status).length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-4 min-h-[500px]">
              <AnimatePresence>
                {shipments.filter(s => s.status === col.status).map((shipment) => (
                  <motion.div 
                    key={shipment._id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card p-5 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {shipment.shipmentId}
                      </span>
                      {shipment.urgency === 'Critical' && (
                         <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded animate-pulse">
                           <Zap size={12}/> Critical
                         </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-bold text-white mb-1">
                      {shipment.origin} ➔ {shipment.destination}
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Weight: {shipment.weight} kg
                    </p>

                    {/* Action Area depending on status */}
                    <div className="mt-auto border-t border-slate-700 pt-3 flex justify-end">
                      {col.status === 'Ready for Dispatch' && (
                        <button onClick={() => assignFleet(shipment)} className="text-xs font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white px-3 py-1.5 rounded transition-all w-full">
                          AI Auto-Assign Fleet
                        </button>
                      )}
                      {col.status === 'Vehicle Assigned' && (
                        <button onClick={() => dispatchNow(shipment)} className="text-xs font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded transition-all w-full">
                          Dispatch Now
                        </button>
                      )}
                      {col.status === 'In Transit' && (
                        <Link to="/tracking" state={{ shipment }} className="text-xs font-bold bg-accent/20 text-accent hover:bg-accent hover:text-white px-3 py-1.5 rounded transition-all w-full text-center flex justify-center items-center gap-1">
                          <Activity size={14} /> Track Live
                        </Link>
                      )}
                      {col.status === 'Delivered' && (
                         <span className="text-xs font-bold text-slate-500 flex justify-center w-full">
                           Archived
                         </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 w-full max-w-md border border-primary/30 shadow-[0_0_50px_rgba(14,165,233,0.15)]"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="text-primary"/> New Order
              </h3>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Origin</label>
                    <input required type="text" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full" placeholder="e.g. Bangalore" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Destination</label>
                    <input required type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full" placeholder="e.g. Chennai" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Weight (kg)</label>
                    <input required type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full" placeholder="1000" />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">Urgency</label>
                    <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full cursor-pointer">
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary hover:bg-blue-500 text-white rounded font-bold transition-colors shadow-lg shadow-primary/30">Create Order</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shipments;
