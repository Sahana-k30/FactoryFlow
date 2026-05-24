const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
const getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().populate('assignedVehicleId');
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a shipment
// @route   POST /api/shipments
// @access  Private (Admin, Warehouse Staff)
const createShipment = async (req, res) => {
  const { weight, urgency, origin, destination } = req.body;

  try {
    let shipment = new Shipment({
      shipmentId: `SHP-${Date.now()}`,
      weight,
      urgency,
      origin,
      destination,
      status: 'Ready for Dispatch'
    });

    const createdShipment = await shipment.save();
    
    // Emit socket event for real-time update
    if(req.app.get('io')) {
      req.app.get('io').emit('shipment-updated', createdShipment);
    }

    res.status(201).json(createdShipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shipment status
// @route   PUT /api/shipments/:id/status
// @access  Private
const updateShipmentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.status = status;
    const updatedShipment = await shipment.save();

    // If delivered, free the vehicle
    if (status === 'Delivered' && shipment.assignedVehicleId) {
      const vehicle = await Vehicle.findById(shipment.assignedVehicleId);
      if (vehicle) {
        vehicle.status = 'Available';
        await vehicle.save();
        if(req.app.get('io')) {
          req.app.get('io').emit('vehicle-updated', vehicle);
        }
      }
    }

    // Emit socket event
    if(req.app.get('io')) {
      req.app.get('io').emit('shipment-updated', updatedShipment);
    }

    res.json(updatedShipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    AI Dispatch Recommendation (Heuristic)
// @route   GET /api/shipments/:id/recommend-vehicle
// @access  Private (Admin, Dispatch Manager)
const recommendVehicle = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    // 1. Find all available vehicles that have enough capacity
    const availableVehicles = await Vehicle.find({
      status: 'Available',
      capacity: { $gte: shipment.weight }
    });

    if (availableVehicles.length === 0) {
      return res.json({ recommendation: null, message: 'No suitable vehicles currently available' });
    }

    // 2. Score each vehicle using a heuristic
    // For simplicity, we prioritize Fuel Efficiency, but if urgency is Critical, we might prioritize speed/truck type.
    const scoredVehicles = availableVehicles.map(vehicle => {
      let score = 0;
      
      // Heuristic 1: Better fuel efficiency = higher score
      score += vehicle.fuelEfficiency * 10;
      
      // Heuristic 2: Capacity utilization (we want the truck that fits the shipment best without wasting space)
      const utilizationPercent = shipment.weight / vehicle.capacity;
      if (utilizationPercent > 0.8) {
        score += 50; // Optimal fit
      } else if (utilizationPercent > 0.5) {
        score += 20; // Good fit
      } else {
        score -= 10; // Wasted capacity
      }

      return { vehicle, score };
    });

    // Sort by highest score
    scoredVehicles.sort((a, b) => b.score - a.score);

    res.json({
      recommendation: scoredVehicles[0].vehicle,
      score: scoredVehicles[0].score,
      alternatives: scoredVehicles.slice(1)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign vehicle to shipment
// @route   PUT /api/shipments/:id/assign
// @access  Private
const assignVehicle = async (req, res) => {
  const { vehicleId } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id);
    const vehicle = await Vehicle.findById(vehicleId);

    if (!shipment || !vehicle) {
      return res.status(404).json({ message: 'Shipment or Vehicle not found' });
    }

    shipment.assignedVehicleId = vehicle._id;
    shipment.status = 'Vehicle Assigned';
    
    // Simulate an ETA
    const eta = new Date();
    eta.setHours(eta.getHours() + Math.floor(Math.random() * 5) + 1); // 1-5 hours from now
    shipment.estimatedETA = eta;
    
    const updatedShipment = await shipment.save();

    vehicle.status = 'In Transit';
    await vehicle.save();

    // Emit socket events
    if(req.app.get('io')) {
      req.app.get('io').emit('shipment-updated', updatedShipment);
      req.app.get('io').emit('vehicle-updated', vehicle);
    }

    res.json(updatedShipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getShipments,
  createShipment,
  updateShipmentStatus,
  recommendVehicle,
  assignVehicle
};
