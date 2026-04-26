import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const notificationItems = notifications || [];

  useEffect(() => {
    const run = async () => {
      try {
        await loadNotifications();
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading && !notifications) return <Loading text="Loading notifications..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p className="muted">
          Approval requests, enrollment updates, and workflow alerts are collected here for every role.
        </p>
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Inbox</h3>
            <p className="muted">{unreadCount} unread notifications</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={markAllRead} disabled={!unreadCount}>
            Mark All Read
          </button>
        </div>

        {notificationItems.length === 0 ? (
          <p className="muted">No notifications found.</p>
        ) : (
          notificationItems.map((item) => (
            <div key={item._id} className={`notice ${item.read ? 'notice-read' : ''}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small className="muted">{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              {!item.read ? (
                <button className="btn btn-secondary" onClick={() => markRead(item._id)}>
                  Mark Read
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
