import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "nova-ai-chats";

const createNewChat = () => ({
  id: Date.now().toString(),
  title: "New conversation",
  messages: [],
});

function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Could not load saved chats:", error);
    }

    return [createNewChat()];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch {
      // Ignore storage errors.
    }

    return null;
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  const createChat = () => {
    const newChat = createNewChat();

    setChats((previous) => [newChat, ...previous]);
    setActiveChatId(newChat.id);
    setMessage("");
  };

  const deleteChat = (chatId) => {
    setChats((previous) => {
      const remaining = previous.filter((chat) => chat.id !== chatId);

      if (remaining.length === 0) {
        const newChat = createNewChat();
        setActiveChatId(newChat.id);
        return [newChat];
      }

      if (chatId === activeChatId) {
        setActiveChatId(remaining[0].id);
      }

      return remaining;
    });
  };

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading || !activeChat) return;

    const userMessage = {
      type: "user",
      text,
    };

    const updatedMessages = [...activeChat.messages, userMessage];

    const newTitle =
      activeChat.messages.length === 0
        ? text.length > 35
          ? `${text.slice(0, 35)}...`
          : text
        : activeChat.title;

    setChats((previous) =>
      previous.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: newTitle,
              messages: updatedMessages,
            }
          : chat
      )
    );

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
  "https://nova-ai-backend-dxyv.onrender.com/api/chat",
  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.type === "user" ? "user" : "model",
            text: msg.text,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  {
                    type: "ai",
                    text: data.reply,
                  },
                ],
              }
            : chat
        )
      );
    } catch (error) {
      console.error("NOVA error:", error);

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...updatedMessages,
                  {
                    type: "ai",
                    text: `NOVA error: ${error.message}`,
                  },
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const usePrompt = (prompt) => {
    setMessage(prompt);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">N</div>

          <div>
            <h2>NOVA AI</h2>
            <span>One AI. Every possibility.</span>
          </div>
        </div>

        <button className="new-chat-button" onClick={createChat}>
          <span>＋</span>
          New chat
        </button>

        <div className="chat-section">
          <div className="section-title">Recent conversations</div>

          <div className="chat-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  chat.id === activeChatId ? "active" : ""
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="chat-item-content">
                  <span className="chat-icon">✦</span>

                  <span className="chat-title">
                    {chat.title}
                  </span>
                </div>

                <button
                  className="delete-chat"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  title="Delete conversation"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="nova-status">
            <span className="status-dot"></span>
            NOVA is online
          </div>
          <div className="creator-credit">
  <span>Designed & developed by</span>
  <strong>Gangadharan S</strong>
</div>
</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-logo small">N</div>
            <strong>NOVA AI</strong>
          </div>

          <div className="conversation-name">
            {activeChat?.title || "New conversation"}
          </div>
        </header>

        <div className="chat-area">
          {activeChat?.messages.length === 0 ? (
            <div className="welcome">
              <div className="nova-orb">
                <div className="orb-core">N</div>
                <div className="orb-ring ring-one"></div>
                <div className="orb-ring ring-two"></div>
              </div>

              <div className="welcome-badge">
                <span className="badge-dot"></span>
                Your intelligent AI companion
              </div>

              <h1>
                One AI.
                <br />
                <span>Every possibility.</span>
              </h1>

              <p>
                Ask questions, create ideas, solve problems, write,
                learn, and explore with NOVA.
              </p>

              <div className="capabilities">
                <div className="capability-card">
                  <div className="capability-icon">✦</div>
                  <strong>Explore</strong>
                  <span>Understand anything</span>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">⌁</div>
                  <strong>Create</strong>
                  <span>Turn ideas into reality</span>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">◈</div>
                  <strong>Solve</strong>
                  <span>Work through problems</span>
                </div>

                <div className="capability-card">
                  <div className="capability-icon">∞</div>
                  <strong>Learn</strong>
                  <span>Grow your knowledge</span>
                </div>
              </div>

              <div className="prompt-heading">
                Try asking NOVA
              </div>

              <div className="suggestions">
                <button
                  onClick={() =>
                    usePrompt(
                      "Give me 5 innovative project ideas for a college student"
                    )
                  }
                >
                  <span className="suggestion-icon">💡</span>
                  <div>
                    <strong>Generate ideas</strong>
                    <span>Give me creative project ideas</span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    usePrompt(
                      "Explain artificial intelligence in a simple way"
                    )
                  }
                >
                  <span className="suggestion-icon">🧠</span>
                  <div>
                    <strong>Learn something</strong>
                    <span>Explain a complex topic simply</span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    usePrompt(
                      "Help me create a productive daily schedule"
                    )
                  }
                >
                  <span className="suggestion-icon">⚡</span>
                  <div>
                    <strong>Be productive</strong>
                    <span>Help organize my day</span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    usePrompt(
                      "Write a professional introduction for me"
                    )
                  }
                >
                  <span className="suggestion-icon">✍️</span>
                  <div>
                    <strong>Write something</strong>
                    <span>Create professional content</span>
                  </div>
                </button>
              </div>

              <div className="welcome-footer">
                <span>Powered by AI</span>
                <span>•</span>
                <span>Built with NOVA</span>
              </div>
            </div>
          ) : (
            <div className="messages">
              {activeChat.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-row ${msg.type}`}
                >
                  <div className="message-avatar">
                    {msg.type === "user" ? "G" : "N"}
                  </div>

                  <div className="message-content">
                    <div className="message-name">
                      {msg.type === "user" ? "You" : "NOVA"}
                    </div>

                    <div className="message-text">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row ai">
                  <div className="message-avatar">N</div>

                  <div className="message-content">
                    <div className="message-name">NOVA</div>

                    <div className="typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-wrapper">
          <div className="composer">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NOVA anything..."
              rows="1"
              disabled={loading}
            />

            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim() || loading}
            >
              ↑
            </button>
          </div>

          <div className="composer-note">
            NOVA can make mistakes. Check important information.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;