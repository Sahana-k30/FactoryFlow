import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `block p-3 rounded-lg font-medium transition-colors ${
      isActive ? 'bg-slate-800 text-slate-200 shadow-sm' : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-300'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-industrial-dark">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r border-slate-700 bg-slate-900 flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-wider">
            Factory<span className="text-primary">Flow</span> AI
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
          <NavLink to="/shipments" className={linkClass}>Shipments</NavLink>
          <NavLink to="/vehicles" className={linkClass}>Vehicles</NavLink>
          <NavLink to="/tracking" className={linkClass}>Live Tracking</NavLink>
        </nav>
        <div className="p-4 border-t border-slate-700">
           <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors">
             Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Top Navbar Placeholder */}
        <header className="absolute top-0 left-0 right-0 h-16 border-b border-slate-700/50 bg-industrial-dark/80 backdrop-blur-sm flex items-center justify-end px-8 z-10">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-medium text-sm">{userInfo?.username} ({userInfo?.role})</span>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-white">
              {userInfo?.username?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-16 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
