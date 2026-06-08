import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoomDetails from '../../pages/RoomDetails';

const mockRoom = {
  _id: 'room-1',
  roomType: 'Deluxe',
  pricePerNight: 200,
  images: ['https://example.com/img1.jpg'],
  amenities: ['Free WiFi', 'Pool'],
  hotel: {
    name: 'Test Hotel',
    address: '123 Test St',
    owner: { image: 'https://example.com/owner.jpg' },
  },
};

const mockAxios = { get: vi.fn(), post: vi.fn() };
vi.mock('../../context/AppContext', () => ({
  useAppContext: () => ({
    axios: mockAxios,
    getToken: vi.fn().mockResolvedValue('mock-token'),
    user: null,
    navigate: vi.fn(),
    formatPrice: (p) => `$${p.toFixed(2)}`,
    translate: (s) => s,
  }),
}));

vi.mock('../../assets/assets', () => ({
  assets: {
    locationIcon: '/assets/location.svg',
    starIconFilled: '/assets/star_filled.svg',
    starIconOutlined: '/assets/star_outlined.svg',
  },
  facilityIcons: {},
  placeholderImage: 'data:image/svg+xml;placeholder',
  roomCommonData: [],
}));

vi.mock('../../components/StarRating', () => ({
  default: () => <div data-testid="star-rating" />,
}));

function renderRoomDetails() {
  return render(
    <MemoryRouter initialEntries={['/rooms/room-1']}>
      <Routes>
        <Route path="/rooms/:id" element={<RoomDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoomDetails page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAxios.get.mockResolvedValue({ data: { success: true, room: mockRoom } });
  });

  it('renders room details after loading', async () => {
    renderRoomDetails();

    const headings = await screen.findAllByText('Test Hotel');
    expect(headings.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Deluxe')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('Free WiFi')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  it('shows breadcrumb, booking form, and host section', async () => {
    renderRoomDetails();

    await screen.findAllByText('Test Hotel');

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Check availability')).toBeInTheDocument();
    expect(screen.getByText('Contact now')).toBeInTheDocument();
    expect(screen.getByLabelText('Check in')).toBeInTheDocument();
    expect(screen.getByLabelText('Check out')).toBeInTheDocument();
    expect(screen.getByLabelText('Guests')).toBeInTheDocument();
  });

  it('shows room not found for missing data', async () => {
    mockAxios.get.mockResolvedValue({ data: { success: false, message: 'Not found' } });
    renderRoomDetails();

    expect(await screen.findByText('Room not found')).toBeInTheDocument();
    expect(screen.getByText('Browse rooms')).toBeInTheDocument();
  });
});
