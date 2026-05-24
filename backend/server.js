const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const incidentRoutes = require('./routes/incidentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/incidents', incidentRoutes);

app.get('/', (req, res) => {
  res.send('FactoryFlow AI Backend is running.');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to our router
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
