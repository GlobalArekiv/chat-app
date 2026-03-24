import classnames from 'classnames'
import React from 'react'
import { IconType } from 'react-icons'

export interface ToolbarButtonProps {
  className?: string
  badge?: string | number
  blink?: boolean
  onClick: (event: React.MouseEvent) => void
  icon: IconType
  offIcon?: IconType
  on?: boolean
  title: string
  label?: string
}

export function ToolbarButton(props: ToolbarButtonProps) {
  const { blink, on, label } = props
  const Icon: IconType = !on && props.offIcon ? props.offIcon : props.icon

  return (
    <a
      className={classnames('button', props.className, { blink, on, 'has-label': !!label })}
      onClick={props.onClick}
      title={label ? undefined : props.title}
    >
      <span className='icon'>
        <Icon />
        {!!props.badge && <span className='badge'>{props.badge}</span>}
      </span>
      {label && <span className='label'>{label}</span>}
      {!label && <span className='tooltip'>{props.title}</span>}
    </a>
  )
}
