'use client';

import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '16px',
          padding: '16px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
