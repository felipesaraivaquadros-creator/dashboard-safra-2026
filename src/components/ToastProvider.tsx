"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '12px',
          borderRadius: '8px',
        },
      }}
    />
  );
};

export default ToastProvider;