import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function useMessages(activeConversationId = null) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const activeConvoRef = useRef(activeConversationId);
  activeConvoRef.current = activeConversationId;

  // 1. Fetch conversations for user
  const fetchConversations = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);
    try {
      // Fetch all conversations where user is participant
      const { data: myParticipations, error: partErr } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          joined_at,
          last_read_at,
          conversation:conversations (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (partErr) throw partErr;

      const convoIds = (myParticipations || []).map((p) => p.conversation_id);
      if (convoIds.length === 0) {
        setConversations([]);
        setIsLoadingConversations(false);
        return;
      }

      // Fetch the other participant in each conversation
      const { data: otherParticipants, error: otherErr } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          profile:profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('conversation_id', convoIds)
        .neq('user_id', user.id);

      if (otherErr) throw otherErr;

      // Fetch last message for each conversation
      const { data: recentMessages, error: msgErr } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at, sender_id')
        .in('conversation_id', convoIds)
        .order('created_at', { ascending: false });

      if (msgErr) throw msgErr;

      const convos = (myParticipations || []).map((part) => {
        const other = (otherParticipants || []).find(
          (o) => o.conversation_id === part.conversation_id
        );
        const lastMsg = (recentMessages || []).find(
          (m) => m.conversation_id === part.conversation_id
        );

        return {
          id: part.conversation_id,
          updated_at: lastMsg?.created_at || part.conversation?.updated_at || part.joined_at,
          otherUser: other?.profile || null,
          lastMessage: lastMsg || null,
          lastReadAt: part.last_read_at,
          isUnread:
            lastMsg &&
            lastMsg.sender_id !== user.id &&
            (!part.last_read_at || new Date(lastMsg.created_at) > new Date(part.last_read_at)),
        };
      });

      // Sort by latest message date
      convos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setConversations(convos);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Could not load conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // 2. Fetch messages for active conversation
  const fetchMessages = useCallback(async (convoId) => {
    if (!isSupabaseConfigured() || !convoId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const { data, error: msgErr } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at,
          sender:profiles!sender_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      setMessages(data || []);

      // Mark conversation read in background
      await supabase.rpc('mark_conversation_read', { p_convo_id: convoId }).catch(() => {});
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // 3. Realtime subscriptions
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);

      const channel = supabase
        .channel(`messages:${activeConversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${activeConversationId}`,
          },
          (payload) => {
            const newMsg = payload.new;
            // Fetch sender details or append
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConversationId, fetchMessages, fetchConversations]);

  // 4. Send message
  const sendMessage = async (convoId, body) => {
    if (!user || !convoId || !body?.trim()) return;

    setIsSending(true);
    try {
      const { data, error: sendErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: convoId,
          sender_id: user.id,
          body: body.trim(),
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          body,
          created_at,
          sender:profiles!sender_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (sendErr) throw sendErr;

      setMessages((prev) => [...prev, data]);
      fetchConversations();
      return data;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  // 5. Start or get conversation with another user
  const startConversation = async (recipientUserId) => {
    if (!user || !recipientUserId) return;

    try {
      const { data: convoId, error: rpcErr } = await supabase.rpc(
        'start_or_get_direct_conversation',
        { p_recipient_id: recipientUserId }
      );

      if (rpcErr) throw rpcErr;

      await fetchConversations();
      return convoId;
    } catch (err) {
      console.error('Error starting conversation:', err);
      throw err;
    }
  };

  const unreadCount = conversations.filter((c) => c.isUnread).length;

  return {
    conversations,
    messages,
    unreadCount,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,
    sendMessage,
    startConversation,
    refreshConversations: fetchConversations,
    refreshMessages: () => activeConversationId && fetchMessages(activeConversationId),
  };
}

