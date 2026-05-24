import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Vehicles from './pages/Vehicles';
import LiveTracking from './pages/LiveTracking';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="tracking" element={<LiveTracking />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
