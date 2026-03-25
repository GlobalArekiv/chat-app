import classnames from 'classnames'
import React, { ReactEventHandler } from 'react'
import { MdCrop, MdInfoOutline, MdMenu, MdZoomIn, MdZoomOut } from 'react-icons/md'
import { MaximizeParams, MinimizeTogglePayload, StreamDimensionsPayload } from '../actions/StreamActions'
import { AudioMessage, audioProcessor } from '../audio'
import { Dim } from '../frame'
import { ReceiverStatsParams } from '../reducers/receivers'
import { StreamWithURL } from '../reducers/streams'
import { WindowState } from '../reducers/windowStates'
import { Dropdown } from './Dropdown'
import Stats from './Stats'
import VideoSrc from './VideoSrc'
import VUMeter from './VUMeter'

export interface VideoProps {
  onMaximize: (payload: MaximizeParams) => void
  onMinimizeToggle: (payload: MinimizeTogglePayload) => void
  nickname: string
  windowState: WindowState
  stream?: StreamWithURL
  peerId: string
  muted: boolean
  micMuted?: boolean
  mirrored: boolean
  play: () => void
  localUser?: boolean
  style?: React.CSSProperties
  onDimensions: (payload: StreamDimensionsPayload) => void
  forceContain?: boolean
  getReceiverStats: (
    params: ReceiverStatsParams,
  ) => Promise<RTCStatsReport | undefined>
  getSenderStats: (
    track: MediaStreamTrack,
  ) => Promise<{peerId: string, stats: RTCStatsReport}[]>
  showStats?: boolean
  isScreenShare?: boolean
  handRaised?: boolean
}

export interface VideoState {
  objectFit: string
  showStats: boolean
  isSpeaking: boolean
}

export default class Video
extends React.PureComponent<VideoProps, VideoState> {
  state = {
    objectFit: '',
    showStats: false,
    isSpeaking: false,
  }

  statsTimeout: NodeJS.Timeout | undefined
  speakingTimeout: NodeJS.Timeout | undefined
  lastSpeakingUpdateTs = 0

  static defaultProps = {
    muted: false,
    mirrored: false,
  }

  private speakingUnsubscribe: (() => void) | null = null

  componentDidMount() {
    this.subscribeSpeakingDetection()
  }

  componentDidUpdate(prevProps: VideoProps) {
    // Resubscribe if stream ID changed
    if (prevProps.stream?.streamId !== this.props.stream?.streamId) {
      this.unsubscribeSpeakingDetection()
      this.subscribeSpeakingDetection()
    }
  }

  componentWillUnmount() {
    this.unsubscribeSpeakingDetection()

    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout)
    }
  }

  handleClick: ReactEventHandler<HTMLVideoElement> = () => {
    this.props.play()
  }

  subscribeSpeakingDetection = () => {
    const { stream, localUser } = this.props
    // Skip local user speaking highlight to reduce extra local processing.
    if (!stream || localUser) {
      return
    }

    this.speakingUnsubscribe = audioProcessor.subscribe(
      stream.streamId,
      this.handleAudioMessage,
    )
  }

  unsubscribeSpeakingDetection = () => {
    if (this.speakingUnsubscribe) {
      this.speakingUnsubscribe()
      this.speakingUnsubscribe = null
    }
  }

  handleAudioMessage = (msg: AudioMessage) => {
    if (msg.type !== 'volume') {
      return
    }

    const now = Date.now()
    if (now - this.lastSpeakingUpdateTs < 120) {
      return
    }
    this.lastSpeakingUpdateTs = now

    // Detect speaking if volume is above threshold (level 2+)
    const isSpeaking = msg.volume > 0.38

    if (isSpeaking !== this.state.isSpeaking) {
      this.setState({ isSpeaking })

      // Auto-reset speaking status after 300ms of silence
      if (this.speakingTimeout) {
        clearTimeout(this.speakingTimeout)
      }

      if (!isSpeaking) {
        this.speakingTimeout = setTimeout(() => {
          this.setState({ isSpeaking: false })
        }, 300)
      }
    }
  }
  handleMinimize = () => {
    this.props.onMinimizeToggle({
      peerId: this.props.peerId,
      streamId: this.props.stream && this.props.stream.streamId,
    })
  }
  handleMaximize = () => {
    this.props.onMaximize({
      peerId: this.props.peerId,
      streamId: this.props.stream && this.props.stream.streamId,
    })
  }
  handleToggleCover = () => {
    this.setState({
      objectFit: this.state.objectFit ? '' : 'contain',
    })
  }
  handleLoadedMetadata = (_e: React.SyntheticEvent<HTMLVideoElement>) => {
    this.props.play()
  }
  handleResize = (dimensions: Dim) => {
    const { peerId, stream } = this.props
    if (!stream) {
      return
    }

    this.props.onDimensions({
      peerId,
      streamId: stream.streamId,
      dimensions,
    })
  }
  handleToggleStats = () => {
    this.setState({
      showStats: !this.state.showStats,
    })
  }
  render () {
    const { forceContain, mirrored, peerId, windowState, stream, isScreenShare } = this.props
    const { isSpeaking } = this.state
    const showStats = this.state.showStats || this.props.showStats
    const minimized =  windowState === 'minimized'
    const className = classnames('video-container', {
      minimized,
      mirrored,
      'active-speaker': isSpeaking,
      'is-screen-share': isScreenShare,
    })

    const streamId = stream && stream.streamId
    const mediaStream = stream && stream.stream || null
    const streamURL = stream && stream.url || ''

    let { objectFit } = this.state

    if (forceContain) {
      objectFit = 'contain'
    }

    return (
      <div className={className} style={this.props.style}>
        {isScreenShare && (
          <div className='screen-share-badge'>
            <span>🖥️ Screen Shared</span>
          </div>
        )}
        <VideoSrc
          id={`video-${peerId}-${streamId}`}
          autoPlay
          onClick={this.handleClick}
          onLoadedMetadata={this.handleLoadedMetadata}
          onResize={this.handleResize}
          muted={this.props.muted}
          mirrored={this.props.mirrored}
          objectFit={objectFit}
          srcObject={mediaStream}
          src={streamURL}
        />
        {showStats && (
          <div className='video-stats'>
            <Stats
              stream={stream}
              peerId={this.props.peerId}
              getReceiverStats={this.props.getReceiverStats}
              getSenderStats={this.props.getSenderStats}
            />
          </div>
        )}
        <div className='video-footer'>
          <VUMeter streamId={streamId} />
          <div className='participant-info'>
            <div className='participant-avatar'>
              {this.props.nickname.charAt(0).toUpperCase()}
            </div>
            <span className='nickname'>{this.props.nickname}</span>
            {this.props.micMuted && (
              <span className='status-badge muted'>Muted</span>
            )}
            {this.props.handRaised && (
              <span className='status-badge hand-raised'>Hand Raised</span>
            )}
            <span className='status-badge quality-good'>HD</span>
          </div>
          <Dropdown fixed label={<MdMenu />}>
            <li className='action-maximize' onClick={this.handleMaximize}>
              <MdZoomIn />&nbsp;
              Maximize
            </li>
            <li className='action-minimize' onClick={this.handleMinimize}>
              {minimized ? <MdZoomIn /> : <MdZoomOut /> }&nbsp;
              Toggle Minimize
            </li>
            {!forceContain && (
              <li
              className='action-toggle-fit'
              onClick={this.handleToggleCover}
              >
                <MdCrop /> Toggle Fit
              </li>
            )}
            {stream && !this.props.showStats && (<li
              className='action-toggle-stats' onClick={this.handleToggleStats}
            >
              <MdInfoOutline /> Stats
            </li>)}
          </Dropdown>
        </div>
      </div>
    )
  }
}
