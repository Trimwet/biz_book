const Logo = ({ className = '', size = 'default' }) => {
  const sizes = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-3xl',
    xlarge: 'text-5xl',
  };

  const textSize = sizes[size] || sizes.default;

  return (
    <div className={`font-bold tracking-tight select-none ${textSize} ${className}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <span className="text-blue-600">biz</span>
      <span className="text-gray-900">book</span>
    </div>
  );
};

export default Logo;
