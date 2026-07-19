import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Logistics from '../features/logistics/Logistics';
import { Stadium, TransportUpdate } from '../types';

vi.mock('../../components/GoogleMapComponent', () => {
  return {
    default: function MockGoogleMapComponent() {
      return <div data-testid="google-map-default">Mocked Google Map</div>;
    }
  };
});

describe('Logistics Center & AI Navigation Module Tests', () => {
  const mockStadium: Stadium = {
    id: 'stadium-metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  };

  const mockTransport: TransportUpdate[] = [
    {
      id: 'trans-01',
      stadiumId: 'stadium-metlife',
      mode: 'metro',
      routeOrZone: 'MetLife Express Line A',
      status: 'smooth',
      estimatedWaitMinutes: 5,
      sustainabilityScore: 92,
    },
    {
      id: 'trans-02',
      stadiumId: 'stadium-metlife',
      mode: 'bus',
      routeOrZone: 'Shuttle Corridor East',
      status: 'congested',
      estimatedWaitMinutes: 18,
      sustainabilityScore: 78,
    }
  ];

  const mockRoutePlanSuccess = {
    status: 'success',
    data: {
      routeExplanation: 'Calculated a crowd-avoiding corridor bypassing the eastern ticketing bottleneck by routing through western pedestrian tunnels.',
      totalDistanceMeters: 650,
      estimatedDurationMinutes: 8,
      routeDensityLevel: 'medium',
      accessibilityRating: 'optimal',
      warnings: ['Heavy pedestrian construction on Gate B approach.'],
      pathCoordinates: [
        { lat: 40.8135, lng: -74.0744 },
        { lat: 40.8140, lng: -74.0750 }
      ],
      steps: [
        { instruction: 'Depart from Transit Hub on West sidewalk.', distanceMeters: 200, durationSeconds: 150 },
        { instruction: 'Enter Section 4 bypass lane.', distanceMeters: 450, durationSeconds: 330 }
      ],
      alternatives: [
        {
          name: 'Alternative Bypass Track 1',
          routeExplanation: 'Route via parking Lot C accessible ramps.',
          steps: ['Head south around Gate C elevators.']
        }
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders base map container and transport operational grids', async () => {
    render(<Logistics activeStadium={mockStadium} transport={mockTransport} />);

    // Interactive map
    expect(await screen.findByTestId('google-map-default')).toBeInTheDocument();

    // Transport hubs
    expect(screen.getByText('MetLife Express Line A')).toBeInTheDocument();
    expect(screen.getByText('Shuttle Corridor East')).toBeInTheDocument();
    expect(screen.getByText('5 min wait')).toBeInTheDocument();
    expect(screen.getByText('18 min wait')).toBeInTheDocument();
  });

  test('calculates optimal AI route and renders trajectory details, steps, and alternatives', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoutePlanSuccess)
    });
    globalThis.fetch = mockFetch;

    const { container } = render(<Logistics activeStadium={mockStadium} transport={mockTransport} />);

    // Select options using querySelector for 100% resilience against complex label layouts
    const originSelect = container.querySelector('#route-origin');
    const destinationSelect = container.querySelector('#route-destination');
    const typeSelect = container.querySelector('#route-mode');
    const langSelect = container.querySelector('#route-language');

    expect(originSelect).toBeInTheDocument();
    expect(destinationSelect).toBeInTheDocument();
    expect(typeSelect).toBeInTheDocument();
    expect(langSelect).toBeInTheDocument();

    fireEvent.change(originSelect!, { target: { value: 'transit_station' } });
    fireEvent.change(destinationSelect!, { target: { value: 'gate_a' } });
    fireEvent.change(typeSelect!, { target: { value: 'crowd_avoidance' } });
    fireEvent.change(langSelect!, { target: { value: 'en' } });

    // Submit route calculations
    const calcBtn = screen.getByRole('button', { name: /CALCULATE AI ROUTE DIRECTIVES/i });
    fireEvent.click(calcBtn);

    expect(calcBtn).toHaveTextContent(/COMPUTING OPTIMAL PATHWAY.../i);

    await waitFor(() => {
      // Check HTTP request parameters
      expect(mockFetch).toHaveBeenCalledWith('/api/navigation/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId: 'stadium-metlife',
          origin: 'transit_station',
          destination: 'gate_a',
          routeType: 'crowd_avoidance',
          language: 'en'
        })
      });

      // Stats ribbon
      expect(screen.getByText('650m')).toBeInTheDocument();
      expect(screen.getByText('8 mins')).toBeInTheDocument();
      expect(screen.getByText('medium density')).toBeInTheDocument();

      // Warnings
      expect(screen.getByText('Heavy pedestrian construction on Gate B approach.')).toBeInTheDocument();

      // AI Commentary
      expect(screen.getByText(/Calculated a crowd-avoiding corridor/i)).toBeInTheDocument();

      // Steps
      expect(screen.getByText('Depart from Transit Hub on West sidewalk.')).toBeInTheDocument();
      expect(screen.getByText('Enter Section 4 bypass lane.')).toBeInTheDocument();

      // Alternatives
      expect(screen.getByText('Alternative Bypass Track 1')).toBeInTheDocument();
      expect(screen.getByText('Route via parking Lot C accessible ramps.')).toBeInTheDocument();
    });
  });

  test('handles route computing failures gracefully with error warnings', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false
    });
    globalThis.fetch = mockFetch;

    render(<Logistics activeStadium={mockStadium} transport={mockTransport} />);

    const calcBtn = screen.getByRole('button', { name: /CALCULATE AI ROUTE DIRECTIVES/i });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to calculate navigation trajectory/i)).toBeInTheDocument();
    });
  });
});
