import avatar from 'gradient-avatar';

const Avatar = ({ id, size = 32 }: { id?: string; size?: number }) => {
  // Fallback to a default ID if none provided
  const avatarId = id || 'default-user';
  const avatarSVG = avatar(avatarId);
  const dataUri = `data:image/svg+xml,${encodeURIComponent(avatarSVG)}`;
  return (
    <div style={{ width: size, height: size }}>
      <img className="w-full h-full rounded-full" src={dataUri} alt="Avatar" />
    </div>
  );
};

export default Avatar;
