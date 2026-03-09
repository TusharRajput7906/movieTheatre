import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { selectToasts, removeToast } from '../../store/slices/uiSlice.js';

const ICONS = {
  success: 'fas fa-check-circle',
  error:   'fas fa-times-circle',
  warning: 'fas fa-exclamation-triangle',
  info:    'fas fa-info-circle',
};

export default function Toast() {
  const dispatch = useDispatch();
  const toasts   = useSelector(selectToasts);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3500);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className={`toast toast-${toast.type || 'info'}`}>
      <i className={ICONS[toast.type] || ICONS.info}></i>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onRemove}><i className="fas fa-times"></i></button>
    </div>
  );
}
