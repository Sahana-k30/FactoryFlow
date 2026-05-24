import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Package, Activity, Truck, AlertTriangle } from 'lucide-react';

const dummyUtilizationData = [
  { name: 'Mon', utilization: 65 },
  { name: 'Tue', utilization: 72 },
  { name: 'Wed', utilization: 85 },
  { name: 'Thu', utilization: 78 },
  { name: 'Fri', utilization: 90 },
  { name: 'Sat', utilization: 45 },
  { name: 'Sun', utilization: 30 },
];

const dummyCarbonData = [
  { name: 'W1', emissions: 400 },
  { name: 'W2', emissions: 300 },
  { name: 'W3', emissions: 200 },
  { name: 'W4', emissions: 278 },
];

const MotionCard = motion.div;

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    activeShipments: 0,
    fleetUtilization: 0,
    loadingQueue: 0,
    openIncidents: 2 
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${userInfo.token}` };
        const [shipmentsRes, vehiclesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/shipments`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/vehicles`, { headers })
        ]);
        
        const shipments = await shipmentsRes.json();
        const vehicles = await vehiclesRes.json();

        const activeShipments = Array.isArray(shipments) ? shipments.filter(s => s.status !== 'Delivered').length : 0;
        const loadingQueue = Array.isArray(shipments) ? shipments.filter(s => s.status === 'Ready for Dispatch').length : 0;
        
        let utilization = 0;
        if (Array.isArray(vehicles) && vehicles.length > 0) {
          const inTransit = vehicles.filter(v => v.status === 'In Transit').length;
          utilization = Math.round((inTransit / vehicles.length) * 100);
        }

        setStats({
          activeShipments,
          fleetUtilization: utilization,
          loadingQueue,
          openIncidents: 2 
        });
      } catch(err) {
         console.error("Dashboard fetch error:", err);
      }
    };
    if (userInfo?.token) {
      fetchData();
    }
  }, [userInfo]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div className="space-y-8 pb-10" variants={containerVariants} initial="hidden" animate="show">
      
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-3">
            <Activity className="text-primary w-8 h-8" /> Command Center
          </h2>
          <p className="text-slate-400 mt-1">Live overview of your logistics and fleet operations.</p>
        </div>
      </motion.div>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Shipments", value: stats.activeShipments, icon: Package, color: "text-primary", border: "border-l-primary" },
          { label: "Fleet Utilization", value: `${stats.fleetUtilization}%`, icon: Activity, color: "text-accent", border: "border-l-accent" },
          { label: "Loading Queue", value: stats.loadingQueue, icon: Truck, color: "text-yellow-400", border: "border-l-yellow-400" },
          { label: "Open Incidents", value: stats.openIncidents, icon: AlertTriangle, color: "text-red-500", border: "border-l-red-500" }
        ].map((stat, i) => (
          <MotionCard key={i} variants={itemVariants} className={`glass-card p-6 border-l-4 ${stat.border} relative overflow-hidden group`}>
            <div className={`absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${stat.color}`}>
              <stat.icon size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest">{stat.label}</h3>
              <p className="text-5xl font-extrabold text-white mt-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {stat.value}
              </p>
            </div>
          </MotionCard>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Utilization Chart */}
        <MotionCard variants={itemVariants} className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Weekly Fleet Utilization</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dummyUtilizationData}>
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="utilization" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorUtil)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>

        {/* Carbon Emissions Chart */}
        <MotionCard variants={itemVariants} className="glass-card p-6">
          <h3 className="text-xl font-bold text-white mb-6">Carbon Emissions (kg CO2)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyCarbonData}>
                <defs>
                  <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="emissions" fill="url(#colorCarbon)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>

      </div>
    </motion.div>
  );
};

export default Dashboard;
