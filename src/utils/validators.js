export const isValidEmail = (email) => {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const isValidName = (name) => {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 60;
};

export const isValidPhone = (phone) => {
  return typeof phone === 'string' && /^[6-9]\d{9}$/.test(phone.trim());
};

export const validateUserData = ({ name, email, password, phone }) => {
  const errors = {};

  if (!isValidName(name)) errors.name = 'Name is required (max 60 chars)';
  if (!isValidEmail(email)) errors.email = 'Invalid email address';
  if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters';
  if (phone && !isValidPhone(phone)) errors.phone = 'Invalid phone number';

  return errors;
};
