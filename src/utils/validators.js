// utils/validators.js

// Email regex: simple and effective
export const isValidEmail = (email) => {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email.trim());
};

// Password: minimum 6 characters, optionally you can enforce strength
export const isValidPassword = (password) => {
  return typeof password === "string" && password.length >= 6;
  // To enforce strong passwords, use:
  // return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(password);
};

// Name: max 60 characters, no empty names
export const isValidName = (name) => {
  return typeof name === "string" && name.trim().length > 0 && name.length <= 60;
};

// Indian mobile number: starts with 6-9 and has 10 digits
export const isValidPhone = (phone) => {
  return typeof phone === "string" && /^[6-9]\d{9}$/.test(phone.trim());
};

// ✅ Combined validator for forms (optional helper)
export const validateUserData = ({ name, email, password, phone }) => {
  const errors = {};

  if (!isValidName(name)) errors.name = "Name is required (max 60 chars)";
  if (!isValidEmail(email)) errors.email = "Invalid email address";
  if (!isValidPassword(password)) errors.password = "Password must be at least 6 characters";
  if (phone && !isValidPhone(phone)) errors.phone = "Invalid phone number";

  return errors;
};
