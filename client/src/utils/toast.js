import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => toast.success(message, {
    style: {
      background: '#043927',
      color: '#fff',
      borderRadius: '8px',
    },
    iconTheme: { primary: '#efeee8', secondary: '#043927' }
  }),
  error: (message) => toast.error(message, {
    style: {
      background: '#D32F2F',
      color: '#fff',
      borderRadius: '8px',
    }
  }),
  info: (message) => toast(message, {
    style: {
      background: '#efeee8',
      color: '#043927',
      borderRadius: '8px',
    }
  })
};
