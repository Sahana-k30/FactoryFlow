const mongoose = require('mongoose');

const shipmentSchema = mongoose.Schema({
  shipmentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: [
      'Production Completed',
      'Warehouse Packed',
      'Ready for Dispatch',
      'Vehicle Assigned',
      'In Transit',
      'Delivered'
    ],
    default: 'Production Completed'
  },
  weight: {
    type: Number, // in kg
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  assignedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  estimatedETA: {
    type: Date,
    default: null
  },
  deliveryRiskScore: {
    type: Number, // 0 to 100
    default: 0
  }
}, {
  timestamps: true
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
module.exports = Shipment;
