// File: frontend/src/utils/format.js
/**
 * Safely formats any value for rendering in React
 * @param {any} value - The value to format
 * @param {string} defaultValue - Default value if null/undefined
 * @returns {string|number|React.ReactNode} - Safe value for rendering
 */
export const safeRender = (value, defaultValue = 'N/A') => {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  if (typeof value === 'object') {
    // Handle user objects
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`;
    }
    
    // Handle objects with name property (tenant, role, etc.)
    if (value.name) {
      return value.name;
    }
    
    // Handle objects with _id property
    if (value._id) {
      return value._id.toString();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return defaultValue;
      return value.map(item => safeRender(item)).join(', ');
    }
    
    // Last resort: convert to string
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
  
  return value;
};