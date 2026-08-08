// apiResponse.js — Consistent JSON response helpers for controllers
// Every response returns { success: true|false } with an appropriate HTTP status.

export const ok = (res, data = {}, status = 200) => {
  return res.status(status).json({ success: true, ...data });
};

export const created = (res, data = {}) => {
  return res.status(201).json({ success: true, ...data });
};

export const badRequest = (res, message, details = null) => {
  const body = { success: false, message };
  if (details) body.errors = details;
  return res.status(400).json(body);
};

export const unauthorized = (res, message = 'Not authenticated') => {
  return res.status(401).json({ success: false, message });
};

export const forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

export const notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({ success: false, message });
};

export const serverError = (res, message = 'Internal server error') => {
  return res.status(500).json({ success: false, message });
};
