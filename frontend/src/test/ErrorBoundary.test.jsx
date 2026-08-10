import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const GoodChild = () => <div>الصفحة تعمل</div>;
const BadChild = () => { throw new Error('اختبار خطأ'); };

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(<ErrorBoundary><GoodChild /></ErrorBoundary>);
    expect(screen.getByText('الصفحة تعمل')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeInTheDocument();
    expect(screen.getByText(/تعذر تحميل/)).toBeInTheDocument();
  });

  it('reset button is present and clickable in error state', () => {
    render(<ErrorBoundary><BadChild /></ErrorBoundary>);
    const resetBtn = screen.getByText('إعادة المحاولة');
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
  });
});
