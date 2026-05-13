import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('animefox-token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-amoled-bg dark:bg-amoled-bg bg-gray-50 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to="/feed" className="text-fox-500 hover:text-fox-400 mb-6 inline-block">
          ← Feed'e don
        </Link>

        <h1 className="text-2xl font-bold text-white dark:text-white text-gray-900 mb-6">Ayarlar</h1>

        <div className="bg-amoled-card dark:bg-amoled-card bg-white border border-amoled-border dark:border-amoled-border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white dark:text-white text-gray-900">Gorunum</p>
              <p className="text-sm text-gray-500">Su an: {theme === 'dark' ? 'Karanlik Mod' : 'Aydinlik Mod'}</p>
            </div>
            <button onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-fox-500' : 'bg-gray-300'
              }`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="bg-amoled-card dark:bg-amoled-card bg-white border border-amoled-border dark:border-amoled-border border-gray-200 rounded-xl p-4 mb-4">
          <p className="font-semibold text-white dark:text-white text-gray-900 mb-3">Hesap</p>
          <button className="w-full text-left p-2 hover:bg-amoled-surface dark:hover:bg-amoled-surface hover:bg-gray-100 rounded text-gray-400 text-sm">
            E-posta degistir
          </button>
          <button className="w-full text-left p-2 hover:bg-amoled-surface dark:hover:bg-amoled-surface hover:bg-gray-100 rounded text-gray-400 text-sm">
            Sifre degistir
          </button>
          <button className="w-full text-left p-2 hover:bg-amoled-surface dark:hover:bg-amoled-surface hover:bg-gray-100 rounded text-gray-400 text-sm">
            Profili duzenle
          </button>
        </div>

        <div className="bg-amoled-card dark:bg-amoled-card bg-white border border-fox-500/30 rounded-xl p-4 mb-4 animate-glow">
          <p className="font-semibold text-fox-500 mb-1">AnimeFox Premium</p>
          <p className="text-sm text-gray-400 mb-3">Ozel ozelliklere erismek icin premium uyelige gecin.</p>
          <button className="bg-fox-500 text-white px-4 py-2 rounded-full text-sm hover:bg-fox-600 transition-colors">
            Premium'a Yukselt
          </button>
        </div>

        <button onClick={handleLogout}
          className="w-full bg-red-500/10 border border-red-500 text-red-500 py-3 rounded-xl text-sm hover:bg-red-500 hover:text-white transition-colors">
          Cikis Yap
        </button>
      </div>
    </div>
  );
}