export const isValidEmail = (email = "") => /\S+@\S+\.\S+/.test(String(email).trim());

export const validatePassword = (password = "") => {
  if (!password || password.length < 5) {
    return "Password must be at least 5 characters.";
  }
  return "";
};
