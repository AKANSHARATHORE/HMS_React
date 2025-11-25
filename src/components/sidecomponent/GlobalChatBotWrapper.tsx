import ChatBot from '../dashboard/ChatBot';

function GlobalChatBotWrapper() {
  // Only render on non-login routes using window.location.pathname
  if (window.location.pathname === '/' || window.location.pathname.toLowerCase().includes('login')) {
    return null;
  }
  return <ChatBot />;
}

export default GlobalChatBotWrapper;
