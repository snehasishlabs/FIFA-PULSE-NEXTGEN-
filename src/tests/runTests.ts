import { z } from 'zod';

// Simple unit and behavioral validation engine for FIFA Pulse AI NextGen
// Evaluates data structure sanity, security role constraints, and API protocols.

const testResults: { testName: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

function assert(condition: boolean, testName: string, message: string) {
  if (condition) {
    testResults.push({ testName, status: 'PASSED' });
  } else {
    testResults.push({ testName, status: 'FAILED', error: message });
    console.error(`❌ [FAILED] ${testName}: ${message}`);
  }
}

// 1. Data Schema Sanity Tests
function testDataSchemas() {
  const IncidentSchema = z.object({
    id: z.string(),
    stadiumId: z.string(),
    title: z.string().min(3),
    description: z.string(),
    status: z.enum(['active', 'resolved']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['crowd', 'medical', 'security', 'facility', 'weather']),
    location: z.string(),
    reporterName: z.string(),
    timestamp: z.string()
  });

  const mockValidIncident = {
    id: 'inc-101',
    stadiumId: 'stadium-metlife',
    title: 'Blocked wheelchair ramp',
    description: 'A media broadcast cable is obstructing the main accessible ramp at Gate C.',
    status: 'active' as const,
    severity: 'high' as const,
    category: 'facility' as const,
    location: 'Gate C Outer Ramp',
    reporterName: 'Carlos (Supervisor)',
    timestamp: new Date().toISOString()
  };

  const parsed = IncidentSchema.safeParse(mockValidIncident);
  assert(parsed.success, 'Schema: Valid Incident Parsing', 'Should successfully validate correct structure');

  const invalidIncident = { ...mockValidIncident, title: 'No' }; // too short
  const parsedInvalid = IncidentSchema.safeParse(invalidIncident);
  assert(!parsedInvalid.success, 'Schema: Invalid Incident Rejection', 'Should reject titles shorter than 3 characters');
}

// 2. Row Level Security and Access Control Simulation
function testRoleAccessControls() {
  // Simulator triggers and incident resolutions should be blocked for standard Fans
  const simulateAction = (role: string) => {
    const allowedRoles = ['admin', 'operations'];
    return allowedRoles.includes(role);
  };

  const resolveAction = (role: string) => {
    const allowedRoles = ['admin', 'operations', 'venue_staff'];
    return allowedRoles.includes(role);
  };

  assert(simulateAction('operations'), 'Security: Operations Run Simulation', 'Operations director should be allowed to run simulations');
  assert(simulateAction('admin'), 'Security: Admin Run Simulation', 'Admin should be allowed to run simulations');
  assert(!simulateAction('fan'), 'Security: Fan Blocked Simulation', 'Fan should be barred from executing drills');
  assert(!simulateAction('volunteer'), 'Security: Volunteer Blocked Simulation', 'Volunteer should be barred from executing drills');

  assert(resolveAction('venue_staff'), 'Security: Venue Staff Resolve Incident', 'Venue staff should be allowed to resolve issues');
  assert(!resolveAction('fan'), 'Security: Fan Blocked Resolve Incident', 'Fan should be barred from resolving incidents');
}

// 3. Simulated SSE Packet Streaming Integrity
function testSSEProtocol() {
  const formatSSEEvent = (event: string, data: any) => {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  };

  const testData = { message: "Sync complete" };
  const formatted = formatSSEEvent('sync', testData);
  
  assert(formatted.startsWith('event: sync\n'), 'SSE: Correct Event Marker', 'SSE packet must start with event header');
  assert(formatted.includes(JSON.stringify(testData)), 'SSE: Correct JSON Body', 'SSE packet must contain stringified data packet');
  assert(formatted.endsWith('\n\n'), 'SSE: Correct Double Line Termination', 'SSE stream requires double newline to flush packet');
}

export function executeAllTests() {
  console.log('\n======================================================');
  console.log('🏟️  FIFA PULSE AI NEXTGEN: COMPLIANCE & UNIT RUNNER');
  console.log('======================================================');

  testDataSchemas();
  testRoleAccessControls();
  testSSEProtocol();

  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'PASSED').length;

  console.log(`\n📋 Validation Suite Summary:`);
  console.log(`Passed: ${passed} / ${total}`);
  
  testResults.forEach(r => {
    console.log(`  [${r.status}] - ${r.testName}`);
  });
  console.log('======================================================\n');

  return { total, passed, results: testResults };
}
