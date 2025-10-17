import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        try {
            await login(username, password);
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4 font-sans">
            <div className="w-full max-w-md bg-gray-800 p-8 md:p-10 rounded-xl border border-gray-700 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Campus Security</h1>
                <p className="text-gray-400 mb-8">Welcome back! Please sign in to continue.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6 text-left">
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-300">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            required
                        />
                    </div>
                    <div className="mb-6 text-left">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" className="w-full p-3 border-none rounded-lg bg-purple-600 text-white text-base font-semibold cursor-pointer hover:bg-purple-700 transition-colors">Log In</button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;

