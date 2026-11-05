import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMessages } from '../features/messages/useMessages';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import {
  MessageSquare,
  Send,
  Plus,
  ArrowLeft,
  Search,
} from 'lucide-react';

function formatMessageTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessagesPage() {
  const { user } = useAuth();
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [mutualFollows, setMutualFollows] = useState([]);

  const {
    conversations,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    sendMessage,
    startConversation,
  } = useMessages(selectedConvoId);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default conversation on desktop if none selected
  useEffect(() => {
    if (!selectedConvoId && conversations.length > 0 && window.innerWidth >= 768) {
      setSelectedConvoId(conversations[0].id);
    }
  }, [conversations, selectedConvoId]);

  // Fetch mutual follows to pre-populate contacts
  const fetchMutualFollows = useCallback(async () => {
    if (!user) return;
    try {
      // People I follow
      const { data: iFollow } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!iFollow || iFollow.length === 0) return;

      const iFollowIds = iFollow.map((f) => f.following_id);

      // Among those, who follows me back (mutual)
      const { data: mutuals } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profile:profiles!follower_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', user.id)
        .in('follower_id', iFollowIds);

      setMutualFollows((mutuals || []).map((m) => m.profile).filter(Boolean));
    } catch (err) {
      console.error('Error fetching mutual follows:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchMutualFollows();
  }, [fetchMutualFollows]);

  const activeConversation = conversations.find((c) => c.id === selectedConvoId);

  // Build combined sidebar list: real convos + mutual follows not yet in a convo
  const convoUserIds = new Set(
    conversations.map((c) => c.otherUser?.id).filter(Boolean)
  );
  const mutualContactsNotInConvo = mutualFollows.filter((m) => !convoUserIds.has(m.id));

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvoId || isSending) return;

    const text = inputText;
    setInputText('');
    try {
      await sendMessage(selectedConvoId, text);
    } catch (err) {
      console.error('Send error:', err);
      setInputText(text);
    }
  };

  const handleSearchUsers = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .neq('id', user.id)
        .eq('status', 'active')
        .or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
        .limit(10);

      setUserSearchResults(data || []);
    } catch (err) {
      console.error('User search error:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleStartChatWithUser = async (targetUser) => {
    try {
      const convoId = await startConversation(targetUser.id);
      setSelectedConvoId(convoId);
      setIsNewChatModalOpen(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
    } catch (err) {
      console.error('Could not start conversation:', err);
    }
  };

  // Start or open chat with a mutual follow contact
  const handleOpenContactChat = async (contact) => {
    try {
      const convoId = await startConversation(contact.id);
      setSelectedConvoId(convoId);
    } catch (err) {
      console.error('Could not start conversation:', err);
    }
  };

  const hasAnything = conversations.length > 0 || mutualContactsNotInConvo.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 rounded-2xl border border-border bg-surface shadow-sm overflow-hidden flex">
        {/* Left Pane: Conversations + Contacts */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${
            selectedConvoId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-base font-semibold text-primary">Messages</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewChatModalOpen(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New chat</span>
            </Button>
          </div>

          {/* Conversations + Mutual contacts list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {isLoadingConversations ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="w-32 h-4 rounded" />
                      <Skeleton className="w-48 h-3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAnything ? (
              <div className="p-6 text-center">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Start a private chat with any Veyra member using the button above."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsNewChatModalOpen(true)}
                    >
                      Start a chat
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                {/* Real conversations */}
                {conversations.map((convo) => {
                  const other = convo.otherUser;
                  const isSelected = convo.id === selectedConvoId;

                  return (
                    <button
                      key={convo.id}
                      type="button"
                      onClick={() => setSelectedConvoId(convo.id)}
                      className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent-soft/40 dark:bg-accent-soft/10'
                          : 'hover:bg-page/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          src={other?.avatar_url}
                          name={other?.display_name || other?.username || 'Member'}
                          size="md"
                        />
                        {convo.isUnread && (
                          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-xs text-primary truncate">
                            {other?.display_name || 'Veyra Member'}
                          </span>
                          {convo.lastMessage && (
                            <span className="text-[10px] text-secondary shrink-0">
                              {formatMessageTime(convo.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-secondary truncate mt-0.5">
                          {convo.lastMessage
                            ? convo.lastMessage.body
                            : 'Say hello!'}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Mutual follows without a conversation yet */}
                {mutualContactsNotInConvo.length > 0 && (
                  <>
                    {conversations.length > 0 && (
                      <div className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-secondary bg-page/40">
                        People you follow
                      </div>
                    )}
                    {mutualContactsNotInConvo.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleOpenContactChat(contact)}
                        className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-page/50 transition-colors"
                      >
                        <Avatar
                          src={contact.avatar_url}
                          name={contact.display_name || contact.username || 'Member'}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-xs text-primary truncate block">
                            {contact.display_name || contact.username}
                          </span>
                          <p className="text-xs text-secondary truncate mt-0.5">
                            @{contact.username} &middot; Tap to message
                          </p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Thread */}
        <div
          className={`flex-1 flex flex-col bg-page/30 ${
            !selectedConvoId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Active Chat Header */}
              <div className="p-3.5 border-b border-border bg-surface flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedConvoId(null)}
                    aria-label="Back to conversations"
                    className="md:hidden p-1 rounded-lg text-secondary hover:text-primary hover:bg-page"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <Avatar
                    src={activeConversation.otherUser?.avatar_url}
                    name={activeConversation.otherUser?.display_name || 'Member'}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-primary truncate">
                      {activeConversation.otherUser?.display_name || 'Veyra Member'}
                    </p>
                    {activeConversation.otherUser?.username && (
                      <p className="text-[11px] text-secondary truncate">
                        @{activeConversation.otherUser.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="text-center py-6 text-xs text-secondary">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-secondary">
                    No messages yet. Send a message to say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words ${
                            isOwn
                              ? 'bg-accent text-white rounded-br-xs'
                              : 'bg-surface border border-border text-primary rounded-bl-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                        <span className="text-[10px] text-secondary mt-1 px-1">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-border bg-surface flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Write a message..."
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-border bg-page px-3.5 py-2 text-xs text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!inputText.trim() || isSending}
                  className="rounded-xl px-3.5"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a contact from the sidebar or start a new conversation."
              />
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Dialog
        isOpen={isNewChatModalOpen}
        onClose={() => {
          setIsNewChatModalOpen(false);
          setUserSearchQuery('');
          setUserSearchResults([]);
        }}
        title="Start a conversation"
        description="Search for a member by username or display name."
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Search by name or @username..."
              autoFocus
              className="w-full rounded-xl border border-border bg-page pl-10 pr-3.5 py-2 text-xs text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-border/60">
            {isSearchingUsers ? (
              <div className="py-4 text-center text-xs text-secondary">
                Searching members...
              </div>
            ) : userSearchResults.length === 0 && userSearchQuery ? (
              <div className="py-4 text-center text-xs text-secondary">
                No members found matching that search.
              </div>
            ) : userSearchResults.length === 0 && !userSearchQuery && mutualFollows.length > 0 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary px-2 pb-2">
                  People you follow
                </p>
                {mutualFollows.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleStartChatWithUser(contact)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-page transition-colors text-left"
                  >
                    <Avatar
                      src={contact.avatar_url}
                      name={contact.display_name || contact.username}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-primary truncate">
                        {contact.display_name}
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        @{contact.username}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              userSearchResults.map((foundUser) => (
                <button
                  key={foundUser.id}
                  type="button"
                  onClick={() => handleStartChatWithUser(foundUser)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-page transition-colors text-left"
                >
                  <Avatar
                    src={foundUser.avatar_url}
                    name={foundUser.display_name || foundUser.username}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-primary truncate">
                      {foundUser.display_name}
                    </p>
                    <p className="text-[11px] text-secondary truncate">
                      @{foundUser.username}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
