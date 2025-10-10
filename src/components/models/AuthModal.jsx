'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { signInWithPopup } from 'firebase/auth';
import { initFirebase } from '@/lib/firebase';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { handleAuthError } from '@/utils/handleAuthError';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';
import { LogIn, UserPlus, X, ArrowLeft, Shield, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ErrorMessage from '../ui/ErrorMessage';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import { initializeApp } from '@/stores/globalStoreManager';

export default function AuthModal({ isOpen, onClose }) {
  const { setUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailPassError, setEmailPassError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [step, setStep] = useState(1);
  const [enteredEmail, setEnteredEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passError, setPassError] = useState(null);
  const [isOAuth, setIsOAuth] = useState(false);

  const smoothEasing = [0.4, 0, 0.2, 1];

  const modalVariants = {
    hidden: {
      x: '100%',
    },
    visible: {
      x: 0,
      transition: {
        duration: 0.4,
        ease: smoothEasing,
      },
    },
    exit: {
      x: '100%',
      transition: {
        duration: 0.3,
        ease: smoothEasing,
      },
    },
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: {
          duration: 0.4,
          ease: smoothEasing,
        },
        opacity: {
          duration: 0.3,
          ease: 'easeOut',
        },
      },
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: smoothEasing,
      },
    }),
  };

  const stepVariants = {
    enter: {
      x: '20%',
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: {
          duration: 0.4,
          ease: smoothEasing,
        },
        opacity: {
          duration: 0.3,
          ease: 'easeOut',
        },
      },
    },
    exit: {
      x: '-20%',
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: smoothEasing,
      },
    },
  };

  const reset = () => {
    setEnteredEmail('');
    setEmailPassError(null);
    setShowForgotPassword(false);
    setIsOAuth(false);
    setNewPassword('');
    setConfirmPassword('');
    setCodeError('');
    setPassError(null);
    setCode('');
    setStep(1);
  };

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onClose();
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsOAuth(false);
    setEmailPassError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    const setError = (msg) => {
      setEmailPassError(msg);
    };

    const validateInputs = () => {
      if (!isValidEmail(email)) return 'Invalid email address.';
      if (!isValidPassword(password)) return 'Password must be at least 6 characters.';
      if (!isLogin && password !== confirmPassword) return 'Passwords do not match.';
      return null;
    };

    const sendToMongo = async (url, body) => {
      const res = await fetchWithCredentials(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const json = await handleApiResponse(res);
      if (!res.ok) throw { status: res.status, body: json };

      return json;
    };

    const finishSuccess = async (msg) => {
      toast.success(msg);

      try {
        const res = await fetchWithCredentials('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await handleApiResponse(res);
          if (data?.user) {
            initializeApp();
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('❌ Failed to fetch user after login:', err.message);
      }

      setTimeout(() => handleClose(), 100);
    };

    try {
      const validationError = validateInputs();
      if (validationError) {
        setError(validationError);
        return;
      }

      if (!isLogin) {
        try {
          await sendToMongo('/api/auth/register', {
            name: name || 'No Name',
            email,
            password,
          });
          finishSuccess('Account created successfully! Welcome aboard.');
        } catch (err) {
          handleAuthError(err.status, err.body, setError);
        }
        return;
      }

      try {
        await sendToMongo('/api/auth/login', { email, password });
        finishSuccess('Welcome back! Login successful.');
      } catch (err) {
        console.warn('[Mongo] Login error', err.status, err.body);
        handleAuthError(err.status || 500, err.body, setError, true);

        try {
          const res = await fetchWithCredentials('/api/auth/check-email-exists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          const data = await handleApiResponse(res);
          if (data.exists && data.hasOAuth) {
            setIsOAuth(true);
          }
        } catch (checkErr) {
          console.error('Email check error:', checkErr);
        }
      }
    } catch (err) {
      handleAuthError(err.code || err.status || 500, err.body, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setEmailPassError(null);
    setIsOAuth(false);
    setLoading(true);

    const { auth, provider } = initFirebase();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await fetchWithCredentials('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: user.displayName || 'No Name',
          email: user.email,
          photoURL: user.photoURL || '',
          uid: user.uid,
        }),
      });

      const data = await handleApiResponse(res);

      if (!res.ok) {
        handleAuthError(res.status, data, setEmailPassError, true);
        return;
      }

      toast.success('Welcome! Google login successful.');

      const meRes = await fetchWithCredentials('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (meRes.ok) {
        const meData = await handleApiResponse(meRes);
        if (meData?.user) {
          initializeApp();
          setUser(meData.user);
        }
      }

      setTimeout(() => handleClose(), 100);
    } catch (err) {
      handleAuthError(err.code || 500, {}, setEmailPassError, true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsOAuth(false);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('resetEmail')?.trim();

    if (!email) {
      setEmailPassError('Please enter your email address');
      return;
    }

    setEmailPassError(null);
    setLoading(true);

    try {
      const res = await fetchWithCredentials('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await handleApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      toast.success('Reset code sent! Check your email.');
      setEnteredEmail(email);
      setStep(2);
    } catch (err) {
      setEmailPassError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setCodeError(null);
    setLoading(true);

    try {
      const res = await fetchWithCredentials('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: enteredEmail,
          code: code.trim(),
        }),
      });

      const data = await handleApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      toast.success('Code verified! Set your new password.');
      setStep(3);
    } catch (err) {
      console.error('Verify code error:', err);
      setCodeError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPassError(null);

    if (!newPassword || newPassword.length < 6) {
      return setPassError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return setPassError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await fetchWithCredentials('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: enteredEmail,
          code,
          newPassword,
        }),
      });

      const data = await handleApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      toast.success('Password reset successful! You can now login.');
      reset();
      setShowForgotPassword(false);
    } catch (err) {
      setPassError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-4">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <motion.div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200 ${
              step >= stepNum ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}
            animate={{ scale: step >= stepNum ? 1 : 0.9 }}
            transition={{ duration: 0.3, ease: smoothEasing }}
          >
            {stepNum}
          </motion.div>
          {stepNum < 3 && (
            <motion.div
              className={`w-6 h-0.5 mx-1 ${step > stepNum ? 'bg-black' : 'bg-gray-200'}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step > stepNum ? 1 : 0 }}
              transition={{ duration: 0.4, ease: smoothEasing }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderOTPInput = () => (
    <motion.div
      className="space-y-3"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <div className="text-center space-y-1">
        <motion.div
          className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full mb-3"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: smoothEasing }}
        >
          <Mail className="w-4 h-4 text-black" />
        </motion.div>
        <h3 className="text-base font-semibold text-gray-900">Check your email</h3>
        <p className="text-xs text-gray-600">
          We sent a 6-digit code to <span className="font-medium">{enteredEmail}</span>
        </p>
      </div>

      <div
        className="flex justify-center gap-2"
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
          if (pasted.length === 6) {
            setCode(pasted);
            setCodeError('');
          }
          e.preventDefault();
        }}
      >
        {Array(6)
          .fill('')
          .map((_, i) => (
            <motion.input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="w-8 h-8 text-center text-sm font-semibold border-0 border-b-2 border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent disabled:opacity-50"
              value={code[i] || ''}
              disabled={loading}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.1, ease: smoothEasing }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (!val) return;

                const newCode = code.split('');
                newCode[i] = val[0];
                setCode(newCode.join(''));
                setCodeError('');

                const next = e.target.nextSibling;
                if (val && next?.focus) next.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  const newCode = code.split('');
                  newCode[i] = '';
                  setCode(newCode.join(''));

                  if (i > 0 && !code[i] && e.target.previousSibling?.focus) {
                    e.target.previousSibling.focus();
                  }
                }
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            />
          ))}
      </div>

      {codeError && (
        <motion.div
          className="text-xs text-red-600 text-center bg-red-50 p-2 rounded"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: smoothEasing }}
        >
          {codeError}
        </motion.div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            toast.success('New code sent!');
          }, 1000);
        }}
        className="text-xs text-gray-600 hover:text-black transition-colors mx-auto block disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Didn't receive the code? Resend
      </button>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`bg-white rounded-sm shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex relative ${
            loading ? 'pointer-events-none opacity-90' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-3 h-3" />
          </motion.button>
          {loading && (
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-black overflow-hidden z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 1 : 0 }}
              transition={{ duration: 0.1 }}
            >
              <motion.div
                className="h-full bg-white"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'linear',
                  duration: 1.2,
                }}
              />
            </motion.div>
          )}

          {/* Left Side */}
          <div className="w-full md:w-[55%] p-4 flex flex-col justify-center overflow-hidden max-h-[90vh]">
            <div className="flex flex-col justify-center min-h-[500px]">
              <AnimatePresence mode="wait" custom={isLogin ? 1 : -1}>
                <motion.div
                  key={showForgotPassword ? 'forgot' : isLogin ? 'login' : 'signup'}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  custom={isLogin ? 1 : -1}
                  className="space-y-3 flex flex-col justify-center min-h-[400px]"
                >
                  <div className="text-center space-y-1">
                    <motion.h2
                      className="text-xl font-bold text-gray-900"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.15, delay: 0.05, ease: smoothEasing }}
                    >
                      {showForgotPassword
                        ? 'Reset Password'
                        : isLogin
                        ? 'Welcome Back'
                        : 'Create Account'}
                    </motion.h2>

                    <motion.p
                      className="text-xs text-gray-600"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.15, delay: 0.1, ease: smoothEasing }}
                    >
                      {showForgotPassword
                        ? 'Follow the steps to reset your password'
                        : isLogin
                        ? 'Sign in to continue to your account'
                        : 'Get started with your free account'}
                    </motion.p>
                  </div>

                  {showForgotPassword ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-center min-h-[350px]">
                      {renderStepIndicator()}

                      <form
                        onSubmit={
                          step === 1
                            ? handleForgotPassword
                            : step === 2
                            ? handleVerifyCode
                            : handleResetPassword
                        }
                        className="space-y-3"
                      >
                        <AnimatePresence mode="wait">
                          {step === 1 && (
                            <motion.div
                              key="step-1"
                              variants={stepVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              className="space-y-2"
                            >
                              <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                  type="email"
                                  name="resetEmail"
                                  placeholder="Enter your email address"
                                  className="w-full pl-8 pr-3 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                                  disabled={loading}
                                  required
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                />
                              </div>
                              {emailPassError && (
                                <motion.div
                                  className="text-xs text-red-600 bg-red-50 p-2 rounded"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15, ease: smoothEasing }}
                                >
                                  {emailPassError}
                                </motion.div>
                              )}
                            </motion.div>
                          )}

                          {step === 2 && renderOTPInput()}

                          {step === 3 && (
                            <motion.div
                              key="step-3"
                              variants={stepVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              className="space-y-3"
                            >
                              <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="New password"
                                  value={newPassword}
                                  onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setPassError(null);
                                  }}
                                  className="w-full pl-8 pr-8 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                                  disabled={loading}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black text-xs disabled:opacity-50"
                                >
                                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>

                              <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Confirm new password"
                                  value={confirmPassword}
                                  onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setPassError(null);
                                  }}
                                  className="w-full pl-8 pr-3 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                                  disabled={loading}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                  }}
                                />
                              </div>

                              {passError && (
                                <motion.div
                                  className="text-xs text-red-600 bg-red-50 p-2 rounded"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.15, ease: smoothEasing }}
                                >
                                  {passError}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button
                          type="submit"
                          className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading || (step === 2 && code.length !== 6)}
                          whileHover={!loading ? { scale: 1.01 } : {}}
                          whileTap={!loading ? { scale: 0.99 } : {}}
                          transition={{ duration: 0.1 }}
                        >
                          {step === 1
                            ? loading
                              ? 'Sending...'
                              : 'Send Reset Code'
                            : step === 2
                            ? loading
                              ? 'Verifying...'
                              : 'Verify Code'
                            : loading
                            ? 'Updating...'
                            : 'Update Password'}
                        </motion.button>
                      </form>

                      <motion.button
                        onClick={() => {
                          if (loading) return;
                          reset();
                          setShowForgotPassword(false);
                        }}
                        disabled={loading}
                        className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-black transition-colors mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={!loading ? { x: -1 } : {}}
                        transition={{ duration: 0.1 }}
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Login
                      </motion.button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleEmailAuth}
                      className="space-y-2 flex-1 flex flex-col justify-center min-h-[350px]"
                    >
                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: smoothEasing }}
                          className="relative"
                        >
                          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                          <input
                            name="name"
                            type="text"
                            placeholder="Full Name"
                            className="w-full pl-8 pr-3 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                            disabled={loading}
                            required
                            onChange={() => setEmailPassError(null)}
                            onFocus={(e) => {
                              e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                            }}
                            onBlur={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          />
                        </motion.div>
                      )}

                      <motion.div
                        className="relative"
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.05, ease: smoothEasing }}
                      >
                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          name="email"
                          type="email"
                          placeholder="Email address"
                          className="w-full pl-8 pr-3 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                          required
                          disabled={loading}
                          onChange={() => setEmailPassError(null)}
                          onFocus={(e) => {
                            e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                          }}
                          onBlur={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        />
                      </motion.div>

                      <motion.div
                        className="relative"
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.1, ease: smoothEasing }}
                      >
                        <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          className="w-full pl-8 pr-8 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                          required
                          disabled={loading}
                          onChange={() => setEmailPassError(null)}
                          onFocus={(e) => {
                            e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                          }}
                          onBlur={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        />
                        <motion.button
                          type="button"
                          disabled={loading}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black transition-colors text-xs disabled:opacity-50"
                          whileHover={!loading ? { scale: 1.05 } : {}}
                          whileTap={!loading ? { scale: 0.95 } : {}}
                          transition={{ duration: 0.1 }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </motion.button>
                      </motion.div>

                      {!isLogin && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: smoothEasing }}
                          className="relative"
                        >
                          <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                          <input
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            className="w-full pl-8 pr-3 py-2 border-0 border-b border-gray-200 focus:border-black focus:outline-none transition-colors bg-transparent text-sm disabled:opacity-50"
                            required
                            disabled={loading}
                            onChange={() => setEmailPassError(null)}
                            onFocus={(e) => {
                              e.target.style.backgroundColor = 'rgba(0,0,0,0.02)';
                            }}
                            onBlur={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          />
                        </motion.div>
                      )}

                      {isLogin && (
                        <motion.div
                          className="text-right"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15, delay: 0.15, ease: smoothEasing }}
                        >
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => {
                              if (loading) return;
                              setShowForgotPassword(true);
                              setEmailPassError(null);
                            }}
                            className="text-xs text-gray-600 hover:text-black transition-colors hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Forgot password?
                          </button>
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {emailPassError && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            transition={{ duration: 0.2, ease: smoothEasing }}
                            className="bg-red-50 border border-red-200 rounded p-3 space-y-1"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-3 h-3 text-red-500 mt-0.5">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01M12 19a7 7 0 100-14 7 7 0 000 14z"
                                  />
                                </svg>
                              </div>
                              <span className="text-xs text-red-700">{emailPassError}</span>
                            </div>

                            {(isOAuth ||
                              emailPassError.toLowerCase().includes('already') ||
                              emailPassError
                                .toLowerCase()
                                .includes('user found with this email')) && (
                              <div className="bg-white rounded border border-red-100 p-2 space-y-1">
                                {isOAuth && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600">
                                      This email is linked to a Google account.
                                    </p>
                                    <motion.button
                                      onClick={handleGoogleLogin}
                                      type="button"
                                      disabled={loading}
                                      className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      whileHover={!loading ? { scale: 1.01 } : {}}
                                      whileTap={!loading ? { scale: 0.99 } : {}}
                                      transition={{ duration: 0.1 }}
                                    >
                                      <FcGoogle className="w-3 h-3" />
                                      Continue with Google
                                    </motion.button>
                                  </div>
                                )}

                                {emailPassError.toLowerCase().includes('already') && (
                                  <motion.button
                                    onClick={() => {
                                      if (loading) return;
                                      setIsLogin(true);
                                      reset();
                                    }}
                                    type="button"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={!loading ? { scale: 1.01 } : {}}
                                    whileTap={!loading ? { scale: 0.99 } : {}}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <LogIn className="w-3 h-3" />
                                    Go to Login
                                  </motion.button>
                                )}

                                {emailPassError
                                  ?.toLowerCase()
                                  .includes('user found with this email') && (
                                  <motion.button
                                    onClick={() => {
                                      if (loading) return;
                                      setIsLogin(false);
                                      reset();
                                    }}
                                    type="button"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 w-full px-3 py-1.5 text-xs bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={!loading ? { scale: 1.01 } : {}}
                                    whileTap={!loading ? { scale: 0.99 } : {}}
                                    transition={{ duration: 0.1 }}
                                  >
                                    <UserPlus className="w-3 h-3" />
                                    Create Account
                                  </motion.button>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.2, ease: smoothEasing }}
                        whileHover={!loading ? { scale: 1.01 } : {}}
                        whileTap={!loading ? { scale: 0.99 } : {}}
                      >
                        {loading
                          ? isLogin
                            ? 'Signing in...'
                            : 'Creating account...'
                          : isLogin
                          ? 'Sign In'
                          : 'Create Account'}
                      </motion.button>

                      <motion.div
                        className="relative flex items-center justify-center my-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.25, ease: smoothEasing }}
                      >
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative bg-white px-3 text-xs text-gray-500">
                          or continue with
                        </div>
                      </motion.div>

                      <motion.button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 py-2 rounded text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.3, ease: smoothEasing }}
                        whileHover={!loading ? { scale: 1.01 } : {}}
                        whileTap={!loading ? { scale: 0.99 } : {}}
                      >
                        <FcGoogle className="w-4 h-4" />
                        Continue with Google
                      </motion.button>

                      <motion.div
                        className="text-center pt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: 0.35, ease: smoothEasing }}
                      >
                        <span className="text-gray-600 text-xs">
                          {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        </span>
                        <motion.button
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            if (loading) return;
                            setIsLogin(!isLogin);
                            setEmailPassError(null);
                            setShowPassword(false);
                          }}
                          className="ml-2 text-black font-medium hover:underline transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={!loading ? { scale: 1.02 } : {}}
                          transition={{ duration: 0.1 }}
                        >
                          {isLogin ? 'Sign up' : 'Sign in'}
                        </motion.button>
                      </motion.div>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side Image */}
          <motion.div
            className="hidden md:flex w-[45%] relative overflow-hidden max-h-[90vh]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: 0.25,
              ease: smoothEasing,
              delay: 0.05,
            }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />

            {/* Image container */}
            <div className="absolute inset-0 flex items-center justify-center max-h-[90vh]">
              <motion.div
                className="relative w-full h-full"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: smoothEasing }}
              >
                <Image
                  src="/offer.jpeg"
                  alt="Offer Poster"
                  fill
                  className="object-cover"
                  priority
                  sizes="45vw"
                />
                <div className="absolute inset-0 bg-black/5" />
              </motion.div>
            </div>

            {/* Floating decorative elements */}
            <motion.div
              className="absolute top-16 right-16 w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15, ease: smoothEasing }}
            />
            <motion.div
              className="absolute bottom-16 left-16 w-8 h-8 bg-white/15 rounded-full backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25, ease: smoothEasing }}
            />
            <motion.div
              className="absolute top-1/2 left-8 w-6 h-6 bg-white/10 rounded-full backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.35, ease: smoothEasing }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
