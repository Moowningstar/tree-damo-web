export default function VirtualCursor({ position, state = 'default' }) {
  if (!position || position.x === undefined || position.y === undefined) return null;

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
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      {/* 内部指示器 */}
      <div className="virtual-cursor-inner" />
    </div>
  );
}
