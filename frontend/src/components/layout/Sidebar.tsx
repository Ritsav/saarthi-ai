import { BarChart3, FileText, MessageSquare, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const { t } = useTranslation();
  const { chats, createChat, deleteChat } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams();

  const handleNewChat = async () => {
    const chat = await createChat();
    navigate(`/chat/${chat.id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button onClick={handleNewChat} className="w-full bg-primary hover:bg-primary-800">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {t('chat.newChat')}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-200 ${chatId === chat.id ? 'bg-slate-200 font-medium' : ''}`}
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="flex-1 truncate">{chat.title || t('chat.newChat')}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  void deleteChat(chat.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="space-y-1 border-t border-slate-200 p-3">
        <Button
          variant="ghost"
          className={`w-full justify-start ${location.pathname.startsWith('/documents') ? 'bg-slate-200' : ''}`}
          onClick={() => navigate('/documents')}
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('nav.documents')}
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start ${location.pathname.startsWith('/dashboard') ? 'bg-slate-200' : ''}`}
          onClick={() => navigate('/dashboard/COMPANY_REGISTRATION')}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {t('nav.dashboard')}
        </Button>
      </div>
    </div>
  );
}
