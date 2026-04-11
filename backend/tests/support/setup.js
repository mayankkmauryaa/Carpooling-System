process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_unit_testing_only_not_for_production_use';
process.env.JWT_EXPIRES_IN = '1h';

jest.setTimeout(10000);

afterAll(async () => {
  jest.clearAllMocks();
});
