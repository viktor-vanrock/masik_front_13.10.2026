interface Props {
    label: string
}
export const CardCapBadge = ({label}: Props) => {
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded"
      style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--text-blue-on-bg)', fontSize: '10px' }}
    >
      {label}
    </span>
  )
}