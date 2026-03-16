/**
 * Error Utilities
 */

/**
 * Extracts a human-readable error message from various error object formats
 * @param {any} error - The error object from an API response or catch block
 * @returns {string} - A clean error message string
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;

  if (error?.response?.data) {
    const data = error.response.data;

    // Handle FastAPI/Pydantic validation errors (array of objects)
    if (Array.isArray(data.detail)) {
      return data.detail.map(err => {
        const field = err.loc ? err.loc[err.loc.length - 1] : '';
        return `${field ? field + ': ' : ''}${err.msg}`;
      }).join(', ');
    }

    // Handle simple string detail
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    // Fallback for other data structures
    return JSON.stringify(data);
  }

  return error?.message || 'An unexpected error occurred';
};
