# Database Unit Tests

This directory contains database unit tests that use **mongodb-memory-server** to run tests against an in-memory MongoDB instance. This is similar to what **dbunit** does for relational databases.

## Overview

Instead of mocking database operations, these tests run against a real MongoDB instance (in-memory), providing:

- ✅ **Real database operations** - Tests actual MongoDB queries and operations
- ✅ **Isolated test environment** - Each test gets a clean database
- ✅ **Fast execution** - In-memory database is faster than external connections
- ✅ **No external dependencies** - No need for a running MongoDB instance
- ✅ **Accurate testing** - Catches real database issues like schema validation, indexes, etc.

## Setup

The database testing utilities are located in `src/__tests__/utils/db-test-helper.ts`.

### Basic Usage

```typescript
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  seedTestDatabase,
} from '../utils/db-test-helper';
import { WorkflowModel } from '@/lib/models/Workflow';

describe('My Model Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase(); // Set up in-memory MongoDB
  });

  afterEach(async () => {
    await clearTestDatabase(); // Clear collections between tests
  });

  afterAll(async () => {
    await teardownTestDatabase(); // Clean up after all tests
  });

  it('should create a document', async () => {
    const workflow = new WorkflowModel({
      _id: 'test-1',
      userId: 'user-123',
      name: 'Test Workflow',
      // ... other fields
    });
    await workflow.save();

    const saved = await WorkflowModel.findById('test-1');
    expect(saved).toBeDefined();
  });
});
```

## Helper Functions

### Database Lifecycle

- **`setupTestDatabase()`** - Sets up in-memory MongoDB instance and connects Mongoose
- **`teardownTestDatabase()`** - Closes connection and stops MongoDB instance
- **`clearTestDatabase()`** - Clears all collections (useful between tests)

### Data Operations

- **`seedTestDatabase(data)`** - Seed database with test data
  ```typescript
  await seedTestDatabase({
    workflows: [
      { _id: '1', name: 'Workflow 1', ... },
      { _id: '2', name: 'Workflow 2', ... },
    ],
    automationrules: [
      { _id: '1', name: 'Rule 1', ... },
    ],
  });
  ```

- **`getTestCollection(name)`** - Get a collection for direct operations
- **`countDocuments(collection, filter)`** - Count documents matching filter
- **`findDocuments(collection, filter)`** - Find documents matching filter
- **`findOneDocument(collection, filter)`** - Find one document matching filter
- **`insertDocuments(collection, documents)`** - Insert documents
- **`deleteDocuments(collection, filter)`** - Delete documents matching filter
- **`updateDocuments(collection, filter, update)`** - Update documents

## Example Test Patterns

### Pattern 1: Basic CRUD Operations

```typescript
describe('Workflow CRUD', () => {
  beforeAll(async () => await setupTestDatabase());
  afterEach(async () => await clearTestDatabase());
  afterAll(async () => await teardownTestDatabase());

  it('should create, read, update, and delete', async () => {
    // Create
    const workflow = new WorkflowModel({ _id: '1', name: 'Test' });
    await workflow.save();

    // Read
    const found = await WorkflowModel.findById('1');
    expect(found?.name).toBe('Test');

    // Update
    await WorkflowModel.findByIdAndUpdate('1', { name: 'Updated' });
    const updated = await WorkflowModel.findById('1');
    expect(updated?.name).toBe('Updated');

    // Delete
    await WorkflowModel.findByIdAndDelete('1');
    const deleted = await WorkflowModel.findById('1');
    expect(deleted).toBeNull();
  });
});
```

### Pattern 2: Seeding Test Data

```typescript
describe('Workflow Queries', () => {
  beforeAll(async () => await setupTestDatabase());
  afterEach(async () => await clearTestDatabase());
  afterAll(async () => await teardownTestDatabase());

  beforeEach(async () => {
    await seedTestDatabase({
      workflows: [
        { _id: '1', userId: 'user-1', name: 'Workflow 1', isActive: true },
        { _id: '2', userId: 'user-1', name: 'Workflow 2', isActive: false },
        { _id: '3', userId: 'user-2', name: 'Workflow 3', isActive: true },
      ],
    });
  });

  it('should find workflows by user', async () => {
    const workflows = await WorkflowModel.find({ userId: 'user-1' });
    expect(workflows).toHaveLength(2);
  });
});
```

### Pattern 3: Complex Queries

```typescript
it('should find workflows with automation rule nodes', async () => {
  await seedTestDatabase({
    workflows: [
      {
        _id: '1',
        nodes: [{ type: 'automation_rule', data: { ruleId: 'rule-1' } }],
      },
      {
        _id: '2',
        nodes: [{ type: 'trigger' }],
      },
    ],
  });

  const workflowsWithRules = await WorkflowModel.find({
    'nodes.type': 'automation_rule',
  });

  expect(workflowsWithRules).toHaveLength(1);
});
```

## When to Use Database Tests vs Mocks

### Use Database Tests When:
- ✅ Testing model schemas and validation
- ✅ Testing complex queries and aggregations
- ✅ Testing database relationships and references
- ✅ Testing indexes and performance
- ✅ Testing actual data persistence
- ✅ Integration testing with database

### Use Mocks When:
- ✅ Testing API routes in isolation
- ✅ Testing business logic without database
- ✅ Fast unit tests that don't need database
- ✅ Testing error handling without database setup

## Running Database Tests

```bash
# Run all database tests
npm test -- src/__tests__/database

# Run specific test file
npm test -- src/__tests__/database/workflow.test.ts

# Run with coverage
npm run test:coverage -- src/__tests__/database
```

## Best Practices

1. **Always clean up** - Use `clearTestDatabase()` in `afterEach` to ensure test isolation
2. **Use descriptive test data** - Make test data clearly identifiable
3. **Test edge cases** - Test with null, empty arrays, missing fields, etc.
4. **Test validation** - Verify schema validation works correctly
5. **Test relationships** - If models reference each other, test those relationships
6. **Keep tests fast** - Database tests are slower than mocks, so use them judiciously

## Troubleshooting

### Tests hanging
- Make sure you're calling `teardownTestDatabase()` in `afterAll`
- Check for unclosed database connections

### Data persisting between tests
- Ensure `clearTestDatabase()` is called in `afterEach`
- Check that you're not reusing IDs between tests

### Connection errors
- Verify `mongodb-memory-server` is installed
- Check that MongoDB binary is downloaded (first run may take time)

## References

- [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server)
- [Mongoose Testing Guide](https://mongoosejs.com/docs/jest.html)
- [Jest MongoDB Setup](https://jestjs.io/docs/getting-started)




