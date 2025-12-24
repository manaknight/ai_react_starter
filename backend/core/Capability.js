// Role-based capabilities configuration
// Maps roles to their allowed capabilities
const CAPABILITIES = {
  member: {
    can: ['profile:read', 'profile:write']
  },
  admin: {
    can: ['users:read', 'users:write', 'system:read']
  },
  superadmin: {
    can: ['*'] // All capabilities
  }
};

// Check if a role has a specific capability
const hasCapability = (role, capability) => {
  const roleCapabilities = CAPABILITIES[role?.toLowerCase()];
  if (!roleCapabilities || !roleCapabilities.can) {
    return false;
  }

  // SuperAdmin can do anything
  if (roleCapabilities.can.includes('*')) {
    return true;
  }

  return roleCapabilities.can.includes(capability);
};

// Get capabilities for a role
const getCapabilities = (role) => {
  return CAPABILITIES[role?.toLowerCase()] || { can: [] };
};

// Get all defined capabilities mapping
const getAllCapabilities = () => {
  return CAPABILITIES;
};

module.exports = {
  CAPABILITIES,
  hasCapability,
  getCapabilities,
  getAllCapabilities,
};