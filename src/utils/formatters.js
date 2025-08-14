// utils/formatters.js

// Trim and normalize email to lowercase
export const formatEmail = (email) => {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
};

// Trim and capitalize the first letter of each word in name
export const formatName = (name) => {
  if (typeof name !== "string") return "";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// Trim and sanitize phone number (just digits)
export const formatPhone = (phone) => {
  return typeof phone === "string" ? phone.trim().replace(/\D/g, "") : "";
};

// Trim password only (never alter actual content)
export const formatPassword = (password) => {
  return typeof password === "string" ? password.trim() : "";
};

// ✅ Apply all at once before DB insert
export const formatUserData = ({ name, email, password, phone }) => {
  return {
    name: formatName(name),
    email: formatEmail(email),
    password: formatPassword(password),
    phone: phone ? formatPhone(phone) : undefined,
  };
};
