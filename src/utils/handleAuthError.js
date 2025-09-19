export const handleAuthError = (input, resBody = {}, setError, isLogin = false) => {
  const firebaseMap = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-credential': isLogin
      ? 'Incorrect email or password'
      : 'Signup failed. Please check your details.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait and try again',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/internal-error': 'Something went wrong. Please try again',
    'auth/missing-password': 'Please enter a password',
  };

  const statusMap = {
    400: 'Missing email or password',
    401: 'Incorrect password',
    403: 'Access denied or session expired',
    404: 'No user found with this email',
    409: 'This email is already registered',
    422: 'Invalid input. Please check your details.',
    500: 'Server error. Please try again later.',
  };

  if (typeof input === 'string') {
    const message =
      firebaseMap[input] || resBody?.error || 'Something went wrong. Please try again.';
    setError(message);
  } else if (typeof input === 'number') {
    const message = statusMap[input] || resBody?.error || 'Something went wrong. Please try again.';
    setError(message);
  } else {
    setError('An unknown error occurred');
  }
};
