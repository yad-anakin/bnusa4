import { useState, useCallback } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: 'danger' | 'warning' | 'info';
};

type ConfirmReturn = [
  (options?: ConfirmOptions) => Promise<boolean>,
  () => JSX.Element
];

const defaultOptions: ConfirmOptions = {
  title: 'Confirm Action',
  message: 'Are you sure you want to perform this action?',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  variant: 'danger'
};

export function useConfirm(): ConfirmReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>(defaultOptions);
  const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => () => {});

  const confirm = useCallback(
    (customOptions: ConfirmOptions = {}) => {
      return new Promise<boolean>((resolve) => {
        setOptions({ ...defaultOptions, ...customOptions });
        setResolveRef(() => resolve);
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef(true);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef(false);
  }, [resolveRef]);

  const ConfirmDialog = useCallback(() => {
    return (
      <ConfirmModal
        isOpen={isOpen}
        title={options.title || defaultOptions.title!}
        message={options.message || defaultOptions.message!}
        confirmButtonText={options.confirmButtonText || defaultOptions.confirmButtonText!}
        cancelButtonText={options.cancelButtonText || defaultOptions.cancelButtonText!}
        variant={options.variant || defaultOptions.variant!}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [isOpen, options, handleConfirm, handleCancel]);

  return [confirm, ConfirmDialog];
} 