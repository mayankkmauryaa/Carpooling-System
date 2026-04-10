process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(10000);

afterAll(async () => {
  jest.clearAllMocks();
});
