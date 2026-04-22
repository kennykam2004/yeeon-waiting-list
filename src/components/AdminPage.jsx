import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export default function AdminPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const listUsers = httpsCallable(functions, 'listUsers');
      const result = await listUsers();
      setUsers(result.data.users || []);
      setError('');
    } catch (err) {
      setError('載入用戶失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setMessage('');

    try {
      const createUser = httpsCallable(functions, 'createUser');
      await createUser({ email: newEmail, password: newPassword });
      setMessage(`成功創建用戶: ${newEmail}`);
      setNewEmail('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      setError(err.message || '創建用戶失敗');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (uid, email) => {
    if (!window.confirm(`確定要刪除用戶 ${email}？`)) return;

    try {
      const deleteUser = httpsCallable(functions, 'deleteUser');
      await deleteUser({ uid });
      setMessage(`已刪除用戶: ${email}`);
      loadUsers();
    } catch (err) {
      setError(err.message || '刪除用戶失敗');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-800">用戶管理</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          返回
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">新增工作人員帳號</h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg p-3"
                placeholder="staff@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初始密碼
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-lg p-3"
                placeholder="至少6位字符"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold"
          >
            {creating ? '創建中...' : '創建用戶'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">所有用戶列表</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">載入中...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">UID</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">創建時間</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    暫無用戶
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uid} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{user.uid}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.creationTime}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUser(user.uid, user.email)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
