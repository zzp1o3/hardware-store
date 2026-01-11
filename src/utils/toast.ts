import Toast from 'react-native-toast-message';

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  Toast.show({ type, text1: message });
};

export default { showToast };
