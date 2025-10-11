// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock NextAuth.js early to avoid import errors
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock MongoDB connections
jest.mock('@/lib/db/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/db/connection', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}))

// Mock all Mongoose models
const createMockModel = () => {
  const model = jest.fn().mockImplementation(function(data) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data),
      _id: data._id || 'mock-id',
    }
  })
  
  model.find = jest.fn()
  model.findOne = jest.fn()
  model.findById = jest.fn()
  model.findOneAndUpdate = jest.fn()
  model.findOneAndDelete = jest.fn()
  model.create = jest.fn()
  model.updateOne = jest.fn()
  model.deleteOne = jest.fn()
  
  return { __esModule: true, default: model }
}

// Health models
jest.mock('@/lib/db/models/Prescription', () => createMockModel())
jest.mock('@/lib/db/models/Appointment', () => createMockModel())
jest.mock('@/lib/db/models/HealthProvider', () => createMockModel())

// Insurance models
jest.mock('@/lib/db/models/InsurancePolicy', () => createMockModel())
jest.mock('@/lib/db/models/InsuranceClaim', () => createMockModel())
jest.mock('@/lib/db/models/InsuranceProvider', () => createMockModel())

// Legal models
jest.mock('@/lib/db/models/LegalCase', () => createMockModel())
jest.mock('@/lib/db/models/LegalDocument', () => createMockModel())
jest.mock('@/lib/db/models/LegalAppointment', () => createMockModel())
jest.mock('@/lib/db/models/LawFirm', () => createMockModel())

// Tax models
jest.mock('@/lib/db/models/TaxReturn', () => createMockModel())
jest.mock('@/lib/db/models/TaxDeduction', () => createMockModel())
jest.mock('@/lib/db/models/TaxProfessional', () => createMockModel())

// Travel models
jest.mock('@/lib/db/models/Trip', () => createMockModel())
jest.mock('@/lib/db/models/TravelBooking', () => createMockModel())
jest.mock('@/lib/db/models/TravelItinerary', () => createMockModel())

// Investment models
jest.mock('@/lib/db/models/Portfolio', () => createMockModel())
jest.mock('@/lib/db/models/Holding', () => createMockModel())
jest.mock('@/lib/db/models/InvestmentTransaction', () => createMockModel())
jest.mock('@/lib/db/models/Watchlist', () => createMockModel())
jest.mock('@/lib/db/models/Dividend', () => createMockModel())

// Other models
jest.mock('@/lib/db/models/User', () => createMockModel())
jest.mock('@/lib/db/models/Expense', () => createMockModel())
jest.mock('@/lib/db/models/Transaction', () => createMockModel())
jest.mock('@/lib/db/models/Budget', () => createMockModel())
jest.mock('@/lib/db/models/Message', () => createMockModel())
jest.mock('@/lib/db/models/ChatSession', () => createMockModel())
jest.mock('@/lib/db/models/Account', () => createMockModel())

// Mock Web APIs for Node.js environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this._url = input
      this._method = init?.method || 'GET'
      this._headers = new Map(Object.entries(init?.headers || {}))
      this._body = init?.body
    }
    
    get url() {
      return this._url
    }
    
    get method() {
      return this._method
    }
    
    get headers() {
      return this._headers
    }
    
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
    
    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body
      this._status = init?.status || 200
      this._statusText = init?.statusText || 'OK'
      this._headers = new Map(Object.entries(init?.headers || {}))
    }
    
    get status() {
      return this._status
    }
    
    get statusText() {
      return this._statusText
    }
    
    get headers() {
      return this._headers
    }
    
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
    }
    
    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers extends Map {
    get(name) {
      return super.get(name.toLowerCase())
    }
    
    set(name, value) {
      return super.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return super.has(name.toLowerCase())
    }
  }
}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    }),
  },
  NextRequest: global.Request,
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
