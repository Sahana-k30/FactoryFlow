# FactoryFlow AI - Smart Manufacturing Logistics Intelligence System

FactoryFlow AI is an enterprise-grade MERN stack application designed to simulate a real manufacturing logistics platform. It orchestrates factory dispatch operations, warehouse coordination, intelligent vehicle allocation, and industrial transport analytics.

## Application Workflow

The system provides role-based access for different stakeholders in the manufacturing logistics chain: **Admin, Dispatch Manager, Warehouse Staff, and Driver**.

### 1. Shipment Lifecycle
1. **Production Completed**: A new shipment is registered in the system from the factory floor.
2. **Warehouse Packed**: Warehouse staff updates the status once the shipment is packed and ready.
3. **Ready for Dispatch**: The shipment enters the dispatch queue.
4. **AI Dispatch Recommendation**: The system's heuristic AI evaluates the shipment's weight, urgency, and destination against available vehicles (considering capacity, fuel efficiency, and current status) to recommend the optimal vehicle.
5. **Vehicle Assigned**: A Dispatch Manager approves the recommendation or manually assigns a vehicle and driver.
6. **In Transit**: The driver begins the journey. Live tracking is simulated via WebSockets (Socket.IO).
7. **Delivered**: The driver marks the shipment as delivered.

### 2. Smart Operations & Analytics
- **Congestion Detection**: Monitors loading dock overload and wait queues.
- **Predictive ETA**: Estimates delivery times factoring in distance and historical simulated data.
- **Incident Management**: Drivers can report breakdowns, damaged goods, or route blockages, triggering real-time alerts to managers.
- **Carbon & Fuel Analytics**: Tracks eco-efficiency metrics across the fleet.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Redux Toolkit, Framer Motion, Recharts, Leaflet.js
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT Auth

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and set your `MONGO_URI` and `JWT_SECRET`.
4. Seed the database with dummy data (Users, Vehicles):
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and set the backend API URL:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Dummy Credentials
- **Admin**: admin@factoryflow.ai / password123
- **Dispatch Manager**: dispatch@factoryflow.ai / password123
- **Warehouse**: warehouse@factoryflow.ai / password123
- **Driver**: driver@factoryflow.ai / password123
