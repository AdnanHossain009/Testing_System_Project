import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const AccountSettingsPage = () => {
  const { user, syncUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  const setFeedback = (nextMessage, type = 'success') => {
    setMessage(nextMessage);
    setMessageType(type);
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setEmailSaving(true);
    setFeedback('');

    try {
      const response = await api.patch('/auth/me', { email });
      syncUser(response.data.data.user);
      setEmail(response.data.data.user.email);
      setFeedback('Email updated successfully.');
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to update email.', 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setFeedback('');

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Current password, new password, and confirm password are required.');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirm password do not match.');
      }

      const response = await api.patch('/auth/me', {
        currentPassword,
        newPassword
      });

      syncUser(response.data.data.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback('Password updated successfully.');
    } catch (error) {
      setFeedback(error?.response?.data?.message || error.message || 'Failed to update password.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Account Settings</h1>
        <p className="muted">
          Update your own login email and password. This page is available for every signed-in user.
        </p>
      </div>

      {message ? <div className={messageType === 'error' ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-3">
        <div className="card stat-card">
          <span className="stat-label">Name</span>
          <span className="stat-value" style={{ fontSize: '1.4rem' }}>
            {user?.name || 'N/A'}
          </span>
          <span className="muted">{user?.role || 'N/A'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Department</span>
          <span className="stat-value" style={{ fontSize: '1.4rem' }}>
            {user?.department?.code || user?.department?.name || 'N/A'}
          </span>
          <span className="muted">Program: {user?.program?.code || user?.program?.name || 'N/A'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Identity</span>
          <span className="stat-value" style={{ fontSize: '1.4rem' }}>
            {user?.studentId || user?.facultyId || 'General Account'}
          </span>
          <span className="muted">Current email: {user?.email || 'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-2">
        <form className="card" onSubmit={handleEmailSubmit}>
          <h3>Update Email</h3>
          <p className="muted">Change the email address you use for login.</p>

          <label>New Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

          <button className="btn" disabled={emailSaving}>
            {emailSaving ? 'Saving...' : 'Save Email'}
          </button>
        </form>

        <form className="card" onSubmit={handlePasswordSubmit}>
          <h3>Update Password</h3>
          <p className="muted">Use your current password once, then choose a new password with at least 6 characters.</p>

          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />

          <button className="btn" disabled={passwordSaving}>
            {passwordSaving ? 'Saving...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
