import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateJob from '@/pages/jobs/CreateJob';
import { JobProvider } from '@/context/JobContext';
import { vi } from 'vitest';

// Increase timeout for async operations in this file
vi.setConfig({ testTimeout: 10000 });

const renderWithContext = (component) => {
  return render(
    <BrowserRouter>
      <JobProvider>
        {component}
      </JobProvider>
    </BrowserRouter>
  );
};

describe('CreateJob', () => {
  beforeEach(() => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      return null;
    });
  });

  it('renders the create job form', async () => {
    renderWithContext(<CreateJob />);
    expect(await screen.findByText('Create New Job')).toBeInTheDocument();
    
    // Check for teams being loaded from MSW
    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
    });
  });

  it('handles template auto-loading', async () => {
    renderWithContext(<CreateJob />);
    
    // Select a template
    // Wait for templates to load
    await screen.findByText(/Select a template/i);
    
    const select = screen.getByLabelText(/Load from Product Template/i);
    fireEvent.change(select, { target: { value: 'Circuit Board A' } });

    // Check if components/parts are pre-filled
    // With MSW, templates/match is called
    await waitFor(() => {
      expect(screen.getByText(/BOM Auto-Loaded/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Component Name/i)).toHaveValue('Resistor');
    });
  });

  it('submits the form successfully', async () => {
    renderWithContext(<CreateJob />);

    await screen.findByText('Create New Job');

    fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'New Test Product' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Team/i), { target: { value: 'Team Alpha' } });
    fireEvent.change(screen.getByLabelText(/Deadline/i), { target: { value: '2026-12-31' } });

    const submitBtn = screen.getByRole('button', { name: /Create Job/i });
    fireEvent.click(submitBtn);

    // Verify it starts submitting (button should show 'Creating Job...')
    await waitFor(() => {
      expect(screen.queryByText(/Creating Job.../i) || screen.queryByText(/Redirecting/i) || window.location.pathname === '/jobs').toBeTruthy();
    });
  });
});
