export const formatEmail = (email) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

export const formatName = (name) => {
  if (typeof name !== 'string') return '';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const formatPhone = (phone) => {
  return typeof phone === 'string' ? phone.trim().replace(/\D/g, '') : '';
};

export const formatPassword = (password) => {
  return typeof password === 'string' ? password.trim() : '';
};

export const formatUserData = ({ name, email, password, phone }) => {
  return {
    name: formatName(name),
    email: formatEmail(email),
    password: formatPassword(password),
    phone: phone ? formatPhone(phone) : undefined,
  };
};
