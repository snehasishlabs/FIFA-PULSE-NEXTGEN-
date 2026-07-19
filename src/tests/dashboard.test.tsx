import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import CommandCenter from '../features/dashboard/CommandCenter';
import DashboardPage from '../features/dashboard/DashboardPage';
import { useApp } from '../app/AppContext';
import { MemoryRouter } from 'react-router-dom';
import { Stadium, StadiumMetric, Incident } from '../types';

// Mock useApp hook to control authentication states easily
vi.mock('../app/AppContext', () => {
  return {
    useApp: vi.fn(),
    AppProvider: ({ children }: any) => <div>{children}</div>
  };
});

describe('CommandCenter Dashboard Module Tests', () => {
  const mockStadium: Stadium = {
    id: 'stadium-metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  };

  const mockMetrics: StadiumMetric = {
    id: 'metric-1',
    stadiumId: 'stadium-metlife',
    attendance: 74200,
    crowdDensity: 82,
    stadiumHealthScore: 89,
    gateCongestion: {
      'Gate A': 'low',
      'Gate B': 'medium',
      'Gate C': 'high',
      'Gate D': 'low',
    },
    resourceUtilization: {
      security: 70,
      medical: 50,
      concessions: 60,
      transport: 45,
    },
    timestamp: new Date().toISOString(),
  };

  const mockIncidents: Incident[] = [
    {
      id: 'inc-01',
      stadiumId: 'stadium-metlife',
      title: 'Power spike sector 4',
      description: 'Minor electrical overload reported.',
      status: 'responding',
      severity: 'medium',
      category: 'facility',
      location: 'Section 124',
      reporterName: 'Supervisor',
      timestamp: new Date().toISOString(),
      escalationLevel: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading/spinner states when stadium is missing', () => {
    render(
      <CommandCenter
        activeStadium={null as any}
        metrics={mockMetrics}
        incidents={[]}
        userRole="admin"
        userName="Security Chief Elena"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );
    expect(screen.getByText(/RETRIEVING STADIUM DETAILS.../i)).toBeInTheDocument();
  });

  test('renders loading/spinner states when live telemetry is missing', () => {
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={null}
        incidents={[]}
        userRole="admin"
        userName="Security Chief Elena"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );
    expect(screen.getByText(/RETRIEVING LIVE TELEMETRY.../i)).toBeInTheDocument();
  });

  test('renders live stadium metric values correctly', () => {
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={mockIncidents}
        userRole="operations"
        userName="Operations Director"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );

    // Live Attendance
    expect(screen.getByText('74,200')).toBeInTheDocument();
    expect(screen.getByText('/ 82,500')).toBeInTheDocument();

    // Crowd Density
    expect(screen.getByText('82%')).toBeInTheDocument();

    // Stadium Health Score
    expect(screen.getByText('89')).toBeInTheDocument();

    // Active incidents count
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('renders gate queue density markers correctly', () => {
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={[]}
        userRole="operations"
        userName="Operations Director"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );

    expect(screen.getAllByText('Gate A')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Gate B')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Gate C')[0]).toBeInTheDocument();

    expect(screen.getAllByText(/low queue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/medium queue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/high queue/i).length).toBeGreaterThan(0);
  });

  test('renders active incidents details inside Feed panel', () => {
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={mockIncidents}
        userRole="operations"
        userName="Operations Director"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );

    expect(screen.getByText('Power spike sector 4')).toBeInTheDocument();
    expect(screen.getByText('Minor electrical overload reported.')).toBeInTheDocument();
    expect(screen.getByText('Loc: Section 124')).toBeInTheDocument();
  });

  test('allows operations and admin roles to report new incident via form overlay', async () => {
    const mockReportIncident = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={[]}
        userRole="operations"
        userName="Operations Director"
        reportIncident={mockReportIncident}
        resolveIncident={vi.fn()}
      />
    );

    // Open form
    const logBtn = screen.getByRole('button', { name: /Log Incident/i });
    fireEvent.click(logBtn);

    // Query inputs directly for maximum resilience
    const textInputs = container.querySelectorAll('input[type="text"]');
    const textarea = container.querySelector('textarea');

    expect(textInputs.length).toBeGreaterThanOrEqual(2);
    expect(textarea).toBeInTheDocument();

    const titleInput = textInputs[0];
    const locInput = textInputs[1];

    fireEvent.change(titleInput, { target: { value: 'Water leak Section 10' } });
    fireEvent.change(textarea!, { target: { value: 'Severe leak under major seat tier.' } });
    fireEvent.change(locInput, { target: { value: 'Lower Tier 10A' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockReportIncident).toHaveBeenCalledWith({
        stadiumId: mockStadium.id,
        title: 'Water leak Section 10',
        description: 'Severe leak under major seat tier.',
        category: 'crowd', // default option value
        severity: 'medium', // default option value
        location: 'Lower Tier 10A',
        reporterName: 'Operations Director',
      });
    });
  });

  test('allows operations and admin roles to resolve active incident', async () => {
    const mockResolveIncident = vi.fn().mockResolvedValue(true);
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={mockIncidents}
        userRole="operations"
        userName="Operations Director"
        reportIncident={vi.fn()}
        resolveIncident={mockResolveIncident}
      />
    );

    const resolveBtn = screen.getByText('Mark Resolved');
    fireEvent.click(resolveBtn);

    expect(mockResolveIncident).toHaveBeenCalledWith('inc-01');
  });

  test('blocks fan role from logging or resolving incidents', () => {
    render(
      <CommandCenter
        activeStadium={mockStadium}
        metrics={mockMetrics}
        incidents={mockIncidents}
        userRole="fan"
        userName="Fan"
        reportIncident={vi.fn()}
        resolveIncident={vi.fn()}
      />
    );

    // "Log Incident" button should not render for fan
    expect(screen.queryByRole('button', { name: /Log Incident/i })).toBeNull();

    // "Mark Resolved" button should not render for fan
    expect(screen.queryByRole('button', { name: /Mark Resolved/i })).toBeNull();
  });
});

describe('DashboardPage Component Tests', () => {
  beforeEach(() => {
    vi.mocked(useApp).mockReturnValue({
      activeStadium: {
        id: 'stadium-metlife',
        name: 'MetLife Stadium',
        city: 'East Rutherford, NJ',
        capacity: 82500,
        latitude: 40.8135,
        longitude: -74.0744,
      },
      metrics: {
        'stadium-metlife': {
          attendance: 74200,
          crowdDensity: 82,
          stadiumHealthScore: 89,
          gateCongestion: {
            'Gate A': 'low',
            'Gate B': 'medium',
            'Gate C': 'high',
            'Gate D': 'low',
          },
          resourceUtilization: {
            security: 70,
            medical: 50,
            concessions: 60,
            transport: 45,
          },
        }
      },
      incidents: [
        {
          id: 'inc-01',
          stadiumId: 'stadium-metlife',
          title: 'Power spike sector 4',
          description: 'Minor electrical overload reported.',
          status: 'responding',
          severity: 'critical', // triggers high severity count > 0
          category: 'facility',
          location: 'Section 124',
          reporterName: 'Supervisor',
          timestamp: new Date().toISOString(),
          escalationLevel: 0,
        }
      ],
      notifications: [],
      currentUser: { name: 'Operations Officer', role: 'operations' },
    } as any);
  });

  test('renders closable critical alerts bar when critical incidents exist', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Critical Alert Bar should be rendered
    const alertBar = screen.getByText(/High-Severity Incidents currently require immediate tactical intervention./i);
    expect(alertBar).toBeInTheDocument();

    // Click the close/dismiss button
    const closeBtn = screen.getByLabelText(/Dismiss Alert Banner/i);
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);

    // The alert bar should be removed from the document
    expect(screen.queryByText(/High-Severity Incidents currently require immediate tactical intervention./i)).not.toBeInTheDocument();
  });
});
