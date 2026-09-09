import { describe, it, expect, vi, beforeEach } from 'vitest';

import TripPlannerService from '../../services/TripPlannerService';

vi.mock('../../config/endpoints', () => ({
  default: {
    places: {
      nearby: '/api/places/nearby',
      search: '/api/places/search',
      reverseGeocode: '/api/places/reverse-geocode',
      directions: '/api/places/directions',
      attractions: '/api/places/attractions',
      restaurants: '/api/places/restaurants',
    },
    trips: {
      base: '/api/trips',
      hotelLocation: '/api/trips/hotel-location',
      trip: (id) => `/api/trips/${id}`,
      stops: (id) => `/api/trips/${id}/stops`,
      stop: (id, stopId) => `/api/trips/${id}/stops/${stopId}`,
      reorder: (id) => `/api/trips/${id}/stops-reorder`,
    },
  },
}));

vi.mock('axios', () => {
  const mockAxios = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
  return { default: mockAxios };
});

const makeAxios = () => import('axios').then((m) => m.default);

describe('TripPlannerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHotelLocation', () => {
    it('GETs the hotel-location endpoint', async () => {
      const axios = await makeAxios();
      axios.get.mockResolvedValue({
        data: {
          success: true,
          hotel: { _id: 'h1', name: 'SmartStayX Hotel', address: '1 Beach Rd', city: 'Colombo', country: 'Sri Lanka' },
          startLocation: { name: 'SmartStayX Hotel', address: '1 Beach Rd, Colombo, Sri Lanka', lat: 6.9271, lng: 79.8612 },
          locationComplete: true,
        },
      });

      const result = await TripPlannerService.getHotelLocation(axios);
      expect(axios.get).toHaveBeenCalledWith('/api/trips/hotel-location', { params: {} });
      expect(result.startLocation.lat).toBe(6.9271);
      expect(result.locationComplete).toBe(true);
    });

    it('throws a friendly error on failure', async () => {
      const axios = await makeAxios();
      axios.get.mockResolvedValue({ data: { success: false, message: 'Hotel location is incomplete' } });
      await expect(TripPlannerService.getHotelLocation(axios)).rejects.toThrow('Hotel location is incomplete');
    });
  });

  describe('getNearbyPlaces', () => {
    it('GETs nearby with coordinates and category', async () => {
      const axios = await makeAxios();
      axios.get.mockResolvedValue({ data: { success: true, places: [{ placeId: 'p1', name: 'Galle Face Green' }] } });

      const result = await TripPlannerService.getNearbyPlaces(axios, { lat: 6.9, lng: 79.8, category: 'parks' });
      expect(axios.get).toHaveBeenCalledWith('/api/places/nearby', {
        params: { lat: 6.9, lng: 79.8, category: 'parks' },
      });
      expect(result.places[0].name).toBe('Galle Face Green');
    });
  });

  describe('getDirections', () => {
    it('GETs directions with origin, waypoints and destination', async () => {
      const axios = await makeAxios();
      axios.get.mockResolvedValue({
        data: {
          success: true,
          route: {
            summary: 'A1',
            legs: [{ distance: { value: 1000, text: '1 km' }, duration: { value: 600, text: '10 mins' } }],
            overviewPolyline: 'abc',
            bounds: null,
          },
        },
      });

      const result = await TripPlannerService.getDirections(
        axios,
        { lat: 6.9271, lng: 79.8612 },
        [{ lat: 7.29, lng: 80.63 }],
        { lat: 7.87, lng: 80.77 }
      );
      const [url, config] = axios.get.mock.calls[0];
      expect(url).toBe('/api/places/directions');
      expect(config.params.origin).toBe('6.9271,79.8612');
      expect(config.params.waypoint).toEqual(['7.29,80.63']);
      expect(config.params.destination).toBe('7.87,80.77');
      expect(result.route.legs).toHaveLength(1);
    });

    it('propagates friendly route errors', async () => {
      const axios = await makeAxios();
      axios.get.mockResolvedValue({
        data: { success: false, message: 'No route is available between these locations.' },
      });
      await expect(
        TripPlannerService.getDirections(axios, { lat: 0, lng: 0 }, [], { lat: 1, lng: 1 })
      ).rejects.toThrow('No route is available between these locations.');
    });
  });

  describe('saved trips', () => {
    it('creates a trip', async () => {
      const axios = await makeAxios();
      axios.post.mockResolvedValue({ data: { success: true, trip: { _id: 't1', name: 'Kandy Day Trip' } } });

      const result = await TripPlannerService.createTrip(axios, { name: 'Kandy Day Trip', stops: [] });
      expect(axios.post).toHaveBeenCalledWith('/api/trips', { name: 'Kandy Day Trip', stops: [] });
      expect(result.trip._id).toBe('t1');
    });

    it('deletes a trip', async () => {
      const axios = await makeAxios();
      axios.delete.mockResolvedValue({ data: { success: true, message: 'Trip deleted' } });

      const result = await TripPlannerService.deleteTrip(axios, 't1');
      expect(axios.delete).toHaveBeenCalledWith('/api/trips/t1');
      expect(result.success).toBe(true);
    });
  });
});
