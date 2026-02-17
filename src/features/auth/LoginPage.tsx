import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from './authService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await AuthService.login(password);
            if (success) {
                navigate('/journal');
            } else {
                setError('Incorrect password.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-dark-bg flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md bg-white dark:bg-stone-900/50 dark:backdrop-blur-md rounded-xl shadow-lg p-8 border border-stone-100 dark:border-stone-800">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-stone-600 dark:text-primary-300" />
                    </div>
                    <h1 className="text-3xl font-serif text-stone-900 dark:text-dark-text mb-2">My Journal</h1>
                    <p className="text-stone-500 dark:text-primary-300">Your secure, encrypted space.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoFocus
                        required
                        error={error}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Decrypting...' : 'Unlock Journal'}
                        </Button>
                    </div>

                    <div className="text-center mt-4">
                        <Link to="/recover" className="text-sm text-stone-500 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-300 underline">
                            Forgot Password?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
