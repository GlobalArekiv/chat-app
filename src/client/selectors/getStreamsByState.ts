import forEach from 'lodash/forEach'
import map from 'lodash/map'
import { createSelector } from 'reselect'
import { StreamTypeCamera, StreamTypeDesktop } from '../actions/StreamActions'
import { ME } from '../constants'
import { getNickname } from '../nickname'
import { LocalStream, StreamWithURL } from '../reducers/streams'
import { getStreamKey, WindowState } from '../reducers/windowStates'
import { State } from '../store'

export interface StreamProps {
  key: string
  stream?: StreamWithURL
  peerId: string
  muted?: boolean
  micMuted?: boolean
  handRaised?: boolean
  localUser?: boolean
  mirrored?: boolean
  windowState: WindowState
  nickname: string
  isScreenShare?: boolean
}

function getWindowStates(state: State) {
  return state.windowStates
}

function getStreams(state: State) {
  return state.streams
}

function getNicknames(state: State) {
  return state.nicknames
}

function getMedia(state: State) {
  return state.media
}

function getSettings(state: State) {
  return state.settings
}

function isRemoteStreamMuted(stream: StreamWithURL | LocalStream): boolean {
  if ('type' in stream) {
    return false
  }

  const audioTracks = stream.stream.getAudioTracks()
  if (audioTracks.length === 0) {
    return true
  }

  return audioTracks.every(track => track.muted || !track.enabled)
}

export const getStreamsByState = createSelector(
  [ getWindowStates, getNicknames, getStreams, getMedia, getSettings ],
  (windowStates, nicknames, streams, media, settings) => {
    const all: StreamProps[] = []
    const minimized: StreamProps[] = []
    const maximized: StreamProps[] = []

    const localCameraStream = streams.localStreams[StreamTypeCamera]
    const localAudioTracks = localCameraStream
      ? localCameraStream.stream.getAudioTracks()
      : []
    const localMuted = localAudioTracks.length > 0
      ? localAudioTracks.every(track => track.muted || !track.enabled)
      : !media.audio.enabled

    function addStreamProps(props: StreamProps) {
      if (props.windowState === 'minimized') {
        minimized.push(props)
      } else {
        maximized.push(props)
      }

      all.push(props)
    }

    function isLocalStream(s: StreamWithURL): s is LocalStream {
      return 'mirror' in s && 'type' in s
    }

    function addStreamsByUser(
      localUser: boolean,
      peerId: string,
      streams: Array<StreamWithURL | LocalStream>,
    ) {

      if (!streams.length) {
        const key = getStreamKey(peerId, undefined)
        const props: StreamProps = {
          key,
          peerId,
          localUser,
          muted: localUser,
          micMuted: localUser ? localMuted : false,
          handRaised: localUser ? settings.handRaised : false,
          windowState: windowStates[key],
          nickname: getNickname(nicknames, peerId),
          isScreenShare: false,
        }
        addStreamProps(props)
        return
      }

      streams.forEach((stream) => {
        const key = getStreamKey(peerId, stream.streamId)
        const isScreenShare = isLocalStream(stream) && stream.type === StreamTypeDesktop
        const props: StreamProps = {
          key,
          stream: stream,
          peerId,
          mirrored: localUser && isLocalStream(stream) &&
            stream.type === StreamTypeCamera && stream.mirror,
          muted: localUser,
          micMuted: localUser ? localMuted : isRemoteStreamMuted(stream),
          handRaised: localUser ? settings.handRaised : false,
          localUser,
          windowState: windowStates[key],
          nickname: getNickname(nicknames, peerId),
          isScreenShare: isScreenShare,
        }
        addStreamProps(props)
      })
    }

    const localStreams = map(streams.localStreams, s => s!)
    addStreamsByUser(true, ME, localStreams)

    forEach(nicknames, (_, peerId) => {
      if (peerId != ME) {
        const s = map(
          streams.pubStreamsKeysByPeerId[peerId],
          (_, streamId) => streams.pubStreams[streamId],
        )
        .map(pubStream => streams.remoteStreams[pubStream.streamId])
        .filter(s => !!s)

        addStreamsByUser(false, peerId, s)
      }
    })

    // Sort maximized streams: screen shares first, then cameras
    maximized.sort((a, b) => {
      if (a.isScreenShare === b.isScreenShare) return 0
      return a.isScreenShare ? -1 : 1
    })

    return { all, minimized, maximized }
  },
)
