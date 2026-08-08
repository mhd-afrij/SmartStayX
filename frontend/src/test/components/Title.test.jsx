import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Title from '../../components/Title';

describe('Title', () => {
  it('renders title text', () => {
    render(<Title title="My Bookings" />);
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<Title title="Rooms" subtitle="Browse all rooms" />);
    expect(screen.getByText('Browse all rooms')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<Title title="Rooms" />);
    expect(screen.queryByText('Browse all rooms')).not.toBeInTheDocument();
  });

  it('renders kicker when provided', () => {
    render(<Title title="Rooms" kicker="Luxury" />);
    expect(screen.getByText('Luxury')).toBeInTheDocument();
  });

  it('centers text by default', () => {
    const { container } = render(<Title title="Rooms" />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('text-center');
  });

  it('aligns left when specified', () => {
    const { container } = render(<Title title="Rooms" align="left" />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('text-left');
  });
});
