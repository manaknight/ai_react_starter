// Role-based capabilities configuration
// Maps roles to their allowed capabilities
const CAPABILITIES = {
  member: ['profile:read', 'profile:write'],
  admin: ['users:read', 'users:write', 'system:read'],
  superadmin: ['*'] // All capabilities
};

// Check if a role has a specific capability
const hasCapability = (role, capability) => {
  const roleCapabilities = CAPABILITIES[role?.toLowerCase()];
  if (!roleCapabilities) {
    return false;
  }

  // SuperAdmin can do anything
  if (roleCapabilities.includes('*')) {
    return true;
  }

  return roleCapabilities.includes(capability);
};

// Get capabilities for a role
const getCapabilities = (role) => {
  return CAPABILITIES[role?.toLowerCase()] || [];
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