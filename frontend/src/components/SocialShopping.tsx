import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import Badge from './ui/Badge';
import { MessageSquare, Heart, Share2, TrendingUp, Award, HelpCircle, Tag, Image as ImageIcon, Send } from 'lucide-react';

// Mock Data - Replace with API calls
const mockFeed = [
  {
    id: 1,
    user: { name: 'Adebayo O.', username: 'adebayo', avatar: 'https://github.com/shadcn.png' },
    type: 'review',
    content: 'Just got the new Samsung S25 from GadgetHub, and it\'s a beast! The camera is a huge step up. Vendor was quick with delivery too.',
    product: { name: 'Samsung S25 Ultra', image: '/placeholder/product-4.jpg' },
    likes: 125,
    comments: 12,
    timestamp: '2h ago',
    media: ['/placeholder/product-4.jpg', '/placeholder/product-5.jpg']
  },
  {
    id: 2,
    user: { name: 'Fatima I.', username: 'fatima', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    type: 'deal',
    content: 'Heads up everyone! MegaDeals has a 40% discount on all home appliances this weekend. Just snagged a new blender.',
    product: { name: 'Heavy-Duty Blender', image: '/placeholder/product-6.jpg' },
    likes: 230,
    comments: 45,
    timestamp: '5h ago',
    deal: { discount: '40%', originalPrice: '₦80,000' }
  },
  {
    id: 3,
    user: { name: 'Chinedu K.', username: 'chinedu', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    type: 'question',
    content: 'Does anyone know a reliable vendor for affordable office chairs in Lagos? My back is killing me! Need something ergonomic.',
    likes: 45,
    comments: 28,
    timestamp: '1d ago',
  },
];

const mockTrending = ['#TechDeals', '#WorkFromHome', '#PhoneWars', '#KitchenGadgets', '#FashionFinds'];

const mockTopContributors = [
  { name: 'Adebayo O.', username: 'adebayo', avatar: 'https://github.com/shadcn.png', points: '12,402' },
  { name: 'Fatima I.', username: 'fatima', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', points: '10,876' },
  { name: 'Chinedu K.', username: 'chinedu', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', points: '9,803' },
];

const Post = ({ post }) => {
  const [liked, setLiked] = useState(false);

  const getPostIcon = (type) => {
    switch (type) {
      case 'review': return <Award className="w-4 h-4 text-gray-600" />;
      case 'deal': return <Tag className="w-4 h-4 text-gray-600" />;
      case 'question': return <HelpCircle className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex flex-row items-start gap-4 p-4 border-b border-gray-100">
        <Avatar>
          <AvatarImage src={post.user.avatar} alt={post.user.name} />
          <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{post.user.name}</span>
            <span className="text-sm text-gray-500">@{post.user.username}</span>
            <span className="text-sm text-gray-500">· {post.timestamp}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            {getPostIcon(post.type)}
            <span>{post.type.charAt(0).toUpperCase() + post.type.slice(1)}</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-4">
        <p className="text-gray-800 mb-4">{post.content}</p>
        {post.product && (
          <div className="border rounded-lg p-3 flex items-center gap-4 mb-4">
            <img src={post.product.image} alt={post.product.name} className="w-16 h-16 rounded-md object-cover" />
            <div>
              <p className="font-semibold">{post.product.name}</p>
              {post.deal && (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-700">-{post.deal.discount}</span>
                  <span className="text-sm text-gray-500 line-through">{post.deal.originalPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}
        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.media.map((src, index) => (
              <img key={index} src={src} alt={`Post media ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-gray-500">
          <button onClick={() => setLiked(!liked)} className={`flex items-center gap-1.5 hover:text-gray-700 transition-colors ${liked ? 'text-gray-700' : ''}`}>
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">{post.likes + (liked ? 1 : 0)}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SocialShopping = () => {
  const { user } = useUser();
  const [feed, setFeed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    // Fetch data from API in a real application
    setFeed(mockFeed);
    setTrending(mockTrending);
    setTopContributors(mockTopContributors);
  }, []);

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    const newPost = {
      id: Date.now(),
      user: { name: user?.email || 'Anonymous', username: user?.email?.split('@')[0] || 'anon', avatar: '' },
      type: 'review',
      content: newPostContent,
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
    };
    setFeed([newPost, ...feed]);
    setNewPostContent('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                My Activity
              </button>
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your thoughts with the community..."
                      className="w-full border-none focus:ring-0 resize-none text-base p-0"
                      rows={3}
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <div className="flex gap-2 text-gray-500">
                        <button className="hover:text-gray-700 p-2 rounded-full"><ImageIcon className="w-5 h-5" /></button>
                        <button className="hover:text-gray-700 p-2 rounded-full"><Tag className="w-5 h-5" /></button>
                        <button className="hover:text-gray-700 p-2 rounded-full"><HelpCircle className="w-5 h-5" /></button>
                      </div>
                      <button 
                        onClick={handleCreatePost} 
                        disabled={!newPostContent.trim()} 
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Posts */}
            {feed.map(post => <Post key={post.id} post={post} />)}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" /> Trending Topics
                </h3>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {trending.map(topic => (
                    <li key={topic}><a href="#" className="text-gray-700 hover:text-gray-900 hover:underline">{topic}</a></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-gray-600" /> Top Contributors
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {topContributors.map(c => (
                  <div key={c.username} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SocialShopping;