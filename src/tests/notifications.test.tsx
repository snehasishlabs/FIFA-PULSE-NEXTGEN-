import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import NotificationPanel from '../features/notifications/NotificationPanel';
import { Notification } from '../types';

describe('NotificationPanel Module Tests', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-01',
      title: 'Gate C Bottleneck Alarm',
      message: 'Gate C queue scan times exceed 45 seconds.',
      type: 'incident',
      priority: 'high',
      isRead: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: 'notif-02',
      title: 'Severe Crowd Accumulation Sector 12',
      message: 'Surge in zone 12 upper gate corridor.',
      type: 'ai_warning',
      priority: 'critical',
      isRead: false,
      escalationWorkflow: 'Deploy backup rapid-stewards to sector entrance immediately.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'notif-03',
      title: 'Weather Shelter Operations',
      message: 'Pre-drill weather shelters are active.',
      type: 'incident',
      priority: 'low',
      isRead: true, // already read
      timestamp: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders active alarm notification items, details, and priority badges', () => {
    render(
      <NotificationPanel
        notifications={mockNotifications}
        markNotificationRead={vi.fn()}
        clearAllNotifications={vi.fn()}
      />
    );

    // Active high-priority alarm
    expect(screen.getByText('Gate C Bottleneck Alarm')).toBeInTheDocument();
    expect(screen.getByText('Gate C queue scan times exceed 45 seconds.')).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();

    // Active critical-priority alarm with escalation workflow
    expect(screen.getByText('Severe Crowd Accumulation Sector 12')).toBeInTheDocument();
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByText('ESCALATION DRILL ACTIVATED:')).toBeInTheDocument();
    expect(screen.getByText('Deploy backup rapid-stewards to sector entrance immediately.')).toBeInTheDocument();

    // Already dismissed alarm should render in history section
    expect(screen.getByText('Dismissed Logs History')).toBeInTheDocument();
    expect(screen.getByText('Weather Shelter Operations')).toBeInTheDocument();
    expect(screen.getByText('ACKNOWLEDGED')).toBeInTheDocument();
  });

  test('calls markNotificationRead when specific dismiss button is clicked', () => {
    const mockMarkRead = vi.fn().mockResolvedValue(true);
    render(
      <NotificationPanel
        notifications={mockNotifications}
        markNotificationRead={mockMarkRead}
        clearAllNotifications={vi.fn()}
      />
    );

    // Dismiss first notification
    const dismissBtns = screen.getAllByRole('button', { name: /Dismiss Alert/i });
    expect(dismissBtns).toHaveLength(2); // Two active notifications

    fireEvent.click(dismissBtns[0]);
    expect(mockMarkRead).toHaveBeenCalledWith('notif-01');
  });

  test('calls clearAllNotifications when Clear Alerts button is clicked', () => {
    const mockClearAll = vi.fn().mockResolvedValue(true);
    render(
      <NotificationPanel
        notifications={mockNotifications}
        markNotificationRead={vi.fn()}
        clearAllNotifications={mockClearAll}
      />
    );

    const clearBtn = screen.getByRole('button', { name: /Clear Alerts/i });
    fireEvent.click(clearBtn);

    expect(mockClearAll).toHaveBeenCalled();
  });

  test('renders placeholder empty state when no active alarms are present', () => {
    render(
      <NotificationPanel
        notifications={[]}
        markNotificationRead={vi.fn()}
        clearAllNotifications={vi.fn()}
      />
    );

    expect(screen.getByText('No Active Alarms')).toBeInTheDocument();
    expect(screen.getByText(/All stadium operations systems are within optimal parameters./i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Clear Alerts/i })).toBeNull();
  });
});
