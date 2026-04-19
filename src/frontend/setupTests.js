import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the context globally
vi.mock('./src/context/JobContext', () => ({
  useJobs: () => ({
    addJob: vi.fn(),
    fetchPendingOrders: vi.fn(),
    getJobById: vi.fn(() => ({ id: 'JOB-123', product: 'Test Product', quantity: 10, team: 'Team A' })),
    updateJob: vi.fn(),
    jobs: [],
  }),
  JobProvider: ({ children }) => children,
}));

// Mock react-router-dom globally
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ state: null }),
  useParams: () => ({ id: 'JOB-123' }),
  BrowserRouter: ({ children }) => children,
}));

// Mock API globally
vi.mock('./src/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));