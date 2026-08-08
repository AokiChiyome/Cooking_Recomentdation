import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
