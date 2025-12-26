import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  onBack,
  onNext,
  onSubmit,
  onCancel,
  enabled = true
}: KeyboardNavigationProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onCancel?.();
          break;
        case 'Enter':
          event.preventDefault();
          onSubmit?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onBack?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNext?.();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onNext, onSubmit, onCancel, enabled]);
};

export const useFocusManagement = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Focus first focusable element when component mounts
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0] as HTMLElement;
      firstElement.focus();
    }
  }, [enabled]);
};

export default { useKeyboardNavigation, useFocusManagement };
