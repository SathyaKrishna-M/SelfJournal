import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from './authService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function RecoveryPage() {
    const navigate = useNavigate();
    const [recoveryKey, setRecoveryKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const result = await AuthService.recover(recoveryKey, newPassword);
            if (result) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/journal');
                }, 2000);
            } else {
                setError('Invalid Recovery Key. Please check and try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Recovery failed.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-stone-100 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-serif text-stone-900 mb-2">Access Restored</h2>
                    <p className="text-stone-600">Your password has been reset. Redirecting to journal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-stone-100">
                <Link to="/login" className="inline-flex items-center text-stone-500 hover:text-stone-800 text-sm mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                </Link>

                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-6 h-6 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-serif text-stone-900 mb-2">Recover Access</h1>
                    <p className="text-stone-500">Enter your Recovery Key to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Recovery Key"
                        type="text"
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="font-mono"
                        required
                        autoCapitalize="characters"
                    />

                    <div className="border-t border-stone-100 my-4 pt-4">
                        <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New strong password"
                            required
                        />
                    </div>

                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        error={error}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Restoring Access...' : 'Reset Password & Unlock'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
