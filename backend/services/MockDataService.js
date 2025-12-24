const { faker } = require('@faker-js/faker');

// In-memory storage for mock data
const mockStorage = new Map();

// Mock data generators
const MockDataService = {
  // Generate a single user
  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement(['Member', 'Admin', 'SuperAdmin']),
    avatar: faker.image.avatar(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  }),

  // Generate a single product
  product: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    imageUrl: faker.image.url(),
    inStock: faker.datatype.boolean(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  }),

  // Generate a single order
  order: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
    total: parseFloat(faker.commerce.price(100, 1000)),
    items: MockDataService.list(() => ({
      productId: faker.string.uuid(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      price: parseFloat(faker.commerce.price())
    }), faker.number.int({ min: 1, max: 5 })),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides
  }),

  // Generate a list of items
  list: (generator, count) => {
    return Array.from({ length: count }, () => generator());
  },

  // Persist data in memory
  persist: (collection, data) => {
    if (!mockStorage.has(collection)) {
      mockStorage.set(collection, []);
    }
    const items = mockStorage.get(collection);
    const existingIndex = items.findIndex(item => item.id === data.id);

    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...data };
      return items[existingIndex];
    } else {
      items.push(data);
      return data;
    }
  },

  // Find all items in a collection
  findAll: (collection) => {
    return mockStorage.get(collection) || [];
  },

  // Find item by ID in a collection
  findById: (collection, id) => {
    const items = mockStorage.get(collection) || [];
    return items.find(item => item.id === id) || null;
  },

  // Remove item from collection
  remove: (collection, id) => {
    const items = mockStorage.get(collection) || [];
    const filtered = items.filter(item => item.id !== id);
    mockStorage.set(collection, filtered);
    return true;
  },

  // Clear all mock data
  clear: () => {
    mockStorage.clear();
  },

  // Clear specific collection
  clearCollection: (collection) => {
    mockStorage.delete(collection);
  }
};

module.exports = MockDataService;
