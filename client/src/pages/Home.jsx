import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { API_BASE_URL } from '../config/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user info from token
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    setUserId(tokenData.id);
    setUserName(tokenData.name);

    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/post`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPosts(response.data);
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-left">
          <h1>Blog App</h1>
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
            onClick={() => navigate('/profile')}
            className="profile-button"
          >
            My Profile
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      <div className="posts-grid">
        {posts.length === 0 ? (
          <div className="no-posts">No posts found. Create your first post!</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              author={post.author.name || 'Anonymous'}
              createdAt={post.createdAt}
              userId={userId}
              authorId={post.author.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home; 