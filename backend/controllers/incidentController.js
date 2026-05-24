const Incident = require('../models/Incident');

// @desc    Get all incidents
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('reportedBy', 'username')
      .populate('vehicleId', 'registration type');
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Report an incident
// @route   POST /api/incidents
// @access  Private (Driver)
const reportIncident = async (req, res) => {
  const { type, description, vehicleId } = req.body;

  try {
    const incident = new Incident({
      type,
      description,
      reportedBy: req.user._id,
      vehicleId: vehicleId || null
    });

    const createdIncident = await incident.save();

    // Emit socket event for real-time alert to dashboard
    if(req.app.get('io')) {
      req.app.get('io').emit('incident-reported', createdIncident);
    }

    res.status(201).json(createdIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident status
// @route   PUT /api/incidents/:id/status
// @access  Private (Admin, Dispatch Manager)
const updateIncidentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    incident.status = status;
    const updatedIncident = await incident.save();

    res.json(updatedIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIncidents,
  reportIncident,
  updateIncidentStatus
};
