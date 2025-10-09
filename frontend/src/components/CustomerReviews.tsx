import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Search, ChevronDown, User, Calendar, CheckCircle, ThumbsUp, Camera, X } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

const CustomerReviews = ({
  productId,
  reviews: initialReviews,
  onAddReview,
  showAddReview = true,
  showFilters = true,
  className = ""
}) => {
  const [reviews, setReviews] = useState(initialReviews || [
    {
      id: 1,
      user_name: 'Adebayo O.',
      rating: 5,
      comment: 'Amazing product! Great quality and fast delivery. Highly recommend!',
      verified_purchase: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      helpful: 12,
      photos: ['/placeholder/product-1.jpg'],
      replies: [],
    },
    {
      id: 2,
      user_name: 'Fatima I.',
      rating: 4,
      comment: 'Good value for money. The product works as described. Only minor issue was the packaging.',
      verified_purchase: true,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      helpful: 7,
      photos: [],
      replies: [
        { id: 1, user_name: 'Vendor Support', comment: 'Thank you for your feedback! We are working on improving our packaging.', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
      ],
    },
    {
      id: 3,
      user_name: 'Chinedu K.',
      rating: 5,
      comment: 'Excellent customer service and product quality. Will definitely purchase again!',
      verified_purchase: false,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      helpful: 15,
      photos: ['/placeholder/product-2.jpg', '/placeholder/product-3.jpg'],
      replies: [],
    }
  ]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [filters, setFilters] = useState({
    rating: null,
    sortBy: 'newest',
    search: ''
  });
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    photos: [],
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyComment, setReplyComment] = useState('');

  const reviewStats = {
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    totalReviews: reviews.length,
    ratingDistribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
    }))
  };

  useEffect(() => {
    let filtered = [...reviews];
    if (filters.rating) {
      filtered = filtered.filter(review => review.rating === filters.rating);
    }
    if (filters.search) {
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(filters.search.toLowerCase()) ||
        review.user_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest': return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
        case 'highest': return b.rating - a.rating;
        case 'lowest': return a.rating - b.rating;
        case 'helpful': return (b.helpful || 0) - (a.helpful || 0);
        default: return 0;
      }
    });
    setFilteredReviews(filtered);
  }, [reviews, filters]);

  const handleAddReview = () => {
    const review = {
      id: Date.now(),
      user_name: 'Current User',
      rating: newReview.rating,
      comment: newReview.comment,
      photos: newReview.photos,
      verified_purchase: true,
      created_at: new Date().toISOString(),
      helpful: 0,
      replies: [],
    };
    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comment: '', photos: [] });
    setShowAddReviewForm(false);
  };

  const handleHelpful = (reviewId) => {
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
  };

  const handleAddReply = (reviewId) => {
    const reply = {
      id: Date.now(),
      user_name: 'Vendor Support', // Or current user
      comment: replyComment,
      created_at: new Date().toISOString(),
    };
    setReviews(reviews.map(r => r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r));
    setReplyingTo(null);
    setReplyComment('');
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`transition-colors duration-200 ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          disabled={!interactive}
        >
          <Star className={`w-5 h-5 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={`bg-white min-h-screen p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Feedback</h1>
            <p className="text-gray-600 mt-1">Insights and experiences from our valued customers.</p>
          </div>
          {showAddReview && (
            <button
              onClick={() => setShowAddReviewForm(!showAddReviewForm)}
              className="mt-4 lg:mt-0 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {showAddReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="flex items-center text-lg font-semibold text-gray-900">
                  <Star className="w-5 h-5 text-yellow-600 mr-2" />
                  Average Rating
                </h3>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900">{reviewStats.averageRating}</p>
                <div className="flex justify-center mt-2">
                  {renderStars(parseFloat(reviewStats.averageRating))}
                </div>
                <p className="text-sm text-gray-600 mt-2">Based on {reviewStats.totalReviews} reviews</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rating Distribution</h3>
              </div>
              <div className="space-y-3">
                {reviewStats.ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center w-16 text-sm font-medium">
                      {rating} <Star className="w-4 h-4 text-yellow-600 ml-1" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gray-600 h-2.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showAddReviewForm && (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                  {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-vertical"
                    rows={4}
                    placeholder="What did you like or dislike? How did you use this product?"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos</label>
                  <PhotoUpload
                    files={newReview.photos}
                    onFilesChange={(photos) => setNewReview({ ...newReview, photos })}
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleAddReview} 
                    disabled={!newReview.comment.trim()} 
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-semibold text-gray-900">All Reviews</h3>
              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <select
                      className="appearance-none w-full bg-white px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                      value={filters.sortBy}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest">Highest Rating</option>
                      <option value="lowest">Lowest Rating</option>
                      <option value="helpful">Most Helpful</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900">{review.user_name || 'Anonymous'}</span>
                            {review.verified_purchase && (
                              <span className="ml-2 text-xs inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-600 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            {formatDate(review.created_at)}
                          </div>
                        </div>
                        <div className="my-2">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        
                        {review.photos && review.photos.length > 0 && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {review.photos.map((photo, index) => (
                              <img key={index} src={photo} alt={`Review photo ${index + 1}`} className="w-24 h-24 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center space-x-4">
                          <button onClick={() => handleHelpful(review.id)} className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                            <ThumbsUp className="w-4 h-4" />
                            <span>Helpful ({review.helpful || 0})</span>
                          </button>
                          <button onClick={() => setReplyingTo(review.id)} className="flex items-center space-x-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                            <MessageSquare className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                        </div>

                        {replyingTo === review.id && (
                          <div className="mt-4 ml-14">
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                              rows={2}
                              placeholder="Write a reply..."
                              value={replyComment}
                              onChange={(e) => setReplyComment(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button 
                                onClick={() => setReplyingTo(null)} 
                                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleAddReply(review.id)} 
                                disabled={!replyComment.trim()} 
                                className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Post Reply
                              </button>
                            </div>
                          </div>
                        )}

                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 ml-14 space-y-4">
                            {review.replies.map(reply => (
                              <div key={reply.id} className="flex items-start">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                                  {reply.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm text-gray-800">{reply.user_name}</span>
                                    <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{reply.comment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Reviews Found</h3>
                  <p className="mt-1 text-gray-600">Try adjusting your search or be the first to leave a review!</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews;
