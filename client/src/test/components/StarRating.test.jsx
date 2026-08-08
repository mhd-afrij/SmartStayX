import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StarRating from '../../components/StarRating';

describe('StarRating', () => {
  it('renders 5 star icons', () => {
    const { container } = render(<StarRating />);
    const stars = container.querySelectorAll('svg');
    expect(stars).toHaveLength(5);
  });

  it('renders correct number of filled stars for rating 3', () => {
    const { container } = render(<StarRating rating={3} />);
    const stars = container.querySelectorAll('svg');
    expect(stars[0].classList.contains('fill-[#F5D08A]')).toBe(true);
    expect(stars[1].classList.contains('fill-[#F5D08A]')).toBe(true);
    expect(stars[2].classList.contains('fill-[#F5D08A]')).toBe(true);
    expect(stars[3].classList.contains('fill-[#F5D08A]')).toBe(false);
    expect(stars[4].classList.contains('fill-[#F5D08A]')).toBe(false);
  });

  it('renders all empty for rating 0', () => {
    const { container } = render(<StarRating rating={0} />);
    const stars = container.querySelectorAll('svg');
    stars.forEach((star) => {
      expect(star.classList.contains('fill-[#F5D08A]')).toBe(false);
    });
  });

  it('renders all filled for rating 5', () => {
    const { container } = render(<StarRating rating={5} />);
    const stars = container.querySelectorAll('svg');
    stars.forEach((star) => {
      expect(star.classList.contains('fill-[#F5D08A]')).toBe(true);
    });
  });

  it('defaults to rating 4', () => {
    const { container } = render(<StarRating />);
    const stars = container.querySelectorAll('svg');
    expect(stars[3].classList.contains('fill-[#F5D08A]')).toBe(true);
    expect(stars[4].classList.contains('fill-[#F5D08A]')).toBe(false);
  });
});
