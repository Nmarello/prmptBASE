import { useTheme } from '../contexts/ThemeContext'

interface LogoProps {
  height?: number
  className?: string
  style?: React.CSSProperties
  theme?: 'dark' | 'light'
}

export default function Logo({ height = 22, className, style, theme: themeProp }: LogoProps) {
  const { theme: ctxTheme } = useTheme()
  const theme = themeProp ?? ctxTheme
  const src = theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'
  return (
    <img
      src={src}
      alt="prmptVAULT"
      height={height}
      style={{ height, width: 'auto', display: 'inline-block', ...style }}
      className={className}
    />
  )
}
