import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StarRating from '../../components/StarRating';

const starFilledSrc = expect.stringContaining('star_icon');
const starOutlinedSrc = expect.stringContaining('star_icon');

vi.mock('../../assets/assets', () => ({
  assets: {
    starIconFilled: '/assets/star_icon_filled.png',
    starIconOutlined: '/assets/star_icon_outlined.png',
  },
}));

describe('StarRating', () => {
  it('renders 5 star images', () => {
    render(<StarRating />);
    const stars = screen.getAllByAltText('star-icon');
    expect(stars).toHaveLength(5);
  });

  it('renders correct number of filled stars for rating 3', () => {
    render(<StarRating rating={3} />);
    const stars = screen.getAllByAltText('star-icon');
    expect(stars[0]).toHaveAttribute('src', '/assets/star_icon_filled.png');
    expect(stars[1]).toHaveAttribute('src', '/assets/star_icon_filled.png');
    expect(stars[2]).toHaveAttribute('src', '/assets/star_icon_filled.png');
    expect(stars[3]).toHaveAttribute('src', '/assets/star_icon_outlined.png');
    expect(stars[4]).toHaveAttribute('src', '/assets/star_icon_outlined.png');
  });

  it('renders all empty for rating 0', () => {
    render(<StarRating rating={0} />);
    const stars = screen.getAllByAltText('star-icon');
    stars.forEach((star) => {
      expect(star).toHaveAttribute('src', '/assets/star_icon_outlined.png');
    });
  });

  it('renders all filled for rating 5', () => {
    render(<StarRating rating={5} />);
    const stars = screen.getAllByAltText('star-icon');
    stars.forEach((star) => {
      expect(star).toHaveAttribute('src', '/assets/star_icon_filled.png');
    });
  });

  it('defaults to rating 4', () => {
    render(<StarRating />);
    const stars = screen.getAllByAltText('star-icon');
    expect(stars[3]).toHaveAttribute('src', '/assets/star_icon_filled.png');
    expect(stars[4]).toHaveAttribute('src', '/assets/star_icon_outlined.png');
  });
});
