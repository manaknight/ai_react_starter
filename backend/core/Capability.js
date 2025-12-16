// Role-based capabilities configuration
// Admin can do anything
const capabilities = {
  admin: {
    can: ['*'],
  },
  member: {
    can: [
      // Support tickets
      'support:tickets:read',
      'support:tickets:create',
      'support:messages:read',
      'support:messages:create',
    ],
  },

};

// Check if a role has a specific capability
const hasCapability = (role, capability) => {
  if (!capabilities[role]) {
    return false;
  }

  // Admin can do anything
  if (capabilities[role].can.includes('*')) {
    return true;
  }

  return capabilities[role].can.includes(capability);
};

// Get capabilities for a role
const getCapabilities = (role) => {
  return capabilities[role] || { can: [] };
};

// Get all defined capabilities
const getAllCapabilities = () => {
  return capabilities;
};

module.exports = {
  capabilities,
  hasCapability,
  getCapabilities,
  getAllCapabilities,
};