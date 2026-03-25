import map from 'lodash/map'
import React from 'react'
import { connect } from 'react-redux'
import { MinimizeTogglePayload } from '../actions/StreamActions'
import { getStreamsByState, StreamProps } from '../selectors'
import { State } from '../store'
import uniqueId from 'lodash/uniqueId'

export interface UsersProps {
  streams: StreamProps[]
  onMinimizeToggle: (payload: MinimizeTogglePayload) => void
  play: () => void
}

export interface UsersState {
  isRecording: boolean
}

interface UserProps extends StreamProps {
  onMinimizeToggle: (payload: MinimizeTogglePayload) => void
  play: () => void
}

class User extends React.PureComponent<UserProps> {
  uniqueId: string
  constructor(props: UserProps) {
    super(props)
    this.uniqueId = uniqueId('user-')
  }
  handleChange = () => {
    const { peerId, stream } = this.props
    const streamId = stream && stream.streamId

    this.props.onMinimizeToggle({
      peerId,
      streamId,
    })
  }
  render() {
    return (
      <li>
        <label htmlFor={this.uniqueId}>
          <input
            id={this.uniqueId}
            type='checkbox'
            checked={this.props.windowState !== 'minimized' }
            onChange={this.handleChange}
          />
          {this.props.nickname}
        </label>
      </li>
    )
  }
}

class Users extends React.PureComponent<UsersProps, UsersState> {
  // Session recording state
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  audioCtx: AudioContext | null = null;
  dest: MediaStreamAudioDestinationNode | null = null;
  mediaRecorder: MediaRecorder | null = null;
  videoElements: Map<string, HTMLVideoElement> = new Map();
  audioSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  recordedChunks: BlobPart[] = [];
  animationFrameId: number = 0;

  state = {
    isRecording: false,
  }

  componentDidUpdate(prevProps: UsersProps) {
    if (this.state.isRecording && prevProps.streams !== this.props.streams) {
      this.updateRecorderStreams();
    }
  }

  updateRecorderStreams = () => {
    const { audioCtx, dest } = this;
    if (!audioCtx || !dest) return;

    this.props.streams.forEach(s => {
      const streamObj = s.stream;
      if (!streamObj) return;
      
      const mediaStream = streamObj.stream;
      if (!mediaStream) return;
      
      const streamId = streamObj.streamId;
      
      // Wire audio
      if (!this.audioSources.has(streamId) && mediaStream.getAudioTracks().length > 0) {
        try {
          const source = audioCtx.createMediaStreamSource(mediaStream);
          source.connect(dest);
          this.audioSources.set(streamId, source);
        } catch (e) {
          console.error("Audio mix error:", e);
        }
      }
      
      // Wire video
      if (!this.videoElements.has(streamId) && mediaStream.getVideoTracks().length > 0) {
        const v = document.createElement('video');
        v.srcObject = mediaStream;
        v.muted = true; // prevent local echo
        v.playsInline = true;
        v.play().catch(e => console.error(e));
        this.videoElements.set(streamId, v);
      }
    });
  }

  handleRecordSession = async () => {
    if (this.state.isRecording) {
      this.setState({ isRecording: false });
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      if (this.audioCtx) this.audioCtx.close();
      this.videoElements.forEach(v => { v.pause(); v.srcObject = null; });
      this.videoElements.clear();
      this.audioSources.clear();
      return;
    }

    try {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1280;
      this.canvas.height = 720;
      this.ctx = this.canvas.getContext('2d');
      
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.dest = this.audioCtx.createMediaStreamDestination();
      
      this.updateRecorderStreams();

      const draw = () => {
        if (!this.state.isRecording || !this.ctx || !this.canvas) return;
        
        this.ctx.fillStyle = '#050c1c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const vids = Array.from(this.videoElements.values());
        if (vids.length > 0) {
          const cols = Math.ceil(Math.sqrt(vids.length));
          const rows = Math.ceil(vids.length / cols);
          const w = this.canvas.width / cols;
          const h = this.canvas.height / rows;
          
          vids.forEach((v, i) => {
            const x = (i % cols) * w;
            const y = Math.floor(i / cols) * h;
            
            const vRatio = v.videoWidth / v.videoHeight || 16/9;
            const targetRatio = w / h;
            let drawW = w, drawH = h, offsetX = 0, offsetY = 0;
            
            // Object-fit: cover logic
            if (vRatio > targetRatio) {
              drawW = h * vRatio;
              offsetX = (w - drawW) / 2;
            } else {
              drawH = w / vRatio;
              offsetY = (h - drawH) / 2;
            }
            
            if (v.readyState >= 2) {
               this.ctx!.save();
               this.ctx!.rect(x, y, w, h);
               this.ctx!.clip();
               this.ctx!.drawImage(v, x - offsetX, y - offsetY, drawW, drawH);
               
               // Add a subtle border around videos
               this.ctx!.lineWidth = 2;
               this.ctx!.strokeStyle = 'rgba(255, 255, 255, 0.1)';
               this.ctx!.strokeRect(x, y, w, h);
               
               this.ctx!.restore();
            }
          });
        } else {
          // No video, draw waiting text
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '24px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('Recording Audio Only / Waiting for Video...', this.canvas!.width / 2, this.canvas!.height / 2);
        }
        
        this.animationFrameId = requestAnimationFrame(draw);
      };
      
      draw();
      
      const combinedStream = this.canvas!.captureStream(30);
      if (this.dest.stream.getAudioTracks().length > 0) {
        combinedStream.addTrack(this.dest.stream.getAudioTracks()[0]);
      } else {
        // Create silent audio track just in case
        const osc = this.audioCtx.createOscillator();
        const silentDest = this.audioCtx.createMediaStreamDestination();
        osc.connect(silentDest);
        osc.start();
        combinedStream.addTrack(silentDest.stream.getAudioTracks()[0]);
      }
      
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `VidyaX-Recording-${new Date().getTime()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      };

      this.mediaRecorder.start();
      this.setState({ isRecording: true });
    } catch (err) {
      console.error('Error starting native session recording:', err);
      this.setState({ isRecording: false });
    }
  }

  render() {
    const { onMinimizeToggle, play, streams } = this.props
    const hasParticipants = streams.length > 0

    return (
      <div className='users'>
        <h3 className='panel-title'>People in this call</h3>
        <ul className='users-list'>
          {map(streams, (stream) => (
            <User
              {...stream}
              key={stream.key}
              onMinimizeToggle={onMinimizeToggle}
              play={play}
            />
          ))}
          {!streams.length && (
            <li className='list-empty'>No participants are connected yet.</li>
          )}
        </ul>
        
        {hasParticipants && (
          <div className='users-options'>
            <button className='option-btn'>Mute All</button>
            <button className='option-btn'>Arrange Grid</button>
            <button 
              className={`option-btn ${this.state.isRecording ? 'recording' : ''}`}
              onClick={this.handleRecordSession}
            >
              {this.state.isRecording ? 'Stop Recording' : 'Record Session'}
            </button>
          </div>
        )}
        
        <div></div> {/*necessary for flex to stretch */}
      </div>
    )
  }
}

function mapStateToProps(state: State) {
  const { all } = getStreamsByState(state)

  return {
    streams: all,
  }
}

export default connect(mapStateToProps)(Users)
