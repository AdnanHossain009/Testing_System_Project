import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const buildWelcomeMessage = (contextSummary = {}) => {
  const overview = contextSummary.overview || {};
  const summary = contextSummary.summary || {};

  return {
    id: 'assistant-welcome',
    role: 'assistant',
    source: 'fallback',
    text: `I’m your AI Academic Assistant. I can answer questions using your real analytics from this platform. Right now your average fuzzy score is ${
      overview.averageFuzzy ?? 0
    } and your current risk status is ${summary.riskBand || 'Pending'}. Ask me about weak CLOs, weak PLOs, course priorities, risk, or how to improve before your next exam.`
  };
};

const sourceLabels = {
  gemini: 'AI assistant',
  fallback: 'Insight engine'
};

const StudentAssistantPage = () => {
  const [contextData, setContextData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const starterPrompts = useMemo(() => contextData?.starterPrompts || [], [contextData]);

  useEffect(() => {
    const loadAssistant = async () => {
      setLoading(true);
      setMessage('');

      try {
        const response = await api.get('/student-assistant/context-summary');
        const payload = response.data.data;
        setContextData(payload);
        setMessages([buildWelcomeMessage(payload)]);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load AI assistant context.');
      } finally {
        setLoading(false);
      }
    };

    loadAssistant();
  }, []);

  const sendPrompt = async (text) => {
    const nextMessage = String(text || '').trim();
    if (!nextMessage || sending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: nextMessage
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);
    setMessage('');

    try {
      const response = await api.post('/student-assistant/chat', {
        message: nextMessage
      });

      const payload = response.data.data;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: payload.reply,
          source: payload.source
        }
      ]);

      setContextData((current) =>
        current
          ? {
              ...current,
              summary: payload.summary || current.summary
            }
          : current
      );
    } catch (error) {
      const fallbackText =
        error?.response?.data?.message ||
        'The assistant could not respond right now. Please try again in a moment.';

      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          source: 'fallback',
          text: fallbackText
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const clearConversation = () => {
    if (!contextData) return;
    setMessages([buildWelcomeMessage(contextData)]);
    setInput('');
    setMessage('');
  };

  if (loading) {
    return <Loading text="Loading AI Academic Assistant..." />;
  }

  if (!contextData) {
    return <div className="error-box">{message || 'AI assistant is unavailable right now.'}</div>;
  }

  const summary = contextData.summary || {};
  const overview = contextData.overview || {};

  return (
    <div>
      <div className="page-header">
        <h1>AI Academic Assistant</h1>
        <p className="muted">
          Ask grounded questions about your own performance, weak outcomes, risk, and what to improve next.
        </p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Average Fuzzy" value={summary.fuzzyScore ?? 0} />
        <StatCard label="Risk Band" value={summary.riskBand || 'Pending'} />
        <StatCard label="Assessment Focus" value={summary.assessmentFocus || 'N/A'} />
        <StatCard label="Mastery" value={summary.masteryLabel || overview.masteryLabel || 'Pending'} />
      </div>

      <div className="grid grid-2 align-start">
        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Chat</h3>
              <p className="muted">This assistant only uses your own analytics from this system.</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={clearConversation}>
              Clear Conversation
            </button>
          </div>

          <div className="assistant-chat-shell">
            <div className="assistant-messages">
              {messages.map((entry) => (
                <div
                  key={entry.id}
                  className={`assistant-message-row ${entry.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}
                >
                  <div className={`assistant-bubble ${entry.role === 'user' ? 'assistant-bubble-user' : 'assistant-bubble-bot'}`}>
                    {entry.role === 'assistant' ? (
                      <div className="assistant-source-label">{sourceLabels[entry.source] || 'Assistant'}</div>
                    ) : null}
                    <div>{entry.text}</div>
                  </div>
                </div>
              ))}

              {sending ? (
                <div className="assistant-message-row assistant-message-bot">
                  <div className="assistant-bubble assistant-bubble-bot">
                    <div className="assistant-source-label">Thinking</div>
                    <div>Reviewing your analytics and preparing a grounded answer...</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="assistant-composer">
              <textarea
                rows="3"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about weak CLOs, risk, fuzzy score, course priority, or improvement strategy."
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendPrompt(input);
                  }
                }}
              />
              <div className="inline-actions">
                <button className="btn" type="button" onClick={() => sendPrompt(input)} disabled={sending || !input.trim()}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="stack-lg">
          <div className="card">
            <h3>Starter Prompts</h3>
            <div className="assistant-prompt-grid">
              {starterPrompts.map((prompt) => (
                <button key={prompt} className="assistant-prompt-chip" type="button" onClick={() => sendPrompt(prompt)} disabled={sending}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Your Current Focus Snapshot</h3>
            <table className="table">
              <tbody>
                <tr>
                  <th>Weak CLOs</th>
                  <td>{summary.weakClos?.length ? summary.weakClos.map((item) => item.code).join(', ') : 'None'}</td>
                </tr>
                <tr>
                  <th>Weak PLOs</th>
                  <td>{summary.weakPlos?.length ? summary.weakPlos.map((item) => item.code).join(', ') : 'None'}</td>
                </tr>
                <tr>
                  <th>Weakest Course</th>
                  <td>{summary.weakestCourse ? `${summary.weakestCourse.courseCode} - ${summary.weakestCourse.courseName}` : 'N/A'}</td>
                </tr>
                <tr>
                  <th>Strongest Course</th>
                  <td>
                    {summary.strongestCourse
                      ? `${summary.strongestCourse.courseCode} - ${summary.strongestCourse.courseName}`
                      : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3>Recent Alerts</h3>
            {contextData.recentAlerts?.length ? (
              <ul className="simple-list">
                {contextData.recentAlerts.slice(0, 4).map((alert, index) => (
                  <li key={`${alert.courseCode}-${index}`}>
                    <strong>{alert.courseCode}:</strong> {alert.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No recent alerts are available right now.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssistantPage;
