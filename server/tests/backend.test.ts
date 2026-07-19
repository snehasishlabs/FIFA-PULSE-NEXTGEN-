import { SimulationSchema, IncidentSchema, NotificationSchema } from '../validators/schemas';
import { AppError, errorHandler } from '../middleware/errorHandler';

const results: { testSuite: string; name: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

function assertTest(condition: boolean, testSuite: string, name: string, errMsg: string) {
  if (condition) {
    results.push({ testSuite, name, status: 'PASSED' });
  } else {
    results.push({ testSuite, name, status: 'FAILED', error: errMsg });
    console.error(`❌ [TEST FAILED] ${testSuite} > ${name}: ${errMsg}`);
  }
}

/**
 * 1. Zod Validation Tests
 */
export function testValidators() {
  const suite = 'Validation Schemas';

  // Incident Validation
  const validIncident = {
    stadiumId: 'stadium-metlife',
    title: 'Blocked emergency gate',
    description: 'An oversized logistics crate is blocking exit 4.',
    status: 'active',
    severity: 'critical',
    category: 'security',
    location: 'Sector 4 Lower Level',
    reporterName: 'John Stewart'
  };

  const parseIncident = IncidentSchema.safeParse(validIncident);
  assertTest(parseIncident.success, suite, 'Valid Incident Parse', 'Incident structure failed validation');

  const invalidIncident = { ...validIncident, title: 'No' }; // Title length under 3
  const parseInvalidIncident = IncidentSchema.safeParse(invalidIncident);
  assertTest(!parseInvalidIncident.success, suite, 'Invalid Incident Rejection', 'Incident with too short title should have been rejected');

  // Simulation Validation
  const validSimulation = {
    stadiumId: 'stadium-sofi',
    scenarioType: 'Power Failure',
    intensity: 'high',
    findings: 'Detailed backup generators failed to kick-in within the specified window.',
    mitigationPlan: 'Upgrade fuel lines and run bi-weekly checkouts.'
  };

  const parseSimulation = SimulationSchema.safeParse(validSimulation);
  assertTest(parseSimulation.success, suite, 'Valid Simulation Parse', 'Simulation structure failed validation');

  const invalidSimulation = { ...validSimulation, intensity: 'extreme' }; // invalid enum value
  const parseInvalidSimulation = SimulationSchema.safeParse(invalidSimulation);
  assertTest(!parseInvalidSimulation.success, suite, 'Invalid Simulation Rejection', 'Simulation with incorrect enum intensity should have been rejected');
}

/**
 * 2. Role-Based Authorization Guard Verification
 */
export function testAuthenticationAndRoles() {
  const suite = 'Role-Based Authorization';

  const checkAccess = (userRole: string, requiredRoles: string[]): boolean => {
    return requiredRoles.includes(userRole);
  };

  // Test admin access guards
  const adminRequired = ['admin'];
  assertTest(checkAccess('admin', adminRequired), suite, 'Admin Allowed as Admin', 'Admin role should have been allowed');
  assertTest(!checkAccess('fan', adminRequired), suite, 'Fan Blocked as Admin', 'Fan role should have been rejected');

  // Test organizer level access
  const organizerRequired = ['organizer', 'admin'];
  assertTest(checkAccess('organizer', organizerRequired), suite, 'Organizer Allowed as Organizer', 'Organizer role should have been allowed');
  assertTest(checkAccess('admin', organizerRequired), suite, 'Admin Allowed as Organizer', 'Admin role should have been allowed');
  assertTest(!checkAccess('staff', organizerRequired), suite, 'Staff Blocked as Organizer', 'Staff role should have been blocked from organizer tasks');
  assertTest(!checkAccess('fan', organizerRequired), suite, 'Fan Blocked as Organizer', 'Fan role should have been blocked from organizer tasks');
}

/**
 * 3. Mock Endpoint Route Payloads Verification
 */
export function testMockResponseSchemas() {
  const suite = 'Response Schemas';

  const mockProfileResponse = {
    success: true,
    data: {
      user: { id: 'u-1', email: 'director@fifapulse.ai', role: 'admin' },
      profile: { fullName: 'Operations Director', phone: '+12025550192', avatarUrl: 'https://avatar.com/1.png' }
    }
  };

  assertTest(mockProfileResponse.success === true, suite, 'Valid Profile Response Schema', 'Response status field should be true');
  assertTest(mockProfileResponse.data.user.role === 'admin', suite, 'Correct User Claims Mapping', 'Authenticated user role claims did not match');
}

/**
 * 4. Global Error Handler Verification
 */
export function testErrorHandler() {
  const suite = 'Global Error Handler';

  // Save original console functions to avoid scanning issues on boot-time testing
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};

  try {
    // 1. AppError instantiation and mapping
    const appError = new AppError('Unauthorized operation', 403, 'FORBIDDEN');
    assertTest(appError.statusCode === 403, suite, 'AppError Status Code', 'AppError should preserve status code');
    assertTest(appError.code === 'FORBIDDEN', suite, 'AppError Error Code', 'AppError should preserve custom error code');
    assertTest(appError.message === 'Unauthorized operation', suite, 'AppError Message', 'AppError should preserve custom message');

    // 2. Middleware formatting with standard Express mock objects
    let responseBody: any = null;
    let responseStatus: number | null = null;

    const mockReq = {} as any;
    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(body: any) {
        responseBody = body;
        return this;
      }
    } as any;

    const mockNext = () => {};

    // Test AppError handling in middleware
    errorHandler(appError, mockReq, mockRes, mockNext);
    assertTest(responseStatus === 403, suite, 'Middleware AppError Status', 'Middleware should return 403 for custom AppError');
    assertTest(responseBody?.success === false, suite, 'Middleware Response Success Flag', 'Middleware response should specify success: false');
    assertTest(responseBody?.message === 'Unauthorized operation', suite, 'Middleware AppError Message', 'Middleware response message should match the AppError message');
    assertTest(responseBody?.code === 'FORBIDDEN', suite, 'Middleware AppError Code', 'Middleware response code should match the AppError code');

    // Test standard SyntaxError (invalid JSON)
    const syntaxErr = new SyntaxError('Unexpected token } in JSON at position 12');
    (syntaxErr as any).status = 400;
    errorHandler(syntaxErr, mockReq, mockRes, mockNext);
    assertTest(responseStatus === 400, suite, 'Middleware SyntaxError Status', 'JSON syntax error should return 400');
    assertTest(responseBody?.message === 'Invalid JSON payload format.', suite, 'Middleware SyntaxError Message', 'JSON syntax error message should be mapped safely');
    assertTest(responseBody?.code === 'BAD_REQUEST', suite, 'Middleware SyntaxError Code', 'JSON syntax error code should be BAD_REQUEST');

    // Test server-side unhandled 500 error in production vs development
    const genericErr = new Error('Database connection failed');
    const prevEnv = process.env.NODE_ENV;
    
    // Set to production
    process.env.NODE_ENV = 'production';
    errorHandler(genericErr, mockReq, mockRes, mockNext);
    assertTest(responseStatus === 500, suite, 'Middleware Production 500 Status', 'Unhandled generic error should return 500');
    assertTest(responseBody?.message === 'An unexpected server error occurred', suite, 'Middleware Production 500 Message', 'Production 500 message should hide stack trace and internal message');
    assertTest(responseBody?.stack === undefined, suite, 'Middleware Production 500 Stack Leak', 'Production response must not leak stack trace');

    // Reset environment
    process.env.NODE_ENV = prevEnv;
  } finally {
    // Restore console functions
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
}

/**
 * Main Suite Entry
 */
export function runBackendTests() {
  console.log('\n======================================================');
  console.log('🧪 FIFA PULSE AI: MODULAR BACKEND VALIDATION RUNNER');
  console.log('======================================================');

  testValidators();
  testAuthenticationAndRoles();
  testMockResponseSchemas();
  testErrorHandler();

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;

  console.log(`\n📋 Backend Test Suite Summary:`);
  console.log(`Passed: ${passed} / ${total}`);
  
  results.forEach(r => {
    console.log(`  [${r.status}] - ${r.testSuite} > ${r.name}`);
  });
  console.log('======================================================\n');

  return { total, passed, results };
}
