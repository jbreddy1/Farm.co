import React from 'react';
import './App.css'; // reuse global styles

/******************** Sidebar *********************/
function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: '💬' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'reminders', label: 'Reminders', icon: '⏰' },
    { id: 'weather', label: 'Weather', icon: '☀️' }
    // Add more as you flesh out other features
  ];

  return (
    <div className="sidebar">
      <div className="logo">Farmer Assistant</div>
      <ul className="nav-list">
        {tabs.map((t) => (
          <li
            key={t.id}
            className={activeTab === t.id ? 'active' : ''}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="icon">{t.icon}</span>
            {t.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/******************** Chat Tab *********************/
function ChatTab({ chatHistory, chatMessage, setChatMessage, handleChatSubmit, loading }) {
  return (
    <div className="tab-content">
      <div className="chat-history">
        {chatHistory.length === 0 && <div className="empty">No messages yet.</div>}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className="chat-item">
            <div className="question">{msg.question}</div>
            <div className="answer">{msg.answer}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleChatSubmit} className="chat-input">
        <input
          type="text"
          placeholder="Ask about farming..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

/******************** Expenses Tab *********************/
function ExpensesTab({ expenseForm, setExpenseForm, handleExpenseSubmit, expenses, loading }) {
  return (
    <div className="tab-content">
      <form onSubmit={handleExpenseSubmit} className="form-inline">
        <input
          type="text"
          placeholder="Category"
          value={expenseForm.category}
          onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={expenseForm.amount}
          onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Note"
          value={expenseForm.note}
          onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add'}
        </button>
      </form>
      <div className="list">
        {expenses.map((exp) => (
          <div key={exp._id || Math.random()} className="list-item">
            {exp.category} — ₹{exp.amount}
          </div>
        ))}
        {expenses.length === 0 && <div className="empty">No expenses yet.</div>}
      </div>
    </div>
  );
}

/******************** Reminders Tab *********************/
function RemindersTab({ reminderForm, setReminderForm, handleReminderSubmit, reminders, loading }) {
  return (
    <div className="tab-content">
      <form onSubmit={handleReminderSubmit} className="form-inline">
        <input
          type="text"
          placeholder="Reminder message"
          value={reminderForm.message}
          onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          value={reminderForm.date}
          onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
      <div className="list">
        {reminders.map((r) => (
          <div key={r._id || Math.random()} className="list-item">
            {new Date(r.date).toLocaleString()} — {r.message}
          </div>
        ))}
        {reminders.length === 0 && <div className="empty">No reminders yet.</div>}
      </div>
    </div>
  );
}

/******************** Weather Tab *********************/
function WeatherTab({ weatherLocation, setWeatherLocation, weatherLang, setWeatherLang, fetchWeather, weatherData, weatherLoading }) {
  return (
    <div className="tab-content">
      <div className="form-inline">
        <input
          type="text"
          placeholder="Enter city"
          value={weatherLocation}
          onChange={(e) => setWeatherLocation(e.target.value)}
        />
        <select value={weatherLang} onChange={(e) => setWeatherLang(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
        <button onClick={fetchWeather} disabled={weatherLoading}>
          {weatherLoading ? '...' : 'Get'}
        </button>
      </div>
      {weatherData && (
        <pre className="weather-output">{JSON.stringify(weatherData, null, 2)}</pre>
      )}
    </div>
  );
}

/******************** MainApp *********************/
export default function MainApp(props) {
  const {
    activeTab,
    setActiveTab,
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
    loading,
    expenseForm,
    setExpenseForm,
    handleExpenseSubmit,
    expenses,
    reminderForm,
    setReminderForm,
    handleReminderSubmit,
    reminders,
    weatherLocation,
    setWeatherLocation,
    weatherLang,
    setWeatherLang,
    fetchWeather,
    weatherData,
    weatherLoading
  } = props;

  const renderTab = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatTab
            chatHistory={chatHistory}
            chatMessage={chatMessage}
            setChatMessage={setChatMessage}
            handleChatSubmit={handleChatSubmit}
            loading={loading}
          />
        );
      case 'expenses':
        return (
          <ExpensesTab
            expenseForm={expenseForm}
            setExpenseForm={setExpenseForm}
            handleExpenseSubmit={handleExpenseSubmit}
            expenses={expenses}
            loading={loading}
          />
        );
      case 'reminders':
        return (
          <RemindersTab
            reminderForm={reminderForm}
            setReminderForm={setReminderForm}
            handleReminderSubmit={handleReminderSubmit}
            reminders={reminders}
            loading={loading}
          />
        );
      case 'weather':
        return (
          <WeatherTab
            weatherLocation={weatherLocation}
            setWeatherLocation={setWeatherLocation}
            weatherLang={weatherLang}
            setWeatherLang={setWeatherLang}
            fetchWeather={fetchWeather}
            weatherData={weatherData}
            weatherLoading={weatherLoading}
          />
        );
      default:
        return <div style={{ padding: 24 }}>Feature coming soon.</div>;
    }
  };

  return (
    <div className="main-app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="content-area">{renderTab()}</div>
    </div>
  );
}
