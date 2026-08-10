import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../components/ui/ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    open: true,
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد؟',
    confirmLabel: 'نعم، احذف',
    danger: true,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  it('does not render when open is false', () => {
    render(<ConfirmModal {...defaultProps} open={false} />);
    expect(screen.queryByText('تأكيد الحذف')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('تأكيد الحذف')).toBeInTheDocument();
    expect(screen.getByText('هل أنت متأكد؟')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('نعم، احذف'));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('إلغاء'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('uses default labels when not provided', () => {
    render(<ConfirmModal open title="test" />);
    expect(screen.getByText('تأكيد')).toBeInTheDocument();
    expect(screen.getByText('إلغاء')).toBeInTheDocument();
  });
});
