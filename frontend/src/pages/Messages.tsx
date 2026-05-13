import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// Örnek sohbet listesi
const sampleChats = [
  { id: 1, username: 'otaku_master', lastMessage: 'Attack on Titan harikaydı!', time: '14:30', unread: 2, online: true },
  { id: 2, username: 'anime_sever', lastMessage: 'Yeni bölüm hakkında ne düşünüyorsun?', time: '12:15', unread: 0, online: false },
  { id: 3, username: 'manga_okur', lastMessage: 'Teori: Gojo geri dönecek mi?', time: 'Dün', unread: 5, online: true },
];

export default function Messages() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  const openChat = (chatId: number) => {
    setActiveChat(chatId);
    setMessages([
      { id: 1, sender: 'them', text: 'Selam! Anime hakkında konuşalım mı?', time: '14:20' },
      { id: 2, sender: 'me', text: 'Tabii ki! Hangi animeyi düşünüyorsun?', time: '14:25' },
      { id: 3, sender: 'them', text: 'Jujutsu Kaisen son bölüm çok iyiydi bence.', time: '14:30' },
    ]);
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'me', text: messageText, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }]);
    setMessageText('');
  };

  const activeUser = sampleChats.find(c => c.id === activeChat);

  return (
    <div className="min-h-screen bg-amoled-bg dark:bg-amoled-bg bg-gray-50 transition-colors duration-300 flex">
      {/* Sohbet listesi */}
      <div className={`${activeChat ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-amoled-border dark:border-amoled-border border-gray-200`}>
        <div className="p-4 border-b border-amoled-border dark:border-amoled-border border-gray-200 flex items-center justify-between">
          <Link to="/feed" className="text-fox-500 font-bold">← Geri</Link>
          <h2 className="text-white dark:text-white text-gray-900 font-semibold">Mesajlar</h2>
          <button onClick={toggleTheme} className="text-sm">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="overflow-y-auto">
          {sampleChats.map(chat => (
            <button key={chat.id} onClick={() => openChat(chat.id)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-amoled-surface dark:hover:bg-amoled-surface hover:bg-gray-100 transition-colors border-b border-amoled-border dark:border-amoled-border border-gray-100 ${
                activeChat === chat.id ? 'bg-amoled-surface dark:bg-amoled-surface bg-gray-100' : ''
              }`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-fox-500 flex items-center justify-center text-white font-bold">
                  {chat.username[0]?.toUpperCase()}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-amoled-bg"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white dark:text-white text-gray-900 text-sm">{chat.username}</p>
                <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{chat.time}</p>
                {chat.unread > 0 && (
                  <span className="bg-fox-500 text-white text-xs px-1.5 py-0.5 rounded-full">{chat.unread}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mesaj ekranı */}
      {activeChat ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-amoled-border dark:border-amoled-border border-gray-200 flex items-center gap-3">
            <button onClick={() => setActiveChat(null)} className="md:hidden text-fox-500">←</button>
            <div className="w-10 h-10 rounded-full bg-fox-500 flex items-center justify-center text-white font-bold">
              {activeUser?.username[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white dark:text-white text-gray-900 text-sm">{activeUser?.username}</p>
              <p className="text-xs text-green-500">{activeUser?.online ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  msg.sender === 'me'
                    ? 'bg-fox-500 text-white rounded-br-md'
                    : 'bg-amoled-surface dark:bg-amoled-surface bg-gray-200 text-white dark:text-white text-gray-900 rounded-bl-md'
                }`}>
                  <p>{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-amoled-border dark:border-amoled-border border-gray-200 flex gap-2">
            <input value={messageText} onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Mesaj yaz..."
              className="flex-1 bg-amoled-surface dark:bg-amoled-surface bg-gray-100 border border-amoled-border dark:border-amoled-border border-gray-300 rounded-full px-4 py-2 text-sm text-white dark:text-white text-gray-900 focus:outline-none focus:border-fox-500" />
            <button onClick={sendMessage}
              className="bg-fox-500 text-white px-4 py-2 rounded-full text-sm hover:bg-fox-600 transition-colors">
              Gönder
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-500">
          <p>Bir sohbet seçin</p>
        </div>
      )}
    </div>
  );
}