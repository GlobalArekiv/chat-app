import classnames from 'classnames'
import React from 'react'
import { MdCallEnd, MdContentCopy, MdFullscreen, MdFullscreenExit, MdLock, MdLockOpen, MdPanTool, MdQuestionAnswer, MdScreenShare, MdShare, MdStopScreenShare, MdWarning } from 'react-icons/md'
import screenfull from 'screenfull'
import { getDesktopStream } from '../actions/MediaActions'
import { handRaiseToggle } from '../actions/SettingsActions'
import { Panel, sidebarPanelChat } from '../actions/SidebarActions'
import { removeLocalStream } from '../actions/StreamActions'
import { DialState, DIAL_STATE_IN_CALL } from '../constants'
import { getBrowserFeatures } from '../features'
import { insertableStreamsCodec } from '../insertable-streams'
import { LocalStream } from '../reducers/streams'
import { config } from '../window'
import { AudioDropdown, VideoDropdown } from './DeviceDropdown'
import { ShareDesktopDropdown } from './ShareDesktopDropdown'
import { ToolbarButton } from './ToolbarButton'

const { callId } = config

export interface ToolbarProps {
  dialState: DialState
  nickname: string
  messagesCount: number
  desktopStream: LocalStream | undefined
  onToggleSidebar: () => void
  onGetDesktopStream: typeof getDesktopStream
  onRemoveLocalStream: typeof removeLocalStream
  handRaised?: boolean
  onHandRaiseToggle?: typeof handRaiseToggle
  onHangup: () => void
  sidebarVisible: boolean
  sidebarPanel: Panel
}

export interface ToolbarState {
  hidden: boolean
  readMessages: number
  camDisabled: boolean
  micMuted: boolean
  fullScreenEnabled: boolean
  encryptionDialogVisible: boolean
  encrypted: boolean
}

function canShare(navigator: Navigator): boolean {
  return 'share' in navigator
}

export default class Toolbar extends React.PureComponent<
  ToolbarProps,
  ToolbarState
> {
  encryptionKeyInputRef: React.RefObject<HTMLInputElement>
  supportsInsertableStreams: boolean

  constructor(props: ToolbarProps) {
    super(props)
    this.state = {
      hidden: false,
      readMessages: props.messagesCount,
      camDisabled: false,
      micMuted: false,
      fullScreenEnabled: false,
      encryptionDialogVisible: false,
      encrypted: false,
    }

    this.encryptionKeyInputRef = React.createRef<HTMLInputElement>()
    this.supportsInsertableStreams = getBrowserFeatures().insertableStreams
  }
  componentDidMount() {
    document.body.addEventListener('click', this.toggleHidden)
    screenfull.isEnabled && screenfull.on('change', this.fullscreenChange)
  }
  componentDidWillUnmount() {
    document.body.removeEventListener('click', this.toggleHidden)
    screenfull.isEnabled && screenfull.off('change', this.fullscreenChange)
  }
  fullscreenChange = () => {
    this.setState({
      fullScreenEnabled: screenfull.isEnabled && screenfull.isFullscreen,
    })
  }
  toggleHidden = (e: MouseEvent) => {
    const t = e.target && (e.target as HTMLElement).tagName

    if (t === 'DIV' || t === 'VIDEO') {
      this.setState({ hidden: !this.state.hidden })
    }
  }
  handleFullscreenClick = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle()
    }
  }
  handleHangoutClick = () => {
    sessionStorage.removeItem('vidyax:last-call-path')
    sessionStorage.removeItem('vidyax:refresh-ts')
    window.location.href = config.baseUrl + '/'
  }
  toggleEncryptionDialog = () => {
    const encryptionDialogVisible = !this.state.encryptionDialogVisible

    this.setState({
      encryptionDialogVisible,
    })

    const inputElement = this.encryptionKeyInputRef.current!

    if (encryptionDialogVisible) {
      setTimeout(() => {
        inputElement.focus()
      })
    }
  }
  setPasswordOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      this.setPassword()
    }
  }
  setPassword = () => {
    const inputElement = this.encryptionKeyInputRef.current!
    const key = inputElement.value
    inputElement.value = ''

    const encrypted =
      insertableStreamsCodec.setPassword(key) &&
      key.length > 0

    this.setState({
      encryptionDialogVisible: false,
      encrypted,
    })
  }
  copyInvitationURL = async () => {
    const { nickname } = this.props
    const link = location.href
    const text = `${nickname} has invited you to a meeting on Peer Calls`
    if (canShare(navigator)) {
      await navigator.share({
        title: 'Peer Call',
        text,
        url: link,
      })
      return
    }
    const value = `${text}. \nRoom: ${callId} \nLink: ${link}`
    await navigator.clipboard.writeText(value)
  }
  handleToggleSidebar = () => {
    this.setState({
      readMessages: this.props.messagesCount,
    })
    this.props.onToggleSidebar()
  }
  handleHandRaiseToggle = () => {
    if (this.props.onHandRaiseToggle) {
      this.props.onHandRaiseToggle()
    }
  }
  render() {
    const { messagesCount } = this.props
    const unreadCount = messagesCount - this.state.readMessages
    const hasUnread = unreadCount > 0
    const isInCall = this.props.dialState === DIAL_STATE_IN_CALL

    const className = classnames('toolbar', {
      'toolbar-hidden': this.props.sidebarVisible || this.state.hidden,
    })

    const chatVisible = this.props.sidebarVisible &&
      this.props.sidebarPanel === sidebarPanelChat

    const encryptionIcon = this.state.encrypted
      ? MdLock
      : MdLockOpen

    return (
      <React.Fragment>
        {isInCall && (
          <div className={'toolbar-call ' + className}>
            <ToolbarButton
              className='copy-url'
              key='copy-url'
              icon={canShare(navigator) ? MdShare : MdContentCopy}
              onClick={this.copyInvitationURL}
              title={canShare(navigator) ? 'Share' : 'Copy Invitation URL'}
            />

            <ToolbarButton
              badge={unreadCount}
              className='toolbar-btn-chat'
              key='chat'
              icon={MdQuestionAnswer}
              blink={!chatVisible && hasUnread}
              onClick={this.handleToggleSidebar}
              on={chatVisible}
              title='Show Sidebar'
            />

            {config.peerConfig.encodedInsertableStreams && (
              <div className='encryption-wrapper'>
                <ToolbarButton
                  onClick={this.toggleEncryptionDialog}
                  key='encryption'
                  className={classnames('encryption', {
                    'encryption-enabled': this.state.encrypted,
                  })}
                  on={this.state.encryptionDialogVisible || this.state.encrypted}
                  icon={encryptionIcon}
                  title='Setup Encryption'
                />
                <div
                  className={classnames('encryption-dialog', {
                    'encryption-dialog-visible':
                      this.state.encryptionDialogVisible,
                  })}
                >
                  <div className='encryption-form'>
                    <input
                      autoComplete='off'
                      name='encryption-key'
                      className='encryption-key'
                      placeholder='Enter Passphrase'
                      ref={this.encryptionKeyInputRef}
                      type='password'
                      onKeyUp={this.setPasswordOnEnter}
                    />
                    <button onClick={this.setPassword}>Save</button>
                  </div>
                  <div className='note'>
                    <p><MdWarning /> Experimental functionality for A/V only.</p>
                    {!this.supportsInsertableStreams && (
                      <p>
                        Your browser does not support Insertable Streams.
                      </p>
                    )} </div>
                </div>
              </div>
            )}

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

            <ShareDesktopDropdown
              className='stream-desktop'
              icon={MdScreenShare}
              offIcon={MdStopScreenShare}
              key='stream-desktop'
              title='Share Desktop'
              desktopStream={this.props.desktopStream}
              onGetDesktopStream={this.props.onGetDesktopStream}
              onRemoveLocalStream={this.props.onRemoveLocalStream}
            />

            <VideoDropdown />

            <ToolbarButton
              onClick={this.props.onHangup}
              key='hangup'
              className='hangup'
              icon={MdCallEnd}
              title='Hang Up'
              label='End Call'
            />

            <AudioDropdown />

            <ToolbarButton
              onClick={this.handleHandRaiseToggle}
              key='raise-hand'
              className='raise-hand'
              icon={MdPanTool}
              on={this.props.handRaised}
              title={this.props.handRaised ? 'Lower Hand' : 'Raise Hand'}
            />

            <ToolbarButton
              onClick={this.handleFullscreenClick}
              className='fullscreen'
              key='fullscreen'
              icon={MdFullscreenExit}
              offIcon={MdFullscreen}
              on={this.state.fullScreenEnabled}
              title='Fullscreen'
            />

          </div>
        )}
      </React.Fragment>
    )
  }
}
