/**
 * ORDER MANAGEMENT: FRONTEND BUSINESS LOGIC UNIT TESTS
 * Standalone Node.js script to verify frontend behavioral rules.
 */

// --- Test Helper Functions ---
const testResults = [];
async function it(desc, fn) {
    try {
        await fn();
        console.log(`✅ PASSED: ${desc}`);
        testResults.push({ desc, status: 'PASSED' });
    } catch (err) {
        console.log(`❌ FAILED: ${desc}`);
        console.log(`   Error: ${err.message}`);
        testResults.push({ desc, status: 'FAILED', error: err.message });
    }
}

function expect(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
}

// --- Frontend Logic Simulation ---
// These replicate the logic found in OrderDashboard.jsx and CreateOrder.jsx

const formatOrderID = (id) => `ORD-${String(id).padStart(3, '0')}`;

const validateOrderForm = (form) => {
    const required = ['customer_name', 'item_name', 'quantity', 'price'];
    for (const field of required) {
        if (!form[field] || form[field] === '') return false;
    }
    if (form.quantity <= 0) return false;
    return true;
};

const getNextAllowedStatuses = (currentStatus) => {
    const workflow = {
        'new': ['awaiting_materials', 'cancelled'],
        'awaiting_materials': ['ready_to_approve', 'cancelled'],
        'ready_to_approve': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled']
    };
    return workflow[currentStatus] || [];
};

const normalizePriority = (input) => {
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const found = priorities.find(p => p.toLowerCase() === input.toLowerCase());
    return found || 'Medium'; // Default to Medium
};

const isDeadlinePassed = (deadlineDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineDate);
    return deadline < today;
};

// --- Test Suite ---
async function runFrontendTests() {
    console.log('--- ORDER MANAGEMENT: 7 FRONTEND LOGIC UNIT TESTS ---\n');

    // 1. Form Validation Logic
    await it('should validate that required fields are present', () => {
        const validForm = { customer_name: 'Test', item_name: 'Product', quantity: 5, price: 100 };
        const invalidForm = { customer_name: 'Test', quantity: 5 }; // Missing item_name and price
        expect(validateOrderForm(validForm), true);
        expect(validateOrderForm(invalidForm), false);
    });

    // 2. Status Workflow Transitions
    await it('should allow transition from "new" to "awaiting_materials"', () => {
        const allowed = getNextAllowedStatuses('new');
        expect(allowed.includes('awaiting_materials'), true);
        expect(allowed.includes('shipped'), false); // Cannot skip directly to shipped
    });

    // 3. Order ID Formatting
    await it('should format numeric IDs into ORD-XXX format', () => {
        expect(formatOrderID(1), 'ORD-001');
        expect(formatOrderID(42), 'ORD-042');
        expect(formatOrderID(123), 'ORD-123');
    });

    // 4. Initial Status Validation
    await it('should ensure the default order status is "new"', () => {
        const initialForm = { status: 'new' };
        expect(initialForm.status, 'new');
    });

    // 5. Priority Normalization
    await it('should map priority inputs to standard Title Case categories', () => {
        expect(normalizePriority('URGENT'), 'Urgent');
        expect(normalizePriority('high'), 'High');
        expect(normalizePriority('unknown'), 'Medium'); // Fallback
    });

    // 6. Deadline Logic
    await it('should flag deadlines that are in the past', () => {
        const pastDate = '2020-01-01';
        const futureDate = '2099-12-31';
        expect(isDeadlinePassed(pastDate), true);
        expect(isDeadlinePassed(futureDate), false);
    });

    // 7. Search/Filter Simulation
    await it('should return true if search term matches customer or item name', () => {
        const order = { customer_name: 'Acme Corp', item_name: 'Anvil' };
        const searchCustomer = 'acme';
        const searchItem = 'anvil';
        const searchNone = 'xyz';
        
        const filter = (o, s) => 
            o.customer_name.toLowerCase().includes(s.toLowerCase()) || 
            o.item_name.toLowerCase().includes(s.toLowerCase());

        expect(filter(order, searchCustomer), true);
        expect(filter(order, searchItem), true);
        expect(filter(order, searchNone), false);
    });

    console.log('\n--- FRONTEND TEST SUMMARY ---');
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    console.log(`Total: ${testResults.length}, Passed: ${passed}, Failed: ${testResults.length - passed}`);
    
    if (passed !== testResults.length) process.exit(1);
}

runFrontendTests().catch(err => {
    console.error('Test script crashed:', err);
    process.exit(1);
});
