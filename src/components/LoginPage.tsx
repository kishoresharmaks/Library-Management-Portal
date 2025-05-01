import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import Head from 'next/head'; // If using Next.js, or your framework's equivalent

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  
  // Security state
  const [attempts, setAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<Date | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase()) ? '' : 'Please enter a valid email address';
  };

  // Validate password strength
  const validatePassword = (pwd: string) => {
    const minLength = 8;
    // const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    if (pwd.length < minLength) return 'Password must be at least 8 characters';
    // if (!hasUpper) return 'Include at least one uppercase letter';
    if (!hasLower) return 'Include at least one lowercase letter';
    if (!hasNumber) return 'Include at least one number';
    if (!hasSpecial) return 'Include at least one special character';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const emailErr = validateEmail(email);
    const pwdErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(pwdErr);
    
    if (emailErr || pwdErr) return;
    if (!captchaVerified) {
      alert('Please complete the CAPTCHA verification');
      return;
    }
    
    // Check if account is temporarily locked
    if (isLocked && lastAttempt) {
      const now = new Date();
      const lockTime = new Date(lastAttempt.getTime() + 5 * 60000); // 5 minutes
      if (now < lockTime) {
        alert(`Account temporarily locked. Try again at ${lockTime.toLocaleTimeString()}`);
        return;
      } else {
        setIsLocked(false);
        setAttempts(0);
      }
    }

    setIsLoading(true);
    try {
      // Pass rememberMe to auth service
      await signIn(email, password, rememberMe);
      setAttempts(0);
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLastAttempt(new Date());
        alert('Too many failed attempts. Account locked for 5 minutes.');
      }
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        {/* Security Headers */}
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'" />
        <meta http-equiv="X-Content-Type-Options" content="nosniff" />
        <meta http-equiv="X-Frame-Options" content="DENY" />
        <meta http-equiv="X-XSS-Protection" content="1; mode=block" />
        <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            {/* Logo Image */}
            {/* <img 
              src="https://i.ibb.co/WpzS5cwm/library-it-sona.jpg" 
              alt="Library IT Sona Logo" 
              className="h-20 w-auto mb-4"
            /> */}
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please sign in to your account to continue
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(validateEmail(e.target.value));
                    }}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(validatePassword(e.target.value));
                    }}
                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                {/* <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div> */}
              </div>

              <div className="mt-4">
                <ReCAPTCHA
                  sitekey="6LcYtSorAAAAAL8wEEDnYGqZD1kglFH1U90dS7yb"
                  onChange={(value) => setCaptchaVerified(!!value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out ${(isLoading || isLocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : isLocked ? (
                    "Account Locked"
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>

           

             
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;

 