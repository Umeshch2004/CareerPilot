import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
        setError('Please fill in all fields');
        setIsSubmitting(false);
        return;
    }

    try {
        await login(cleanEmail, cleanPassword);
        navigate('/dashboard');
    } catch (err: any) {
        setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Sign in to continue your career journey</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-lg">mail</span>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-lg">lock</span>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                ) : (
                    "Sign In"
                )}
            </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
                Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;