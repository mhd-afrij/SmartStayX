import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('VITE_BACKEND_URL', 'http://localhost:3000');
  vi.stubEnv('VITE_API_TIMEOUT', '30000');
});

import { TripPlannerService } from '../../services/TripPlannerService';

vi.mock('../../config/endpoints', () => ({
  default: {
    tripPlanner: {
      context: '/api/trip-planner/context',
      nearby: '/api/trip-planner/nearby',
      search: '/api/trip-planner/search',
      route: '/api/trip-planner/route',
    },
  },
}));

vi.mock('axios', () => {
  const mockAxios = { get: vi.fn(), post: vi.fn() };
  return { default: mockAxios };
});

describe('TripPlannerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getContext', () => {
    it('calls GET /api/trip-planner/context with hotelId param', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, hotels: [], hotel: null, role: 'guest' } });

      const result = await TripPlannerService.getContext('hotel-123');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/trip-planner/context',
        expect.objectContaining({ params: { hotelId: 'hotel-123' }, timeout: 30000 })
      );
      expect(result.hotels).toEqual([]);
    });

    it('omits hotelId param for staff scope context', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, hotels: [], hotel: null } });

      await TripPlannerService.getContext();

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/trip-planner/context',
        expect.objectContaining({ params: {} })
      );
    });
  });

  describe('getNearby', () => {
    it('passes hotelId, category and radius to the backend (DB-anchored origin)', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, origin: { latitude: 6.9271, longitude: 79.8431 }, places: [] } });

      const result = await TripPlannerService.getNearby({ hotelId: 'hotel-123', category: 'restaurants', radius: 15000 });

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/trip-planner/nearby',
        expect.objectContaining({
          params: { hotelId: 'hotel-123', category: 'restaurants', radius: 15000 },
          timeout: 30000,
        })
      );
      expect(result.origin).toEqual({ latitude: 6.9271, longitude: 79.8431 });
    });

    it('never sends client-supplied origin coordinates', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({ data: { success: true, places: [] } });

      await TripPlannerService.getNearby({ hotelId: 'hotel-123', category: 'beaches', radius: 30000 });

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ params: expect.objectContaining({ lat: expect.anything(), lng: expect.anything() }) })
      );
    });
  });

  describe('getRoute', () => {
    it('POSTs hotelId + destination + travelMode (no origin)', async () => {
      const axios = (await import('axios')).default;
      axios.post.mockResolvedValue({
        data: {
          success: true,
          route: {
            origin: { hotelId: 'hotel-123', latitude: 6.9271, longitude: 79.8431 },
            distanceText: '2.4 km',
            durationText: '12 mins',
            polyline: 'abc',
          },
        },
      });

      const result = await TripPlannerService.getRoute({
        hotelId: 'hotel-123',
        destination: { placeId: 'ChIJ', name: 'Eiffel Tower', latitude: 48.8584, longitude: 2.2945 },
        travelMode: 'WALK',
      });

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/trip-planner/route',
        {
          hotelId: 'hotel-123',
          destination: { placeId: 'ChIJ', name: 'Eiffel Tower', latitude: 48.8584, longitude: 2.2945 },
          travelMode: 'WALK',
        },
        expect.objectContaining({ timeout: 30000 })
      );
      expect(result.route.distanceText).toBe('2.4 km');
    });
  });

  describe('error handling', () => {
    it('throws with the backend message when success is false', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockResolvedValue({
        data: { success: false, message: 'Hotel location is incomplete. Please update the hotel location.', code: 'INVALID_LOCATION' },
      });

      await expect(TripPlannerService.getNearby({ hotelId: 'x', category: 'attractions' })).rejects.toThrow(
        'Hotel location is incomplete. Please update the hotel location.'
      );
    });

    it('surfaces the backend error message on transport errors', async () => {
      const axios = (await import('axios')).default;
      axios.get.mockRejectedValue({ response: { status: 401, data: { message: 'Authentication required' } } });

      try {
        await TripPlannerService.getContext();
        expect.unreachable();
      } catch (error) {
        expect(error.message).toBe('Authentication required');
        expect(error.status).toBe(401);
      }
    });
  });
});