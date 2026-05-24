const mongoose = require('mongoose');

const incidentSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['breakdown', 'damaged_goods', 'loading_issues', 'route_blockages'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open'
  }
}, {
  timestamps: true
});

const Incident = mongoose.model('Incident', incidentSchema);
module.exports = Incident;
