import { createToaster, Toaster as ChakraToaster } from '@chakra-ui/react';
import { createElement } from 'react';

const toaster = createToaster({
  placement: 'bottom',
  overlap: true,
  gap: 16,
});

export const ToastContainer = () => createElement(ChakraToaster, { toaster });

export const useAppToast = () => {
  const showToast = ({
    title,
    description = '',
    status = 'success',
    duration = 3000,
  }) => {
    toaster.create({
      title,
      description,
      type: status,
      duration,
    });
  };

  return { showToast };
};
