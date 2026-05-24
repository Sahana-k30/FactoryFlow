const mongoose = require('mongoose');

const vehicleSchema = mongoose.Schema({
  registration: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Truck', 'Van', 'Lorry'],
    required: true
  },
  capacity: {
    type: Number, // in kg
    required: true
  },
  fuelEfficiency: {
    type: Number, // km per liter
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'In Transit', 'Maintenance'],
    default: 'Available'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  metrics: {
    utilization: { type: Number, default: 0 },
    carbonEmissions: { type: Number, default: 0 } // in kg CO2
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;
