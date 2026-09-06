import { useTranslation } from "react-i18next";
import { useListConversations, useGetConversation, useSendMessage } from "@workspace/api-client-react";
import { useState } from "react";
import { useUser } from "@clerk/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { data: conversations, isLoading: isLoadingList } = useListConversations();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { data: messages, refetch: refetchMessages } = useGetConversation(selectedVehicleId || "", {
    query: { enabled: !!selectedVehicleId }
  });

  const [newMessage, setNewMessage] = useState("");
  const sendMessage = useSendMessage();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedVehicleId || !messages) return;

    // Find the other user from the conversation list to get their ID
    const conversation = Array.isArray(conversations) ? conversations.find(c => c.vehicle_id === selectedVehicleId) : undefined;
    if (!conversation) return;

    sendMessage.mutate({
      data: {
        content: newMessage,
        receiver_id: conversation.other_user.id
      }
    }, {
      onSuccess: () => {
        setNewMessage("");
        refetchMessages();
      }
    });
  };

  const selectedConversation = Array.isArray(conversations) ? conversations.find(c => c.vehicle_id === selectedVehicleId) : undefined;

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-8rem)]">
      <div className="bg-card rounded-2xl border border-border shadow-sm flex h-full overflow-hidden">
        
        {/* Sidebar List */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${selectedVehicleId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold tracking-tight">{t('messages.title')}</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingList ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>)}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y">
                {conversations.map(conv => (
                  <button
                    key={conv.vehicle_id}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedVehicleId === conv.vehicle_id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedVehicleId(conv.vehicle_id)}
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-secondary/20">
                        {conv.vehicle_cover ? (
                          <img src={conv.vehicle_cover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="font-semibold text-sm truncate pr-2">{conv.other_user.display_name}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(conv.last_message_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1 truncate">{conv.vehicle_title}</p>
                        <p className="text-sm truncate text-foreground/80">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('messages.no_conversations')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedVehicleId ? 'hidden md:flex' : 'flex'}`}>
          {selectedVehicleId && selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-muted/10">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedVehicleId(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h3 className="font-bold">{selectedConversation.other_user.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedConversation.vehicle_title}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {Array.isArray(messages) && messages.map(msg => {
                  const isMine = msg.sender_id === user?.id; // Or compare display_name? the API gives publicUser
                  // Let's assume sender.id is the clerk user id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={t('messages.type_message')} 
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendMessage.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium text-foreground mb-2">{t('messages.title')}</h3>
              <p>{t('messages.select_conversation')}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
