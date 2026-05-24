const Vehicle = require('../models/Vehicle');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('driverId', 'username email');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle location (Simulated tracking)
// @route   PUT /api/vehicles/:id/location
// @access  Private
const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.currentLocation = { lat, lng };
    const updatedVehicle = await vehicle.save();

    // Emit socket event for real-time map updates
    if(req.app.get('io')) {
      req.app.get('io').emit('vehicle-location-updated', {
        vehicleId: vehicle._id,
        location: vehicle.currentLocation
      });
    }

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle metrics (e.g. after a trip)
// @route   PUT /api/vehicles/:id/metrics
// @access  Private
const updateMetrics = async (req, res) => {
  const { distanceTraveled } = req.body; // simulated distance

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Heuristic for Carbon emissions based on fuel efficiency and distance
    // Example: (Distance / Fuel Efficiency) * 2.31 kg CO2 per liter of diesel
    const fuelUsed = distanceTraveled / vehicle.fuelEfficiency;
    const carbonEmitted = fuelUsed * 2.31;

    vehicle.metrics.carbonEmissions += carbonEmitted;
    
    // Update utilization dummy logic
    vehicle.metrics.utilization = Math.min(100, vehicle.metrics.utilization + 5);

    const updatedVehicle = await vehicle.save();

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private
const createVehicle = async (req, res) => {
  const { registration, type, capacity, fuelEfficiency } = req.body;

  try {
    const vehicle = new Vehicle({
      registration,
      type,
      capacity,
      fuelEfficiency,
      status: 'Available',
      currentLocation: { lat: 34.0522, lng: -118.2437 } // Default location
    });

    const createdVehicle = await vehicle.save();
    
    if(req.app.get('io')) {
      req.app.get('io').emit('vehicle-created', createdVehicle);
    }

    res.status(201).json(createdVehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  updateLocation,
  updateMetrics,
  createVehicle
};
