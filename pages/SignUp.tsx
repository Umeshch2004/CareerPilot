import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name || !email || !password) {
        setError('All fields are required.');
        setIsSubmitting(false);
        return;
    }
    
    if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
    }

    try {
        await register(name, email, password);
        navigate('/dashboard');
    } catch (err: any) {
        setError(err.message || 'Registration failed. Try a different email.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 mb-4">
                <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-2">Start your AI-powered career journey</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-lg">badge</span>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="Jane Doe"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-lg">mail</span>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="jane@example.com"
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
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center justify-center gap-2 mt-2"
            >
                {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                ) : (
                    "Create Account"
                )}
            </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
                Already have an account? <Link to="/signin" className="text-primary font-semibold hover:underline">Log In</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;