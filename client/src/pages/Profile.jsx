import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import './Profile.css';

const Profile = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user info from token
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    setUserName(tokenData.name);
    setUserId(tokenData.id);

    fetchUserPosts();
  }, [navigate]);

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/post/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setPosts(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/post/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
  };

  const handleUpdate = async (postId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/post/${postId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setPosts(posts.map(post => 
        post.id === postId ? response.data : post
      ));
      setEditingPost(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-left">
          <h1>My Posts</h1>
          <span className="user-name">Welcome, {userName}</span>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowCreatePost(true)}
            className="create-post-button"
          >
            Create Post
          </button>
          <button 
            onClick={() => navigate('/home')}
            className="back-button"
          >
            Back to Home
          </button>
          <button 
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      </div>

      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      <div className="profile-posts">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>You haven't created any posts yet.</p>
            <button 
              onClick={() => setShowCreatePost(true)}
              className="create-first-post-button"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="profile-post-card">
              {editingPost && editingPost.id === post.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    defaultValue={post.title}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      title: e.target.value
                    })}
                  />
                  <textarea
                    defaultValue={post.content}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      content: e.target.value
                    })}
                  />
                  <div className="edit-actions">
                    <button
                      onClick={() => handleUpdate(post.id, {
                        title: editingPost.title,
                        content: editingPost.content
                      })}
                      className="save-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <PostCard
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  author={post.author.name}
                  createdAt={post.createdAt}
                  userId={userId}
                  authorId={post.author.id}
                  onEdit={() => handleEdit(post)}
                  onDelete={() => handleDelete(post.id)}
                  showTitleContent={true}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile; 