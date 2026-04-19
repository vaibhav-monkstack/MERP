import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManagerDashboard from '@/pages/jobs/ManagerDashboard';
import { JobProvider } from '@/context/JobContext';
import { vi } from 'vitest';

const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      <JobProvider>
        {component}
      </JobProvider>
    </BrowserRouter>
  );
};

describe('ManagerDashboard', () => {
  beforeEach(() => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'role') return 'Job Manager';
      return null;
    });
  });

  it('renders stats correctly', async () => {
    renderWithContext(<ManagerDashboard />);

    expect(await screen.findByTestId('stat-title-total-jobs')).toBeInTheDocument();
    expect(screen.getByTestId('stat-value-total-jobs')).toHaveTextContent('2');
  });

  it('searches for jobs', async () => {
    renderWithContext(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Circuit Board A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: 'Circuit' } });

    expect(screen.getByText('Circuit Board A')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Control Unit')).not.toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    renderWithContext(<ManagerDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Circuit Board A')).toBeInTheDocument();
    });

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'Production' } });

    expect(screen.getByText('Circuit Board A')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Control Unit')).not.toBeInTheDocument();
    });
  });
});
