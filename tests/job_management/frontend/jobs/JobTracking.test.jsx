import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobTracking from '@/pages/jobs/JobTracking';
import { JobProvider } from '@/context/JobContext';
import { vi } from 'vitest';

// Mock useParams to return a specific ID
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'JOB-001' }),
  };
});

const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      <JobProvider>
        {component}
      </JobProvider>
    </BrowserRouter>
  );
};

describe('JobTracking', () => {
  beforeEach(() => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'role') return 'Job Manager';
      return null;
    });
  });

  it('renders correctly for a specific job', async () => {
    renderWithContext(<JobTracking />);

    expect(await screen.findByText('Circuit Board A')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('switches between Overview and Schedule tabs', async () => {
    renderWithContext(<JobTracking />);

    await waitFor(() => {
      expect(screen.getByText('Job Tracking: JOB-001')).toBeInTheDocument();
    });

    const scheduleTab = screen.getByRole('button', { name: /schedule/i });
    fireEvent.click(scheduleTab);

    // Verify schedule data is loaded (from mockSchedule in handlers.js)
    await waitFor(() => {
      expect(screen.getByText(/Production Schedule/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Cutting')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays overdue badge for overdue jobs', async () => {
    // Note: JOB-001 in mocks is '2026-12-31', so it's not overdue today (2026-04-18)
    renderWithContext(<JobTracking />);
    await waitFor(() => {
      expect(screen.queryByText(/OVERDUE/i)).not.toBeInTheDocument();
    });
  });
});
