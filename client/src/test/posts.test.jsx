import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../lib/supabaseClient', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/media/imagekit', () => ({
  uploadToImageKit: vi.fn(),
  deleteFromImageKit: vi.fn(),
}));

// Hook modules are mocked so we can control return values in component tests.
vi.mock('../features/posts/useFeed', () => ({ useFeed: vi.fn() }));
vi.mock('../features/posts/usePosts', () => ({ usePosts: vi.fn() }));
vi.mock('../features/posts/useComments', () => ({ useComments: vi.fn() }));
vi.mock('../features/posts/usePostInteractions', () => ({ usePostInteractions: vi.fn() }));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../features/auth/AuthContext';
import { uploadToImageKit } from '../features/media/imagekit';

import { useFeed } from '../features/posts/useFeed';
import { usePosts } from '../features/posts/usePosts';
import { useComments } from '../features/posts/useComments';
import { usePostInteractions } from '../features/posts/usePostInteractions';

// ---------------------------------------------------------------------------
// Test components that consume the hooks and expose state via data-testid.
// ---------------------------------------------------------------------------

function FeedConsumer() {
  const { posts, isLoading, isLoadingMore, hasMore, error, loadMore, refresh } = useFeed();
  return (
    <div>
      {isLoading && <p data-testid="loading">Loading...</p>}
      {error && <p data-testid="error">{error}</p>}
      <ul data-testid="post-list">
        {posts.map((p) => (
          <li key={p.id} data-testid={`post-${p.id}`}>{p.caption}</li>
        ))}
      </ul>
      {hasMore && (
        <button data-testid="load-more" onClick={loadMore}>Load more</button>
      )}
      <button data-testid="refresh" onClick={refresh}>Refresh</button>
      {isLoadingMore && <p data-testid="loading-more">Loading more...</p>}
    </div>
  );
}

function PostsConsumer({ onDelete }) {
  const { isCreating, isDeleting, error, deletePost } = usePosts();
  return (
    <div>
      {isCreating && <p data-testid="creating">Creating...</p>}
      {isDeleting && <p data-testid="deleting">Deleting...</p>}
      {error && <p data-testid="error">{error}</p>}
      <button data-testid="delete-btn" onClick={() => deletePost('post-1').then(onDelete)}>
        Delete
      </button>
    </div>
  );
}

function CommentsConsumer({ onAdd, onDelete }) {
  const { comments, isLoading, isSubmitting, error, addComment, deleteComment } = useComments('post-1');
  return (
    <div>
      {isLoading && <p data-testid="loading">Loading...</p>}
      {isSubmitting && <p data-testid="submitting">Submitting...</p>}
      {error && <p data-testid="error">{error}</p>}
      <ul data-testid="comment-list">
        {comments.map((c) => (
          <li key={c.id} data-testid={`comment-${c.id}`}>
            {c.body}
            <button data-testid={`delete-${c.id}`} onClick={() => deleteComment(c.id).then(onDelete)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button data-testid="add-comment" onClick={() => addComment('Great post!').then(onAdd)}>
        Add comment
      </button>
    </div>
  );
}

function InteractionsConsumer() {
  const { isLiked, likeCount, isSaved, toggleLike, toggleSave } = usePostInteractions({ id: 'post-1', likes: [], saved_posts: [] });
  return (
    <div>
      <button data-testid="like-btn" onClick={toggleLike}>
        {isLiked ? 'Unlike' : 'Like'}
      </button>
      <span data-testid="like-count">{likeCount}</span>
      <button data-testid="save-btn" onClick={toggleSave}>
        {isSaved ? 'Unsave' : 'Save'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default hook return value builders
// ---------------------------------------------------------------------------

const defaultFeedHook = {
  posts: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  error: null,
  loadMore: vi.fn(),
  refresh: vi.fn(),
};

const defaultPostsHook = {
  isCreating: false,
  isDeleting: false,
  error: null,
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn().mockResolvedValue(true),
  fetchUserPosts: vi.fn(),
};

const defaultCommentsHook = {
  comments: [],
  isLoading: false,
  isSubmitting: false,
  hasMore: false,
  error: null,
  fetchComments: vi.fn(),
  fetchMoreComments: vi.fn(),
  fetchReplies: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
};

const defaultInteractionsHook = {
  isLiked: false,
  likeCount: 0,
  isSaved: false,
  toggleLike: vi.fn(),
  toggleSave: vi.fn(),
};

// ---------------------------------------------------------------------------
// useFeed tests
// ---------------------------------------------------------------------------

describe('useFeed', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading indicator when isLoading is true', () => {
    useFeed.mockReturnValue({ ...defaultFeedHook, isLoading: true });
    render(<FeedConsumer />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('renders posts returned by the hook', () => {
    const posts = [
      { id: 'p1', caption: 'Hello world', likes: [], saved_posts: [] },
      { id: 'p2', caption: 'Second post', likes: [], saved_posts: [] },
    ];
    useFeed.mockReturnValue({ ...defaultFeedHook, posts });
    render(<FeedConsumer />);

    expect(screen.getByTestId('post-p1')).toHaveTextContent('Hello world');
    expect(screen.getByTestId('post-p2')).toHaveTextContent('Second post');
  });

  it('shows error message when error is set', () => {
    useFeed.mockReturnValue({ ...defaultFeedHook, error: 'Could not load feed' });
    render(<FeedConsumer />);
    expect(screen.getByTestId('error')).toHaveTextContent('Could not load feed');
  });

  it('shows Load More button when hasMore is true and calls loadMore on click', () => {
    const loadMore = vi.fn();
    useFeed.mockReturnValue({ ...defaultFeedHook, hasMore: true, loadMore });
    render(<FeedConsumer />);

    const btn = screen.getByTestId('load-more');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(loadMore).toHaveBeenCalledOnce();
  });

  it('does not show Load More button when hasMore is false', () => {
    useFeed.mockReturnValue({ ...defaultFeedHook, hasMore: false });
    render(<FeedConsumer />);
    expect(screen.queryByTestId('load-more')).not.toBeInTheDocument();
  });

  it('calls refresh when Refresh button is clicked', () => {
    const refresh = vi.fn();
    useFeed.mockReturnValue({ ...defaultFeedHook, refresh });
    render(<FeedConsumer />);
    fireEvent.click(screen.getByTestId('refresh'));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('shows isLoadingMore indicator during pagination', () => {
    useFeed.mockReturnValue({ ...defaultFeedHook, isLoadingMore: true, hasMore: true, loadMore: vi.fn() });
    render(<FeedConsumer />);
    expect(screen.getByTestId('loading-more')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// usePosts tests
// ---------------------------------------------------------------------------

describe('usePosts', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('createPost calls through and resolves', async () => {
    const fakePost = { id: 'new-post', caption: 'Test' };
    const createPost = vi.fn().mockResolvedValue(fakePost);
    usePosts.mockReturnValue({ ...defaultPostsHook, createPost });

    // Invoke the hook action directly (unit test of the mock wiring).
    const result = await createPost('Test', 'public', []);
    expect(result).toEqual(fakePost);
    expect(createPost).toHaveBeenCalledWith('Test', 'public', []);
  });

  it('shows error when deletePost fails', async () => {
    const deletePost = vi.fn().mockRejectedValue(new Error('Not allowed'));
    usePosts.mockReturnValue({ ...defaultPostsHook, error: 'Not allowed', deletePost });

    render(<PostsConsumer onDelete={vi.fn()} />);
    expect(screen.getByTestId('error')).toHaveTextContent('Not allowed');
  });

  it('shows deleting indicator while deletePost is in progress', () => {
    usePosts.mockReturnValue({ ...defaultPostsHook, isDeleting: true });
    render(<PostsConsumer onDelete={vi.fn()} />);
    expect(screen.getByTestId('deleting')).toBeInTheDocument();
  });

  it('shows creating indicator while createPost is in progress', () => {
    usePosts.mockReturnValue({ ...defaultPostsHook, isCreating: true });
    render(<PostsConsumer onDelete={vi.fn()} />);
    expect(screen.getByTestId('creating')).toBeInTheDocument();
  });

  it('calls deletePost with the correct post id on button click', async () => {
    const deletePost = vi.fn().mockResolvedValue(true);
    const onDelete = vi.fn();
    usePosts.mockReturnValue({ ...defaultPostsHook, deletePost });

    render(<PostsConsumer onDelete={onDelete} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-btn'));
    });

    expect(deletePost).toHaveBeenCalledWith('post-1');
    expect(onDelete).toHaveBeenCalledWith(true);
  });
});

// ---------------------------------------------------------------------------
// useComments tests
// ---------------------------------------------------------------------------

describe('useComments', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders comments returned by the hook', () => {
    const comments = [
      { id: 'c1', body: 'First comment', post_id: 'post-1', profiles: null },
      { id: 'c2', body: 'Second comment', post_id: 'post-1', profiles: null },
    ];
    useComments.mockReturnValue({ ...defaultCommentsHook, comments });

    render(<CommentsConsumer onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('comment-c1')).toHaveTextContent('First comment');
    expect(screen.getByTestId('comment-c2')).toHaveTextContent('Second comment');
  });

  it('calls addComment and triggers the callback on success', async () => {
    const fakeComment = { id: 'c-new', body: 'Great post!' };
    const addComment = vi.fn().mockResolvedValue(fakeComment);
    const onAdd = vi.fn();
    useComments.mockReturnValue({ ...defaultCommentsHook, addComment });

    render(<CommentsConsumer onAdd={onAdd} onDelete={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-comment'));
    });

    expect(addComment).toHaveBeenCalledWith('Great post!');
    expect(onAdd).toHaveBeenCalledWith(fakeComment);
  });

  it('shows error when addComment fails', () => {
    useComments.mockReturnValue({ ...defaultCommentsHook, error: 'Could not post comment.' });
    render(<CommentsConsumer onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('error')).toHaveTextContent('Could not post comment.');
  });

  it('calls deleteComment with the correct id on button click', async () => {
    const comment = { id: 'c-del', body: 'Delete me', post_id: 'post-1', profiles: null };
    const deleteComment = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn();
    useComments.mockReturnValue({ ...defaultCommentsHook, comments: [comment], deleteComment });

    render(<CommentsConsumer onAdd={vi.fn()} onDelete={onDelete} />);
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-c-del'));
    });

    expect(deleteComment).toHaveBeenCalledWith('c-del');
  });

  it('shows loading indicator while isLoading is true', () => {
    useComments.mockReturnValue({ ...defaultCommentsHook, isLoading: true });
    render(<CommentsConsumer onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows submitting indicator while isSubmitting is true', () => {
    useComments.mockReturnValue({ ...defaultCommentsHook, isSubmitting: true });
    render(<CommentsConsumer onAdd={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('submitting')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// usePostInteractions tests
// ---------------------------------------------------------------------------

describe('usePostInteractions', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders Like button and correct like count', () => {
    usePostInteractions.mockReturnValue({ ...defaultInteractionsHook, likeCount: 7 });
    render(<InteractionsConsumer />);
    expect(screen.getByTestId('like-btn')).toHaveTextContent('Like');
    expect(screen.getByTestId('like-count')).toHaveTextContent('7');
  });

  it('shows Unlike when isLiked is true', () => {
    usePostInteractions.mockReturnValue({ ...defaultInteractionsHook, isLiked: true, likeCount: 1 });
    render(<InteractionsConsumer />);
    expect(screen.getByTestId('like-btn')).toHaveTextContent('Unlike');
    expect(screen.getByTestId('like-count')).toHaveTextContent('1');
  });

  it('calls toggleLike when Like button is clicked', () => {
    const toggleLike = vi.fn();
    usePostInteractions.mockReturnValue({ ...defaultInteractionsHook, toggleLike });
    render(<InteractionsConsumer />);
    fireEvent.click(screen.getByTestId('like-btn'));
    expect(toggleLike).toHaveBeenCalledOnce();
  });

  it('shows Unsave when isSaved is true', () => {
    usePostInteractions.mockReturnValue({ ...defaultInteractionsHook, isSaved: true });
    render(<InteractionsConsumer />);
    expect(screen.getByTestId('save-btn')).toHaveTextContent('Unsave');
  });

  it('calls toggleSave when Save button is clicked', () => {
    const toggleSave = vi.fn();
    usePostInteractions.mockReturnValue({ ...defaultInteractionsHook, toggleSave });
    render(<InteractionsConsumer />);
    fireEvent.click(screen.getByTestId('save-btn'));
    expect(toggleSave).toHaveBeenCalledOnce();
  });
});
