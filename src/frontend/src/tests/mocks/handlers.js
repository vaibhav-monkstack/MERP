import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5001/api';

// Mock Data
export const mockJobs = [
  {
    id: 'JOB-001',
    product: 'Circuit Board A',
    quantity: 100,
    team: 'Team Alpha',
    status: 'Production',
    priority: 'High',
    progress: 45,
    deadline: '2026-12-31',
    notes: 'Urgent batch',
    parts: [
      { id: 1, name: 'Resistor', requiredQty: 500, completedQty: 250 },
      { id: 2, name: 'Capacitor', requiredQty: 200, completedQty: 100 }
    ]
  },
  {
    id: 'JOB-002',
    product: 'Control Unit',
    quantity: 50,
    team: 'Team Beta',
    status: 'Pending Approval',
    priority: 'Medium',
    progress: 0,
    deadline: '2026-11-30',
    notes: 'Standard order',
    parts: []
  }
];

export const mockTemplates = [
  { id: 1, name: 'Circuit Board A', parts: [{ part_name: 'Resistor', qty_per_unit: 5 }] }
];

export const mockTeams = [
  { id: 1, name: 'Team Alpha' },
  { id: 2, name: 'Team Beta' }
];

export const mockSchedule = {
  tasks: [
    { taskId: 1, processStep: 'Cutting', status: 'Completed', scheduledStart: '2026-04-18', scheduledEnd: '2026-04-19', worker: 'John Doe', sequenceOrder: 1 },
    { taskId: 2, processStep: 'Assembly', status: 'Pending', scheduledStart: '2026-04-20', scheduledEnd: '2026-04-21', worker: 'Jane Smith', sequenceOrder: 2 }
  ],
  groupedByPart: {
    'Circuit Board A': [
      { taskId: 1, processStep: 'Cutting', status: 'Completed', scheduledStart: '2026-04-18', scheduledEnd: '2026-04-19', worker: 'John Doe', sequenceOrder: 1 }
    ]
  },
  materialRequests: [
    { status: 'Approved', count: 2 }
  ]
};

export const handlers = [
  // Jobs
  http.get(`${API_BASE}/jobs`, () => {
    return HttpResponse.json({
      jobs: mockJobs,
      pagination: { total: mockJobs.length, page: 1, limit: 10, totalPages: 1 }
    });
  }),
  http.get(`${API_BASE}/jobs/pending-orders`, () => {
    return HttpResponse.json([]);
  }),
  http.get(`${API_BASE}/jobs/:id`, ({ params }) => {
    const job = mockJobs.find(j => j.id === params.id);
    return job ? HttpResponse.json(job) : new HttpResponse(null, { status: 404 });
  }),
  http.post(`${API_BASE}/jobs`, async ({ request }) => {
    const newJob = await request.json();
    return HttpResponse.json({ ...newJob, id: `JOB-${Date.now()}` }, { status: 201 });
  }),
  http.put(`${API_BASE}/jobs/:id`, async ({ request, params }) => {
    const updates = await request.json();
    return HttpResponse.json({ id: params.id, ...updates });
  }),
  http.delete(`${API_BASE}/jobs/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API_BASE}/templates`, () => HttpResponse.json({ data: mockTemplates })),
  http.get(`${API_BASE}/templates/match/:name`, ({ params }) => {
    const template = mockTemplates.find(t => t.name === params.name);
    return HttpResponse.json({ data: template });
  }),
  http.get(`${API_BASE}/teams`, () => HttpResponse.json(mockTeams)),
  http.get(`${API_BASE}/schedule/:id`, () => HttpResponse.json(mockSchedule)),
  http.post(`${API_BASE}/schedule/:id`, () => HttpResponse.json({ message: 'Schedule generated' })),
  http.delete(`${API_BASE}/schedule/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Quality Check
  http.get(`${API_BASE}/qc`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/qc/:jobId`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${API_BASE}/qc`, async ({ request }) => {
    const record = await request.json();
    return HttpResponse.json({ id: Date.now(), ...record }, { status: 201 });
  })
];
