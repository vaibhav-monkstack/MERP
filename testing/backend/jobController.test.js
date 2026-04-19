const { getJobs, getPendingOrders, createJob, updateJob, deleteJob, approveJob } = require('../../backend/controllers/jobController');

// Mock the database pool
jest.mock('../../backend/config/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../backend/config/db');

describe('Job Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { name: 'Test User' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getJobs', () => {
    it('should fetch jobs successfully without search', async () => {
      const mockJobs = [{ id: 'JOB-1', product: 'Test Product' }];
      const mockTotal = [{ total: 1 }];
      pool.query.mockResolvedValueOnce([mockJobs]).mockResolvedValueOnce([mockTotal]);
      pool.query.mockResolvedValueOnce([[]]);

      await getJobs(req, res);

      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith({
        jobs: [{ id: 'JOB-1', product: 'Test Product', parts: [] }],
        pagination: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should fetch jobs with search', async () => {
      req.query = { search: 'test', page: 1, limit: 10 };
      const mockJobs = [{ id: 'JOB-1', product: 'Test Product' }];
      const mockTotal = [{ total: 1 }];
      pool.query.mockResolvedValueOnce([mockJobs]).mockResolvedValueOnce([mockTotal]);
      pool.query.mockResolvedValueOnce([[]]);

      await getJobs(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM jobs WHERE product LIKE ? OR team LIKE ? OR id LIKE ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        ['%test%', '%test%', '%test%', 10, 0]
      );
    });

    it('should handle database error', async () => {
      pool.query.mockRejectedValue(new Error('DB Error'));

      await getJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching jobs' });
    });
  });

  describe('getPendingOrders', () => {
    it('should fetch pending orders successfully', async () => {
      const mockOrders = [{ orderId: 1, customer_name: 'Test Customer' }];
      pool.query.mockResolvedValue([mockOrders]);

      await getPendingOrders(req, res);

      expect(pool.query).toHaveBeenCalledWith(`
      SELECT o.id as orderId, o.customer_name, o.item_name, o.quantity, o.priority, o.deadline, o.created_at
      FROM orders o
      LEFT JOIN jobs j ON o.id = j.orderId
      WHERE o.status = 'confirmed' AND j.orderId IS NULL
      ORDER BY o.created_at ASC
    `);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should handle database error', async () => {
      pool.query.mockRejectedValue(new Error('DB Error'));

      await getPendingOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching pending orders' });
    });
  });

  describe('createJob', () => {
    it('should create a job successfully without orderId and parts', async () => {
      req.body = { product: 'Test Product', quantity: 10, team: 'Team A' };
      const mockJob = [{ id: 'JOB-123', product: 'Test Product' }];
      pool.query.mockResolvedValueOnce().mockResolvedValueOnce([mockJob]).mockResolvedValueOnce([[]]);

      await createJob(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO jobs (id, product, quantity, team, status, priority, progress, deadline, notes, alert, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expect.stringMatching(/^JOB-\d+$/), 'Test Product', 10, 'Team A', 'Created', 'Medium', 0, null, '', '', null]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Job created successfully',
        job: expect.objectContaining({ product: 'Test Product', parts: [] }),
      });
    });

    it('should create a job with orderId and update order status', async () => {
      req.body = { product: 'Test Product', quantity: 10, team: 'Team A', orderId: 1 };
      const mockJob = [{ id: 'JOB-123', product: 'Test Product', orderId: 1 }];
      pool.query.mockResolvedValueOnce().mockResolvedValueOnce().mockResolvedValueOnce().mockResolvedValueOnce([mockJob]).mockResolvedValueOnce([[]]);

      await createJob(req, res);

      expect(pool.query).toHaveBeenCalledWith('UPDATE orders SET status = "processing" WHERE id = ?', [1]);
      expect(pool.query).toHaveBeenCalledWith('INSERT INTO order_history (order_id, status, remarks) VALUES (?, ?, ?)',
        [1, 'processing', expect.stringMatching(/^Job created: JOB-\d+$/)]);
    });

    it('should create a job with parts and auto-generate material requests', async () => {
      req.body = { product: 'Test Product', quantity: 10, team: 'Team A', parts: [{ name: 'Part A', requiredQty: 5 }] };
      const mockJob = [{ id: 'JOB-123', product: 'Test Product' }];
      pool.query.mockResolvedValueOnce().mockResolvedValueOnce().mockResolvedValueOnce().mockResolvedValueOnce([mockJob]).mockResolvedValueOnce([[]]);

      await createJob(req, res);

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO job_parts (jobId, name, requiredQty) VALUES (?, ?, ?)',
        [expect.stringMatching(/^JOB-\d+$/), 'Part A', 5]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO requests (request_id, job_id, material, quantity, requested_by) VALUES (?, ?, ?, ?, ?)',
        [expect.stringMatching(/^REQ-\d+-0$/), expect.stringMatching(/^JOB-\d+$/), 'Part A', 5, 'Test User']
      );
    });

    it('should handle database error', async () => {
      req.body = { product: 'Test Product', quantity: 10, team: 'Team A' };
      pool.query.mockRejectedValue(new Error('DB Error'));

      await createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error creating job' });
    });
  });

  describe('updateJob', () => {
    it('should update a job successfully', async () => {
      req.params = { id: 'JOB-123' };
      req.body = { status: 'In Progress', progress: 50 };
      pool.query.mockResolvedValueOnce();

      await updateJob(req, res);

      expect(pool.query).toHaveBeenCalledWith('UPDATE jobs SET status = ?, progress = ? WHERE id = ?', ['In Progress', 50, 'JOB-123']);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Job JOB-123 updated successfully',
        jobId: 'JOB-123',
        updatedAt: expect.any(String),
      });
    });

    it('should handle no fields to update', async () => {
      req.params = { id: 'JOB-123' };
      req.body = {};

      await updateJob(req, res);

      expect(pool.query).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Job JOB-123 updated successfully',
        jobId: 'JOB-123',
        updatedAt: expect.any(String),
      });
    });

    it('should handle database error', async () => {
      req.params = { id: 'JOB-123' };
      req.body = { status: 'In Progress' };
      pool.query.mockRejectedValue(new Error('DB Error'));

      await updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error updating job' });
    });
  });

  describe('deleteJob', () => {
    it('should delete a job successfully', async () => {
      req.params = { id: 'JOB-123' };
      pool.query.mockResolvedValueOnce();

      await deleteJob(req, res);

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM jobs WHERE id = ?', ['JOB-123']);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Job JOB-123 deleted successfully',
        jobId: 'JOB-123',
        deletedAt: expect.any(String),
      });
    });

    it('should handle database error', async () => {
      req.params = { id: 'JOB-123' };
      pool.query.mockRejectedValue(new Error('DB Error'));

      await deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error deleting job' });
    });
  });

  describe('approveJob', () => {
    it('should approve a job successfully', async () => {
      req.params = { id: 'JOB-123' };
      const mockJob = [{ id: 'JOB-123', orderId: 1 }];
      pool.query.mockResolvedValueOnce([mockJob]).mockResolvedValueOnce().mockResolvedValueOnce();

      await approveJob(req, res);

      expect(pool.query).toHaveBeenCalledWith('UPDATE jobs SET status = "Created" WHERE id = ?', ['JOB-123']);
      expect(pool.query).toHaveBeenCalledWith('INSERT INTO order_history (order_id, status, remarks) VALUES (?, ?, ?)',
        [1, 'processing', expect.stringMatching(/^Job JOB-123 approved by manager. Production started.$/)]);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Job approved successfully. Production initiated.',
        jobId: 'JOB-123',
      });
    });

    it('should return 404 if job not found', async () => {
      req.params = { id: 'JOB-123' };
      pool.query.mockResolvedValueOnce([[]]);

      await approveJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Job not found' });
    });

    it('should handle database error', async () => {
      req.params = { id: 'JOB-123' };
      pool.query.mockRejectedValue(new Error('DB Error'));

      await approveJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error approving job' });
    });
  });
});