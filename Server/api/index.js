// Vercel serverless function handler for Express app
// This file serves as the entry point for Vercel serverless functions
// All routes are handled by the Express app exported from server.js

import app from '../server.js';

// Export the Express app as the handler
// Vercel will automatically wrap this for serverless execution
// The global error handler in server.js will catch any unhandled errors
export default app;

