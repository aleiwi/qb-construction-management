/**
 * أدوات اختبار شاملة لمشروع Quantum Build
 * Test Utilities for Quantum Build Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { getSupabaseClient } from '../lib/supabaseClient';

// Mock Supabase for testing
jest.mock('../lib/supabaseClient');

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key'
};

// Test wrapper component
export const TestWrapper = ({ children, initialUser = null, routerProps = {} }) => {
  const mockUser = initialUser ? {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  } : null;

  const mockAuth = {
    user: mockUser,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn()
  };

  return (
    <BrowserRouter {...routerProps}>
      <AuthProvider value={mockAuth}>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Helper function to create test projects
export const createTestProject = (overrides = {}) => ({
  id: 'test-project-1',
  name: 'مشروع اختبار',
  description: 'وصف المشروع التجريبي',
  status: 'active',
  user_id: 'test-user-id',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  budget: 100000,
  currency: 'SAR',
  location: 'الرياض',
  ...overrides
});

// Helper function to create test materials
export const createTestMaterial = (overrides = {}) => ({
  id: 'test-material-1',
  name: 'خرسانة عادية',
  category: 'خرسانة',
  unit: 'متر مكعب',
  price_per_unit: 250,
  currency: 'SAR',
  supplier: 'شركة الاختبار',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

// Helper function to create test calculation
export const createTestCalculation = (overrides = {}) => ({
  id: 'test-calculation-1',
  project_id: 'test-project-1',
  calculation_type: 'concrete',
  input_data: {
    area: 100,
    thickness: 0.2,
    grade: 'C25'
  },
  result_data: {
    volume: 20,
    cost: 5000
  },
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
});

// Mock API responses
export const mockApiResponses = {
  projects: [
    createTestProject(),
    createTestProject({ id: 'test-project-2', name: 'مشروع آخر' })
  ],
  materials: [
    createTestMaterial(),
    createTestMaterial({ id: 'test-material-2', name: 'حديد تسليح' })
  ],
  calculations: [
    createTestCalculation()
  ]
};

// Test data factories
export const testDataFactory = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
    ...overrides
  }),

  project: createTestProject,
  material: createTestMaterial,
  calculation: createTestCalculation,

  // Generate random test data
  randomProject: () => createTestProject({
    name: `مشروع ${Math.random().toString(36).substr(2, 9)}`,
    budget: Math.floor(Math.random() * 1000000) + 50000
  }),

  randomMaterial: () => createTestMaterial({
    name: `مادة ${Math.random().toString(36).substr(2, 9)}`,
    price_per_unit: Math.floor(Math.random() * 1000) + 100
  })
};

// Custom render functions
export const customRender = (ui, options = {}) => {
  const renderOptions = {
    wrapper: TestWrapper,
    ...options
  };
  
  return render(ui, renderOptions);
};

// Extended waitFor with custom timeout
export const waitForExtended = async (callback, options = {}) => {
  const defaultOptions = {
    timeout: 3000,
    interval: 100,
    ...options
  };
  
  return waitFor(callback, defaultOptions);
};

// Mock functions for testing
export const mockFunctions = {
  // Supabase mocks
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn()
    }))
  },

  // API mocks
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },

  // Toast mocks
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },

  // Navigation mocks
  navigate: jest.fn(),
  useNavigate: jest.fn(() => mockFunctions.navigate),

  // LocalStorage mocks
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
};

// Test helpers for async operations
export const asyncHelpers = {
  // Wait for element to appear
  waitForElement: (text) => waitFor(() => {
    const element = screen.getByText(text);
    expect(element).toBeInTheDocument();
    return element;
  }),

  // Wait for element to disappear
  waitForElementToDisappear: (text) => waitFor(() => {
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  }),

  // Wait for loading to complete
  waitForLoading: () => waitForExtended(() => {
    expect(screen.queryByText(/جاري التحميل/)).not.toBeInTheDocument();
  }),

  // Simulate async operation
  simulateAsync: (delay = 100) => new Promise(resolve => setTimeout(resolve, delay))
};

// Accessibility testing helpers
export const accessibilityHelpers = {
  // Check if element has proper ARIA attributes
  checkAriaAttributes: (element) => {
    const ariaAttributes = ['aria-label', 'aria-labelledby', 'aria-describedby'];
    const hasAria = ariaAttributes.some(attr => element.hasAttribute(attr));
    expect(hasAria).toBe(true);
  },

  // Check if form inputs have labels
  checkFormLabels: (formElement) => {
    const inputs = formElement.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const hasLabel = input.hasAttribute('aria-label') || 
                      input.hasAttribute('aria-labelledby') ||
                      formElement.querySelector(`label[for="${input.id}"]`);
      expect(hasLabel).toBe(true);
    });
  }
};

// Performance testing helpers
export const performanceHelpers = {
  // Measure component render time
  measureRenderTime: (Component) => {
    const start = performance.now();
    render(<Component />);
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    return renderTime;
  },

  // Check for memory leaks
  checkForMemoryLeaks: (Component) => {
    const { unmount } = render(<Component />);
    const before = performance.memory?.usedJSHeapSize || 0;
    
    unmount();
    
    // This is a simplified check - in real tests you'd use more sophisticated tools
    const after = performance.memory?.usedJSHeapSize || 0;
    expect(after).toBeLessThanOrEqual(before * 1.1); // Allow 10% tolerance
  }
};

// Error boundary testing helpers
export const errorBoundaryHelpers = {
  // Test error boundary catches errors
  testErrorBoundary: (Component, error) => {
    const ThrowError = () => {
      throw error;
    };

    render(
      <TestWrapper>
        <Component>
          <ThrowError />
        </Component>
      </TestWrapper>
    );

    expect(screen.getByText(/حدث خطأ/)).toBeInTheDocument();
  },

  // Test error boundary retry functionality
  testErrorBoundaryRetry: () => {
    const retryButton = screen.getByText(/إعادة المحاولة/);
    fireEvent.click(retryButton);
    
    // Verify the component attempts to re-render
    expect(screen.getByText(/جاري التحميل/)).toBeInTheDocument();
  }
};

// RTL (Right-to-Left) testing helpers
export const rtlHelpers = {
  // Test Arabic text rendering
  testArabicText: (text) => {
    const element = screen.getByText(text);
    expect(element).toHaveAttribute('dir', 'rtl');
  },

  // Test layout direction
  testLayoutDirection: () => {
    const main = document.querySelector('[dir="rtl"]');
    expect(main).toBeInTheDocument();
  }
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Default export with all helpers
const testUtils = {
  TestWrapper,
  createTestProject,
  createTestMaterial,
  createTestCalculation,
  customRender,
  waitForExtended,
  mockFunctions,
  asyncHelpers,
  accessibilityHelpers,
  performanceHelpers,
  errorBoundaryHelpers,
  rtlHelpers,
  testDataFactory
};

export default testUtils;