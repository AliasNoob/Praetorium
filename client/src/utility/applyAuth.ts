export const applyAuth = () => {
  const token = localStorage.getItem('token') || '';
  return { 'Authorization-Praetorium': `Bearer ${token}` };
};
