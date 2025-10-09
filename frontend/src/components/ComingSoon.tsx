import React from 'react';
import { Card, Button } from './ui';
import { useNavigate } from 'react-router-dom';

const ComingSoon: React.FC<{ title?: string; description?: string }> = ({
  title = 'New Listing is coming soon',
  description = 'We are polishing a simple, fast flow for one-off marketplace posts tailored for Nigeria. In the meantime, use Product Management to add and publish items.'
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-xl w-full p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/vendor/products')} className="bg-blue-600 hover:bg-blue-700">Go to Product Management</Button>
          <Button onClick={() => navigate('/search')} variant="outline">Browse Marketplace</Button>
        </div>
      </Card>
    </div>
  );
};

export default ComingSoon;