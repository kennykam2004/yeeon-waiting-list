import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err) {
      setError('電子郵件或密碼錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-700 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-emerald-800 text-center mb-2">
          頤安三院輪候及評估管理系統
        </h1>
        <p className="text-gray-500 text-center mb-8">工作人員登入</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500 text-sm">
          請聯絡管理員開通帳戶
        </p>
      </div>
    </div>
  );
}
