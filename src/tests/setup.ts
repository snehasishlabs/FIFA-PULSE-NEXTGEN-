import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock matchMedia for components checking media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver;

// Mock EventSource for Supabase/SSE Realtime Stream
class MockEventSource {
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Fast mock connect
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 10);
  }

  close() {
    this.readyState = 2;
  }
}
globalThis.EventSource = MockEventSource as any;

// Mock @vis.gl/react-google-maps to prevent API provider loading errors
vi.mock('@vis.gl/react-google-maps', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    APIProvider: ({ children }: any) => children,
    Map: ({ children, id, ...props }: any) => 
      React.createElement('div', { 'data-testid': `google-map-${id || 'default'}`, ...props }, children),
    Marker: (props: any) => 
      React.createElement('div', { 'data-testid': 'map-marker', ...props }),
    AdvancedMarker: (props: any) => 
      React.createElement('div', { 'data-testid': 'advanced-map-marker', ...props }),
    Pin: (props: any) => 
      React.createElement('div', { 'data-testid': 'map-pin', ...props }),
    useMap: () => ({
      fitBounds: vi.fn(),
    }),
  };
});

// Mock Recharts
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => children,
    BarChart: ({ children, ...props }: any) => 
      React.createElement('div', { 'data-testid': 'bar-chart', ...props }, children),
    Bar: (props: any) => React.createElement('div', { 'data-testid': 'bar', ...props }),
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
  };
});

// Setup standard global fetch mock
const mockFetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  } as Response)
);
globalThis.fetch = mockFetch;

// Mock google maps namespace
(globalThis as any).google = {
  maps: {
    Polyline: vi.fn().mockImplementation(function() {
      return {
        setMap: vi.fn(),
      };
    }),
    LatLng: vi.fn(),
    LatLngBounds: vi.fn().mockImplementation(function() {
      return {
        extend: vi.fn(),
      };
    }),
    fitBounds: vi.fn(),
  }
};
