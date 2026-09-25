/**
 * Accessibility Improvements (WCAG 2.1 AA Standard)
 * تحسينات إمكانية الوصول
 */

// ═══════════════════════════════════════════════════════
// 1. ARIA Utilities
// ═══════════════════════════════════════════════════════
export const ariaLabel = (text) => ({
  'aria-label': text,
});

export const ariaLive = (polite = true) => ({
  'aria-live': polite ? 'polite' : 'assertive',
  'aria-atomic': 'true',
});

export const ariaHidden = (hidden = true) => ({
  'aria-hidden': hidden ? 'true' : 'false',
});

export const ariaDescribedBy = (id) => ({
  'aria-describedby': id,
});

export const ariaLabelledBy = (id) => ({
  'aria-labelledby': id,
});

export const ariaExpanded = (expanded) => ({
  'aria-expanded': expanded ? 'true' : 'false',
});

export const ariaPressed = (pressed) => ({
  'aria-pressed': pressed ? 'true' : 'false',
});

export const ariaSelected = (selected) => ({
  'aria-selected': selected ? 'true' : 'false',
});

export const ariaChecked = (checked) => ({
  'aria-checked': checked === null ? 'mixed' : checked ? 'true' : 'false',
});

export const ariaDisabled = (disabled) => ({
  'aria-disabled': disabled ? 'true' : 'false',
});

// ═══════════════════════════════════════════════════════
// 2. Screen Reader Only Text
// ═══════════════════════════════════════════════════════
export const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
};

export const ScreenReaderText = ({ children, as: Component = 'span' }) => {
  return (
    <Component style={srOnlyStyles} role="status" aria-live="polite">
      {children}
    </Component>
  );
};

// ═══════════════════════════════════════════════════════
// 3. Focus Management
// ═══════════════════════════════════════════════════════
export const useFocusManagement = () => {
  const containerRef = React.useRef(null);
  const firstFocusableRef = React.useRef(null);
  const lastFocusableRef = React.useRef(null);

  const focusFirstElement = () => {
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  };

  const focusLastElement = () => {
    if (lastFocusableRef.current) {
      lastFocusableRef.current.focus();
    }
  };

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;

    const focusableElements = containerRef.current?.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  return {
    containerRef,
    firstFocusableRef,
    lastFocusableRef,
    focusFirstElement,
    focusLastElement,
    trapFocus,
  };
};

// ═══════════════════════════════════════════════════════
// 4. Keyboard Navigation
// ═══════════════════════════════════════════════════════
export const useKeyboardNavigation = (callbacks = {}) => {
  const {
    onEnter = null,
    onEscape = null,
    onArrowUp = null,
    onArrowDown = null,
    onArrowLeft = null,
    onArrowRight = null,
  } = callbacks;

  const handleKeyDown = React.useCallback((e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          e.preventDefault();
          onArrowUp();
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          e.preventDefault();
          onArrowDown();
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          e.preventDefault();
          onArrowLeft();
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          e.preventDefault();
          onArrowRight();
        }
        break;
      default:
        break;
    }
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

  return { handleKeyDown };
};

// ═══════════════════════════════════════════════════════
// 5. Skip Links
// ═══════════════════════════════════════════════════════
export const SkipLink = ({ href = '#main', children = 'Skip to main content' }) => {
  return (
    <a
      href={href}
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 9999,
        padding: '1em',
        background: '#000',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '0 0 4px 0',
      }}
      onFocus={(e) => {
        e.target.style.left = '0';
        e.target.style.top = '0';
      }}
      onBlur={(e) => {
        e.target.style.left = '-9999px';
      }}
    >
      {children}
    </a>
  );
};

// ═══════════════════════════════════════════════════════
// 6. Form Accessibility
// ═══════════════════════════════════════════════════════
export const createFormFieldAttrs = (field) => ({
  id: `field-${field.name}`,
  name: field.name,
  type: field.type || 'text',
  required: field.required || false,
  'aria-label': field.label || field.name,
  'aria-describedby': field.error ? `error-${field.name}` : field.hint ? `hint-${field.name}` : undefined,
  'aria-invalid': field.error ? 'true' : 'false',
});

export const FormError = ({ id, message }) => (
  <div id={id} role="alert" style={{ color: 'var(--error-color)', marginTop: '0.5rem' }}>
    {message}
  </div>
);

export const FormHint = ({ id, hint }) => (
  <div id={id} style={{ fontSize: '0.875rem', color: 'var(--secondary-color)', marginTop: '0.25rem' }}>
    {hint}
  </div>
);

// ═══════════════════════════════════════════════════════
// 7. Color Contrast Checker
// ═══════════════════════════════════════════════════════
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map(x => {
      x = parseInt(x) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const isContrastCompliant = (color1, color2, level = 'AA') => {
  const ratio = getContrastRatio(color1, color2);
  const standards = {
    AA: 4.5,
    AAA: 7,
    AALarge: 3,
    AAALarge: 4.5,
  };
  return ratio >= (standards[level] || standards.AA);
};

// ═══════════════════════════════════════════════════════
// 8. Image Alt Text Requirements
// ═══════════════════════════════════════════════════════
export const AccessibleImage = ({ src, alt, ...props }) => {
  if (!alt || alt.trim() === '') {
    console.warn('Image missing alt text:', src);
  }

  return <img src={src} alt={alt} {...props} />;
};

// ═══════════════════════════════════════════════════════
// 9. Heading Hierarchy
// ═══════════════════════════════════════════════════════
export const useHeadingHierarchy = () => {
  const validateHeadingOrder = (elements) => {
    let lastLevel = 0;
    const issues = [];

    elements.forEach((el) => {
      const level = parseInt(el.tagName[1]);
      if (level - lastLevel > 1) {
        issues.push(`Heading jump from h${lastLevel} to h${level}`);
      }
      lastLevel = level;
    });

    return issues;
  };

  return { validateHeadingOrder };
};

// ═══════════════════════════════════════════════════════
// 10. Accessible Modal
// ═══════════════════════════════════════════════════════
export const AccessibleModal = ({ isOpen, onClose, title, children, ...props }) => {
  const { trapFocus, containerRef } = useFocusManagement();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={trapFocus}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          zIndex: 1000,
        }}
        {...props}
      >
        <h1 id="modal-title" style={{ marginTop: 0 }}>
          {title}
        </h1>
        {children}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════
// 11. Accessible Button
// ═══════════════════════════════════════════════════════
export const AccessibleButton = ({
  children,
  ariaLabel,
  ariaDescribedBy,
  disabled = false,
  onClick,
  ...props
}) => {
  return (
    <button
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════
// 12. Accessible Tooltip
// ═══════════════════════════════════════════════════════
export const AccessibleTooltip = ({ id, content, children }) => {
  return (
    <>
      <span
        id={`tooltip-${id}`}
        role="tooltip"
        style={srOnlyStyles}
      >
        {content}
      </span>
      {children}
    </>
  );
};

// ═══════════════════════════════════════════════════════
// 13. Accessibility Testing Checklist
// ═══════════════════════════════════════════════════════
export const A11yChecklist = {
  general: [
    '✅ Page title is descriptive',
    '✅ Language attribute set on <html>',
    '✅ Use semantic HTML (h1-h6, nav, main, etc.)',
    '✅ No automatic redirects without warning',
  ],
  perception: [
    '✅ Color is not the only way to convey meaning',
    '✅ Text has sufficient contrast (4.5:1 for normal text)',
    '✅ Images have descriptive alt text',
    '✅ Captions/transcripts for audio/video',
  ],
  operability: [
    '✅ All functionality keyboard accessible',
    '✅ No keyboard traps',
    '✅ Focus order is logical',
    '✅ Focus indicator is visible',
  ],
  understandability: [
    '✅ Language used is clear and simple',
    '✅ Instructions are clear',
    '✅ Error messages are helpful',
    '✅ Consistent navigation and design',
  ],
  robustness: [
    '✅ Valid HTML markup',
    '✅ Proper use of ARIA',
    '✅ No duplicate IDs',
    '✅ Compatible with assistive technologies',
  ],
};

export default {
  ariaLabel,
  ariaLive,
  ariaHidden,
  ariaDescribedBy,
  ariaLabelledBy,
  ariaExpanded,
  ariaPressed,
  ariaSelected,
  ariaChecked,
  ariaDisabled,
  srOnlyStyles,
  ScreenReaderText,
  useFocusManagement,
  useKeyboardNavigation,
  SkipLink,
  createFormFieldAttrs,
  FormError,
  FormHint,
  getContrastRatio,
  isContrastCompliant,
  AccessibleImage,
  useHeadingHierarchy,
  AccessibleModal,
  AccessibleButton,
  AccessibleTooltip,
  A11yChecklist,
};
