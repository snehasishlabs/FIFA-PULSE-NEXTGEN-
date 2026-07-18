import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AIAssistant from '../features/ai-assistant/AIAssistant';
import { Stadium, AIRecommendation } from '../types';

describe('AIAssistant AI Copilot Module Tests', () => {
  const mockStadium: Stadium = {
    id: 'stadium-metlife',
    name: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    capacity: 82500,
    latitude: 40.8135,
    longitude: -74.0744,
  };

  const mockRecommendations: AIRecommendation[] = [
    {
      id: 'rec-01',
      category: 'logistics',
      insight: 'Severe entry backup detected at Gate B outer plaza.',
      actionPlan: [
        'Activate dynamic electronic signage at Gate B rail approach.',
        'Mobilize 3 auxiliary steward teams to Gate B entrance corridor.'
      ],
      priority: 'high',
      confidenceScore: 94,
      isApplied: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'rec-02',
      category: 'crowd_control',
      insight: 'Extreme high density surge sector 12.',
      actionPlan: ['Open section gates 12-A and 12-B.'],
      priority: 'critical',
      confidenceScore: 98,
      isApplied: true, // applied
      timestamp: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders active and applied GenAI directives correctly', () => {
    render(
      <AIAssistant
        activeStadium={mockStadium}
        recommendations={mockRecommendations}
        userRole="operations"
        applyRecommendation={vi.fn()}
      />
    );

    // Active Directive Info
    expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    expect(screen.getByText('94% Confidence')).toBeInTheDocument();
    expect(screen.getByText('Severe entry backup detected at Gate B outer plaza.')).toBeInTheDocument();
    expect(screen.getByText('Activate dynamic electronic signage at Gate B rail approach.')).toBeInTheDocument();

    // Applied/Executed Directives section
    expect(screen.getByText(/Recently Executed Directives/i)).toBeInTheDocument();
    expect(screen.getByText('Extreme high density surge sector 12.')).toBeInTheDocument();
    expect(screen.getByText('DEPLOYED')).toBeInTheDocument();
  });

  test('allows operations/admin to deploy dynamic action plans', async () => {
    const mockApplyRecommendation = vi.fn().mockResolvedValue(true);
    render(
      <AIAssistant
        activeStadium={mockStadium}
        recommendations={mockRecommendations}
        userRole="operations"
        applyRecommendation={mockApplyRecommendation}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /Apply Action Plan/i });
    fireEvent.click(applyBtn);

    expect(mockApplyRecommendation).toHaveBeenCalledWith('rec-01');
  });

  test('handles successful chat interaction with GenAI server', async () => {
    // Mock the backend chat API success route
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'I have dispatched additional staff to Gate B based on scan latency.' })
    });
    globalThis.fetch = mockFetch;

    render(
      <AIAssistant
        activeStadium={mockStadium}
        recommendations={[]}
        userRole="operations"
        applyRecommendation={vi.fn()}
      />
    );

    // Query welcome greeting
    expect(screen.getByText(/Hello! I am your/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Request crowd directives, dispatch/i);
    const sendBtn = screen.getByRole('button');

    // Type and send message
    fireEvent.change(input, { target: { value: 'Staff status at Gate B' } });
    fireEvent.click(sendBtn);

    // Check user text rendered
    expect(screen.getByText('Staff status at Gate B')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai-assistant/chat', expect.any(Object));
      expect(screen.getByText('I have dispatched additional staff to Gate B based on scan latency.')).toBeInTheDocument();
    });
  });

  test('gracefully recovers from chat dispatch API failure with local contingency answer', async () => {
    // Mock the backend chat API error route
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    globalThis.fetch = mockFetch;

    render(
      <AIAssistant
        activeStadium={mockStadium}
        recommendations={[]}
        userRole="operations"
        applyRecommendation={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/Request crowd directives, dispatch/i);
    const sendBtn = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'System latency is high' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/I experienced an offline latency connection issue./i)).toBeInTheDocument();
    });
  });
});
