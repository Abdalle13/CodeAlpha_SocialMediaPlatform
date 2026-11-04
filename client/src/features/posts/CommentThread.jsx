import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useComments } from './useComments';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Trash2, CornerDownRight, MessageSquare, AlertCircle } from 'lucide-react';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CommentThread({ postId, postAuthorId }) {
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    isSubmitting,
    hasMore,
    error,
    fetchComments,
    fetchMoreComments,
    fetchReplies,
    addComment,
    deleteComment,
  } = useComments(postId);

  const [inputBody, setInputBody] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [repliesMap, setRepliesMap] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [commentError, setCommentError] = useState(null);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  const handleAddTopComment = async (e) => {
    e.preventDefault();
    if (!inputBody.trim()) return;
    setCommentError(null);

    try {
      await addComment(inputBody.trim());
      setInputBody('');
    } catch (err) {
      setCommentError(err.message || 'Could not post comment.');
    }
  };

  const handleToggleReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }

    setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    if (!repliesMap[commentId]) {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      try {
        const loadedReplies = await fetchReplies(commentId);
        setRepliesMap((prev) => ({ ...prev, [commentId]: loadedReplies }));
      } catch (err) {
        console.error('Could not load replies:', err);
      } finally {
        setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
      }
    }
  };

  const handleAddReply = async (commentId) => {
    if (!replyBody.trim()) return;
    setCommentError(null);

    try {
      const createdReply = await addComment(replyBody.trim(), commentId);
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), createdReply],
      }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      setReplyingToId(null);
      setReplyBody('');
    } catch (err) {
      setCommentError(err.message || 'Could not post reply.');
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      await deleteComment(replyId);
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: (prev[commentId] || []).filter((r) => r.id !== replyId),
      }));
    } catch (err) {
      setCommentError(err.message || 'Could not delete reply.');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {commentError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{commentError}</span>
        </div>
      )}

      {/* Add comment box */}
      {user ? (
        <form onSubmit={handleAddTopComment} className="flex gap-2.5 items-start mb-4">
          <Avatar
            src={user.user_metadata?.avatar_url}
            name={user.user_metadata?.display_name || user.email}
            size="sm"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputBody}
              onChange={(e) => setInputBody(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              className="flex-1 rounded-lg border border-border bg-page px-3 py-1.5 text-xs text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputBody.trim() || isSubmitting}
              isLoading={isSubmitting}
            >
              Post
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-2 text-xs text-secondary mb-3">
          <Link to="/login" className="text-accent hover:underline font-medium">Log in</Link> to leave a comment.
        </div>
      )}

      {/* Comment list */}
      {isLoading && comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-secondary">
          Loading discussion...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-4 text-center text-xs text-secondary">
          No comments yet. Start the conversation.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const author = comment.profiles;
            const canDelete =
              user && (user.id === comment.author_id || user.id === postAuthorId);
            const replies = repliesMap[comment.id] || [];
            const isReplying = replyingToId === comment.id;
            const hasRepliesExpanded = expandedReplies[comment.id];

            return (
              <div key={comment.id} className="text-xs group">
                <div className="flex items-start gap-2.5">
                  <Link to={author?.username ? `/profile/${author.username}` : '#'}>
                    <Avatar
                      src={author?.avatar_url}
                      name={author?.display_name || 'User'}
                      size="sm"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 bg-page/70 rounded-lg p-2.5 border border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={author?.username ? `/profile/${author.username}` : '#'}
                          className="font-medium text-primary hover:underline"
                        >
                          {author?.display_name || 'Member'}
                        </Link>
                        {author?.username && (
                          <span className="text-secondary text-[11px]">@{author.username}</span>
                        )}
                        <span className="text-secondary text-[10px]">&middot;</span>
                        <span className="text-secondary text-[10px]">
                          {formatTimestamp(comment.created_at)}
                        </span>
                      </div>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteComment(comment.id)}
                          aria-label="Delete comment"
                          className="text-secondary hover:text-red-500 transition-colors p-0.5 rounded opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="mt-1 text-primary whitespace-pre-wrap break-words leading-relaxed">
                      {comment.body}
                    </p>

                    {/* Action buttons under comment */}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-secondary">
                      {user && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToId(isReplying ? null : comment.id);
                            setReplyBody('');
                          }}
                          className="hover:text-primary font-medium transition-colors"
                        >
                          Reply
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleReplies(comment.id)}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>
                          {hasRepliesExpanded ? 'Hide replies' : 'View replies'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Reply Box */}
                {isReplying && (
                  <div className="ml-9 mt-2 flex gap-2 items-center">
                    <CornerDownRight className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <input
                      type="text"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Reply to ${author?.display_name || 'user'}...`}
                      maxLength={1000}
                      autoFocus
                      className="flex-1 rounded-md border border-border bg-page px-2.5 py-1 text-xs text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs h-7 px-2.5"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyBody.trim()}
                    >
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => setReplyingToId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Nested Replies */}
                {hasRepliesExpanded && (
                  <div className="ml-9 mt-2 space-y-2 border-l-2 border-border pl-3">
                    {loadingReplies[comment.id] ? (
                      <div className="text-[11px] text-secondary py-1">Loading replies...</div>
                    ) : replies.length === 0 ? (
                      <div className="text-[11px] text-secondary py-1">No replies yet.</div>
                    ) : (
                      replies.map((reply) => {
                        const replyAuthor = reply.profiles;
                        const canDeleteReply =
                          user && (user.id === reply.author_id || user.id === postAuthorId);

                        return (
                          <div key={reply.id} className="flex items-start gap-2 text-xs group/reply">
                            <Link to={replyAuthor?.username ? `/profile/${replyAuthor.username}` : '#'}>
                              <Avatar
                                src={replyAuthor?.avatar_url}
                                name={replyAuthor?.display_name || 'User'}
                                size="sm"
                              />
                            </Link>
                            <div className="flex-1 min-w-0 bg-page/50 rounded-lg p-2 border border-border/40">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={replyAuthor?.username ? `/profile/${replyAuthor.username}` : '#'}
                                    className="font-medium text-primary hover:underline text-[11px]"
                                  >
                                    {replyAuthor?.display_name || 'Member'}
                                  </Link>
                                  <span className="text-secondary text-[10px]">
                                    {formatTimestamp(reply.created_at)}
                                  </span>
                                </div>
                                {canDeleteReply && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(comment.id, reply.id)}
                                    aria-label="Delete reply"
                                    className="text-secondary hover:text-red-500 transition-colors p-0.5 rounded opacity-0 group-hover/reply:opacity-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-primary whitespace-pre-wrap break-words text-xs">
                                {reply.body}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMoreComments}
                className="text-xs text-secondary hover:text-primary"
              >
                Load older comments
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
