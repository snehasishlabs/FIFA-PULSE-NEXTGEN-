import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Simulator from '../features/simulator/Simulator';
import { Stadium, Simulation } from '../types';

describe('Simulator Module Tests', () => {
  const mockStadium: Stadium = {
    id: 'stadium-metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  };

  const mockSimulations: Simulation[] = [
    {
      id: 'sim-101',
      stadiumId: 'stadium-metlife',
      scenarioType: 'crowd_surge',
      intensity: 'high',
      status: 'completed',
      findings: 'GenAI Analysis: Commuter trains arriving in rapid 3-minute intervals caused substantial backlog at Terminal Plaza.',
      mitigationPlan: 'Activate bypass corridors B and C, increase scanning personnel by 20%.',
      timestamp: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('restricts access for non-admin/non-operations roles (RLS demonstration)', () => {
    render(
      <Simulator
        activeStadium={mockStadium}
        simulations={mockSimulations}
        userRole="fan" // Fan is restricted!
        runSimulation={vi.fn()}
      />
    );

    // Verify restricted access message
    expect(screen.getByText(/Restricted Access Module/i)).toBeInTheDocument();
    expect(screen.getByText(/Access is limited to/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Execute Intel Drill/i })).toBeNull();
  });

  test('renders simulator controls and recent findings for authorized users', () => {
    const { container } = render(
      <Simulator
        activeStadium={mockStadium}
        simulations={mockSimulations}
        userRole="operations" // authorized
        runSimulation={vi.fn()}
      />
    );

    // Verify select element exists by ID instead of label
    const selectEl = container.querySelector('#scenario-type');
    expect(selectEl).toBeInTheDocument();

    const intensityDiv = container.querySelector('#stress-intensity');
    expect(intensityDiv).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Execute Intel Drill/i })).toBeInTheDocument();

    // Verify findings and mitigation plans rendered
    expect(screen.getByText('Crowd Surge Stress Test')).toBeInTheDocument();
    expect(screen.getByText(/high stress/i)).toBeInTheDocument();
    expect(screen.getByText(/Commuter trains arriving in rapid 3-minute intervals/i)).toBeInTheDocument();
    expect(screen.getByText(/Activate bypass corridors B and C/i)).toBeInTheDocument();
  });

  test('allows changing drill parameters and executing simulation successfully', async () => {
    const mockRunSimulation = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <Simulator
        activeStadium={mockStadium}
        simulations={[]}
        userRole="admin" // authorized
        runSimulation={mockRunSimulation}
      />
    );

    // Initial empty state
    expect(screen.getByText(/Drill Log Board Empty/i)).toBeInTheDocument();

    // Select different scenario using direct DOM reference
    const scenarioSelect = container.querySelector('#scenario-type');
    expect(scenarioSelect).toBeInTheDocument();
    fireEvent.change(scenarioSelect!, { target: { value: 'emergency_evacuation' } });

    // Select extreme intensity
    const extremeBtn = screen.getByRole('button', { name: /extreme/i });
    fireEvent.click(extremeBtn);

    // Execute drill
    const executeBtn = screen.getByRole('button', { name: /Execute Intel Drill/i });
    await act(async () => {
      fireEvent.click(executeBtn);
    });

    expect(mockRunSimulation).toHaveBeenCalledWith({
      stadiumId: 'stadium-metlife',
      scenarioType: 'emergency_evacuation',
      intensity: 'extreme'
    });
  });
});
