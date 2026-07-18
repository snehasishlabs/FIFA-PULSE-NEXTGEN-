import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AccessibilitySettings from '../features/accessibility/AccessibilitySettings';
import { Stadium, AccessibilityService } from '../types';

describe('Accessibility Settings & Services Module Tests', () => {
  const mockStadium: Stadium = {
    id: 'stadium-metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  };

  const mockServices: AccessibilityService[] = [
    {
      id: 'svc-01',
      stadiumId: 'stadium-metlife',
      serviceType: 'elevators',
      status: 'operational',
      locationDetails: 'Gate C main elevator bank',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'svc-02',
      stadiumId: 'stadium-metlife',
      serviceType: 'wheelchair_rental',
      status: 'limited',
      locationDetails: 'Section 104 guest services desk',
      lastChecked: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders base WCAG controls and active accessibility services', () => {
    const { container } = render(
      <AccessibilitySettings
        activeStadium={mockStadium}
        accessibility={mockServices}
        highContrast={false}
        setHighContrast={vi.fn()}
        textSize="normal"
        setTextSize={vi.fn()}
      />
    );

    expect(screen.getByText('WCAG Compliance Controls')).toBeInTheDocument();
    expect(screen.getByText('High Contrast AA Assist Mode')).toBeInTheDocument();
    expect(screen.getByText('Scale Typography:')).toBeInTheDocument();
    
    // Services
    expect(screen.getByText('elevators')).toBeInTheDocument();
    expect(screen.getByText('wheelchair rental')).toBeInTheDocument();
    expect(screen.getByText('Loc: Section 104 guest services desk')).toBeInTheDocument();
  });

  test('allows toggling high contrast assist setting', () => {
    const mockSetHighContrast = vi.fn();
    render(
      <AccessibilitySettings
        activeStadium={mockStadium}
        accessibility={mockServices}
        highContrast={false}
        setHighContrast={mockSetHighContrast}
        textSize="normal"
        setTextSize={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /High Contrast AA Assist Mode/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(mockSetHighContrast).toHaveBeenCalledWith(true);
  });

  test('allows selecting font size scale', () => {
    const mockSetTextSize = vi.fn();
    render(
      <AccessibilitySettings
        activeStadium={mockStadium}
        accessibility={mockServices}
        highContrast={false}
        setHighContrast={vi.fn()}
        textSize="normal"
        setTextSize={mockSetTextSize}
      />
    );

    const extraLargeBtn = screen.getByRole('button', { name: /1.5x Ultra/i });
    fireEvent.click(extraLargeBtn);

    expect(mockSetTextSize).toHaveBeenCalledWith('extra-large');
  });

  test('simulates screen reader audio readout successfully', async () => {
    const { container } = render(
      <AccessibilitySettings
        activeStadium={mockStadium}
        accessibility={mockServices}
        highContrast={false}
        setHighContrast={vi.fn()}
        textSize="normal"
        setTextSize={vi.fn()}
      />
    );

    // Initial Screen Reader readout empty/inactive
    expect(screen.queryByText(/SYNTHESIZING SCREEN READER FEEDBACK/i)).toBeNull();

    // Trigger audio readout for wheelchair service using css selector to be highly resilient
    const speakerBtn = container.querySelector('[aria-label="Listen to elevators details"]');
    expect(speakerBtn).toBeInTheDocument();

    fireEvent.click(speakerBtn!);

    // Readout HUD should display synthesized speech
    expect(screen.getByText(/SYNTHESIZING SCREEN READER FEEDBACK/i)).toBeInTheDocument();
    expect(screen.getByText(/"elevators status is currently operational. Located at Gate C main elevator bank."/i)).toBeInTheDocument();
  });

  test('enforces keyboard accessibility attributes and ARIA roles', () => {
    const { container } = render(
      <AccessibilitySettings
        activeStadium={mockStadium}
        accessibility={mockServices}
        highContrast={true} // high contrast mode is active
        setHighContrast={vi.fn()}
        textSize="large"
        setTextSize={vi.fn()}
      />
    );

    const highContrastBtn = screen.getByRole('button', { name: /High Contrast AA Assist Mode/i });
    expect(highContrastBtn).toHaveAttribute('aria-pressed', 'true');

    // Speakers have correct labels for screen readers
    const speakerBtn1 = container.querySelector('[aria-label="Listen to elevators details"]');
    const speakerBtn2 = container.querySelector('[aria-label="Listen to wheelchair rental details"]');
    expect(speakerBtn1).toBeInTheDocument();
    expect(speakerBtn2).toBeInTheDocument();
  });
});
