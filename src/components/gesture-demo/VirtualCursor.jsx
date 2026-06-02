export default function VirtualCursor({ position, state = 'default' }) {
  if (!position) return null;

  const getClassName = () => {
    const base = 'virtual-cursor';
    return `${base} ${base}--${state}`;
  };

  return (
    <div
      className={getClassName()}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    />
  );
}
