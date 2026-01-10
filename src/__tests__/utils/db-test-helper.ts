/**
 * Database Testing Utility
 * Provides MongoDB in-memory database for unit tests using mongodb-memory-server
 * Similar to dbunit for relational databases
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Setup in-memory MongoDB instance for testing
 * Call this in beforeEach or beforeAll
 */
export async function setupTestDatabase(): Promise<string> {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'test-db',
    },
    binary: {
      version: '7.0.0', // Use a specific MongoDB version for consistency
    },
  });

  const mongoUri = mongoServer.getUri();
  
  // Connect mongoose to the in-memory database
  await mongoose.connect(mongoUri);
  
  return mongoUri;
}

/**
 * Clean up test database
 * Call this in afterEach or afterAll
 */
export async function teardownTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clear all collections in the test database
 * Useful for cleaning up between tests
 */
export async function clearTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Seed test database with data
 * @param seedData - Object mapping collection names to arrays of documents
 */
export async function seedTestDatabase(seedData: Record<string, any[]>): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    throw new Error('Database not connected. Call setupTestDatabase() first.');
  }

  for (const [collectionName, documents] of Object.entries(seedData)) {
    const collection = mongoose.connection.collection(collectionName);
    if (documents.length > 0) {
      await collection.insertMany(documents);
    }
  }
}

/**
 * Get a collection from the test database
 */
export function getTestCollection(collectionName: string) {
  if (mongoose.connection.readyState === 0) {
    throw new Error('Database not connected. Call setupTestDatabase() first.');
  }
  return mongoose.connection.collection(collectionName);
}

/**
 * Count documents in a collection
 */
export async function countDocuments(collectionName: string, filter: any = {}): Promise<number> {
  const collection = getTestCollection(collectionName);
  return await collection.countDocuments(filter);
}

/**
 * Find documents in a collection
 */
export async function findDocuments(collectionName: string, filter: any = {}): Promise<any[]> {
  const collection = getTestCollection(collectionName);
  return await collection.find(filter).toArray();
}

/**
 * Find one document in a collection
 */
export async function findOneDocument(collectionName: string, filter: any = {}): Promise<any | null> {
  const collection = getTestCollection(collectionName);
  return await collection.findOne(filter);
}

/**
 * Insert documents into a collection
 */
export async function insertDocuments(collectionName: string, documents: any[]): Promise<void> {
  const collection = getTestCollection(collectionName);
  if (documents.length > 0) {
    await collection.insertMany(documents);
  }
}

/**
 * Delete documents from a collection
 */
export async function deleteDocuments(collectionName: string, filter: any = {}): Promise<number> {
  const collection = getTestCollection(collectionName);
  const result = await collection.deleteMany(filter);
  return result.deletedCount || 0;
}

/**
 * Update documents in a collection
 */
export async function updateDocuments(
  collectionName: string,
  filter: any,
  update: any
): Promise<number> {
  const collection = getTestCollection(collectionName);
  const result = await collection.updateMany(filter, update);
  return result.modifiedCount || 0;
}

/**
 * Jest setup/teardown helpers for database tests
 */
export const dbTestHelpers = {
  /**
   * Use in beforeEach to set up database for each test
   */
  beforeEach: async () => {
    await setupTestDatabase();
  },

  /**
   * Use in afterEach to clean up database after each test
   */
  afterEach: async () => {
    await clearTestDatabase();
  },

  /**
   * Use in afterAll to tear down database after all tests
   */
  afterAll: async () => {
    await teardownTestDatabase();
  },

  /**
   * Use in beforeAll to set up database once for all tests
   */
  beforeAll: async () => {
    await setupTestDatabase();
  },
};




