import React from 'react'

export interface MessageProps {
  className: string
  children?: React.ReactNode
}

export class Message extends React.PureComponent<MessageProps> {
  render() {
    return (
      <div className={this.props.className}>
        {this.props.children}
      </div>
    )
  }
}

