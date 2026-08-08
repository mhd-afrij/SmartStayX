/* eslint-disable no-undef */
import '@testing-library/jest-dom';

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: null, isLoaded: true, isSignedIn: false }),
  useAuth: () => ({ getToken: () => Promise.resolve('mock-token'), userId: null }),
  ClerkProvider: ({ children }) => children,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), toast: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));
