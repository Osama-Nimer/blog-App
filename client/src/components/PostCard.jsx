import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import './PostCard.css';

const PostCard = ({ id, title, content, author, createdAt, userId, authorId, showTitleContent = true, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Format the date to be more readable
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/comment/post/${id}`);
      setComments(response.data);
      setError('');
    } catch {
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add a comment');
        return;
      }

      const numericId = Number(id);
      if (isNaN(numericId)) {
        setError('Invalid post ID');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/comment/`,
        {
          postId: numericId,
          text: newComment.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setComments(prevComments => [response.data, ...prevComments]);
      setNewComment('');
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/comment/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch {
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleUpdateComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/comment/${commentId}`,
        { text: editCommentText.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId ? response.data : comment
        )
      );
      setEditingCommentId(null);
      setEditCommentText('');
    } catch {
      setError('Failed to update comment. Please try again.');
    }
  };

  const canManageComment = (comment) => {
    return userId === comment.author?.id || userId === authorId;
  };

  const handleShowComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  return (
    <div className="post-card">
      {showTitleContent && (
        <>
          <h2 className="post-title">{title}</h2>
          <p className="post-content">
            {isExpanded ? content : content.length > 150 ? `${content.substring(0, 150)}...` : content}
          </p>
          {content.length > 150 && (
            <button 
              className="read-more-button"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
          
          <div className="post-footer">
            <span className="post-author">By {author}</span>
            <span className="post-date">{formattedDate}</span>
          </div>

          {userId === authorId && (
            <div className="post-actions">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="edit-btn"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div className="post-actions">
        <button 
          className="comments-button"
          onClick={handleShowComments}
        >
          {showComments ? 'Hide Comments' : 'Show Comments'}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? 'Adding...' : 'Add Comment'}
            </button>
          </form>

          {loading && <div className="loading-message">Loading comments...</div>}

          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                {editingCommentId === comment.id ? (
                  <div className="edit-comment-form">
                    <input
                      type="text"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      placeholder="Edit your comment..."
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editCommentText.trim()}
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingCommentId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-content">{comment.text}</p>
                    <div className="comment-meta">
                      <span className="comment-author">
                        {comment.author?.name || 'Anonymous'}
                      </span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {canManageComment(comment) && (
                        <div className="comment-actions">
                          {userId === comment.author?.id && (
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="edit-button"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {!loading && comments.length === 0 && (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

PostCard.propTypes = {
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  userId: PropTypes.number.isRequired,
  authorId: PropTypes.number.isRequired,
  showTitleContent: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

export default PostCard; 