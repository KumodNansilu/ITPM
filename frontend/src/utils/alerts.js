import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const baseSwalOptions = {
  background: '#ffffff',
  color: '#0b1f3b',
  confirmButtonColor: '#0b3d91',
  cancelButtonColor: '#e5e7eb',
  buttonsStyling: false,
  showClass: {
    popup: 'swal2-show'
  },
  hideClass: {
    popup: 'swal2-hide'
  }
};

export const showSuccess = (message, title = 'Success') => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'success',
    title,
    text: message
  });
};

export const showError = (message, title = 'Something went wrong') => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'error',
    title,
    text: message
  });
};

export const showInfo = (message, title = 'Info') => {
  return Swal.fire({
    ...baseSwalOptions,
    icon: 'info',
    title,
    text: message
  });
};

export const confirmDialog = async ({
  title = 'Are you sure?',
  text = '',
  icon = 'warning',
  confirmButtonText = 'Yes',
  cancelButtonText = 'Cancel'
}) => {
  const result = await Swal.fire({
    ...baseSwalOptions,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText
  });

  return Boolean(result.isConfirmed);
};

