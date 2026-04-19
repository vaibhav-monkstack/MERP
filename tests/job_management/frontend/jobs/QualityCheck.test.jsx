import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QualityCheck from '@/pages/jobs/QualityCheck';
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

describe('QualityCheck', () => {
  beforeEach(() => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'mock-token';
      return null;
    });
  });

  it('renders correctly for a specific job', async () => {
    renderWithContext(<QualityCheck />);

    expect(await screen.findByText('Circuit Board A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Inspector')).toBeInTheDocument();
  });

  it('toggles checklist items', async () => {
    renderWithContext(<QualityCheck />);

    await waitFor(() => {
      expect(screen.getByText('Dimensional accuracy within tolerance')).toBeInTheDocument();
    });

    const checkItem = screen.getByText('Dimensional accuracy within tolerance');
    fireEvent.click(checkItem);

    // expect 'Passed: 1' to show up
    expect(screen.getByText(/Passed: 1/i)).toBeInTheDocument();
  });

  it('handles the fail/rework path', async () => {
    renderWithContext(<QualityCheck />);

    await waitFor(() => {
      expect(screen.getByText('Dimensional accuracy within tolerance')).toBeInTheDocument();
    });

    // Don't check all items, so it's a "Fail"
    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Submit for Rework/i });
    fireEvent.click(submitBtn);

    // Should show validation error because rework reason and team are missing
    await waitFor(() => {
      expect(screen.getByText(/Please provide rework reason and assign a team/i)).toBeInTheDocument();
    });

    // Fill in rework details
    fireEvent.change(screen.getByPlaceholderText(/Describe what needs to be fixed/i), { target: { value: 'Faulty surface' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Team Alpha' } });

    fireEvent.click(submitBtn);
  });

  it('handles the pass/complete path', async () => {
    renderWithContext(<QualityCheck />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: '' }).length).toBeGreaterThan(5); // checklist buttons
    });

    // Click all 6 checklist items
    const checkButtons = screen.getAllByRole('button', { name: '' });
    checkButtons.forEach(btn => fireEvent.click(btn));

    await waitFor(() => {
      expect(screen.getByText(/Passed: 6/i)).toBeInTheDocument();
      expect(screen.getByText(/Approve & Complete/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Approve & Complete/i });
    fireEvent.click(submitBtn);
  });
});
