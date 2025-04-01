import { Component } from "preact";
import { html } from "htm/preact";

const showCrossfade = [ '', 'shown', 'shown']
const showCurrent = [ 'shown', '', 'shown']

export class CrossfadeImage extends Component {
  constructor(props) {
    super(props);

    const { url } = props;
    this.state = {
      crossfade: url,
      current: url,
      fadeStage: 0
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) {
      this.setState({ 
        crossfade: this.props.url,
        fadeStage: 1
      });
      setTimeout(() => {
        this.setState({ 
          current: this.props.url,
          fadeStage: 2
        });
        setTimeout(() => {
          this.setState({ 
            fadeStage: 0
          });
        }, 500);
      }, 500);
    }
  }

  render() {
    return html`
      <img
        class="crossfade-image ${(showCrossfade[this.state.fadeStage] && this.state.crossfade) ? 'shown' : ''} ${this.props.cover ? 'cover' : ''}"
        src=${this.state.crossfade}
      />
      <img
        class="crossfade-image ${(showCurrent[this.state.fadeStage] && this.state.current) ? 'shown' : ''} ${this.props.cover ? 'cover' : ''}"
        src=${this.state.current}
      />
    `
  }
}