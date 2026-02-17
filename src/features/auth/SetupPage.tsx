import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from './authService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SetupPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
    const [confirmedBackup, setConfirmedBackup] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const key = await AuthService.setup(password);
            setRecoveryKey(key);
        } catch (err) {
            console.error(err);
            setError('Failed to setup journal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        if (!confirmedBackup) return;
        navigate('/journal');
    };

    if (recoveryKey) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-stone-100">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-serif text-stone-900 mb-2">Save Your Recovery Key</h1>
                        <p className="text-stone-600 text-sm">
                            This is the <span className="font-bold text-red-600">ONLY</span> way to recover your journal if you forget your password.
                        </p>
                    </div>

                    <div className="bg-stone-100 p-4 rounded-lg mb-6 border border-stone-200">
                        <code className="block text-center text-lg font-mono tracking-wider text-stone-800 break-all select-all">
                            {recoveryKey}
                        </code>
                    </div>

                    <div className="flex items-start gap-3 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-800">
                            We cannot recover your password for you. If you lose this key and forget your password, your data will be lost forever.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            id="confirm"
                            className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-500"
                            checked={confirmedBackup}
                            onChange={(e) => setConfirmedBackup(e.target.checked)}
                        />
                        <label htmlFor="confirm" className="text-sm text-stone-700 select-none cursor-pointer">
                            I have written down my recovery key safely.
                        </label>
                    </div>

                    <Button
                        onClick={handleFinish}
                        disabled={!confirmedBackup}
                        className="w-full"
                    >
                        Enter Journal
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-stone-100">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-stone-600" />
                    </div>
                    <h1 className="text-3xl font-serif text-stone-900 mb-2">Create Your Journal</h1>
                    <p className="text-stone-500">Set a strong password to encrypt your entries.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Master Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        error={error}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Generating Store...' : 'Create Secure Journal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
