import React, {PropTypes, cloneElement} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Overlay from 'react-bootstrap/lib/Overlay';
import { connect } from 'react-redux';
import { requestLawBrowser } from '../actions';
import Loading from './loading';
import { DragSource, DropTarget } from 'react-dnd';
import contains from 'dom-helpers/query/contains';
import warning from 'warning';
import createChainedFunction from 'react-bootstrap/lib/utils/createChainedFunction';

export const POPOVER_DRAGGABLE = 'POPOVER_DRAGGABLE';

let popoverIndex = 1060;


const otPropTypes = {
  ...Overlay.propTypes,
  /**
   * The initial visibility state of the Overlay. For more nuanced visibility
   * control, consider using the Overlay component directly.
   */
  defaultOverlayShown: React.PropTypes.bool,
  /**
   * An element or text to overlay next to the target.
   */
  overlay: React.PropTypes.node.isRequired,
  onClick: React.PropTypes.func,
};

const otDefaultProps = {
  defaultOverlayShown: false,
};

class OverlayTrigger extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleToggle = this.handleToggle.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
    this._mountNode = null;

    this.state = {
      show: props.defaultOverlayShown,
      leftOffset: 0,
      topOffset: 0
    };
  }

  componentDidMount() {
    this._mountNode = document.createElement('div');
    this.renderOverlay();
  }

  componentDidUpdate() {
    this.renderOverlay();
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this._mountNode);
    this._mountNode = null;
  }

  handleToggle() {
    if (this.state.show) {
      this.hide();
    } else {
      this.show();
    }
  }


  handleHide() {
    this.hide();
  }

  show() {
    this.setState({ show: true });
  }

  hide() {
    this.setState({ show: false, leftOffset: null, topOffset: null, dragged: false });
  }

  updatePosition(offset) {
   this.setState({leftOffset: this.state.leftOffset + offset.x, topOffset:  this.state.topOffset + offset.y, dragged: true, zIndex: popoverIndex++})
  }

  makeOverlay(overlay, props) {
    return (
      <Overlay
        {...props}
        show={this.state.show}
        onHide={this.handleHide}
        animation={false}
        target={this}
      >
        { cloneElement(overlay, {close: this.handleHide,
            updatePosition: this.updatePosition,
            draggedTop: this.state.topOffset,
            draggedLeft: this.state.leftOffset,
            dragged: this.state.dragged})}
      </Overlay>
    );
  }

  renderOverlay() {
    ReactDOM.unstable_renderSubtreeIntoContainer(
      this, this._overlay, this._mountNode
    );
  }

  render() {
    const {
      trigger,
      overlay,
      children,
      onClick,
      ...props
    } = this.props;

    delete props.defaultOverlayShown;
    const child = React.Children.only(children);
    const childProps = child.props;
    const triggerProps = {
      'aria-describedby': overlay.props.id
    };
    triggerProps.onClick = createChainedFunction(childProps.onClick, onClick);
    triggerProps.onClick = createChainedFunction(
        triggerProps.onClick, this.handleToggle
    );
    this._overlay = this.makeOverlay(overlay, props);
    return cloneElement(child, triggerProps);
  }
}

OverlayTrigger.propTypes = otPropTypes;
OverlayTrigger.defaultProps = otDefaultProps;


const defaultProps = {
  placement: 'right',
};


const dragSource = {
  beginDrag(props) {
    return {updatePosition: props.updatePosition}
  }
};

@DragSource(POPOVER_DRAGGABLE, dragSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
}))
class Popover extends React.Component {
  render() {
    const {
      placement,
      dragged,
      positionTop,
      draggedTop,
      positionLeft,
      draggedLeft,
      arrowOffsetTop,
      arrowOffsetLeft,
      title,
      className,
      style,
      close,
      children,
      connectDragSource,
      connectDragPreview,
      zIndex,
      ...props
    } = this.props;

    const outerStyle = {
        ...style,
      display: 'block',
      //top: draggedTop ||   positionTop,
      top: (draggedTop || 0) +  positionTop,
      //left: draggedLeft ||  positionLeft,
      left: (draggedLeft || 0) + positionLeft,
      zIndex: zIndex || popoverIndex
    };
    const arrowStyle = {
      top: arrowOffsetTop,
      left: arrowOffsetLeft,
    };
    return connectDragPreview(
      <div
        role="tooltip"
        className={'popover ' + (dragged ? '' : placement)}
        style={outerStyle}
      >
        { !dragged && <div className="arrow" style={arrowStyle} /> }

        {title &&
          connectDragSource(<h3 className={'popover-title'}>
            {title}
          </h3>
        )}
        {close && <div className="popover-close" onClick={this.props.close}>&times;</div> }
        <div className={'popover-content'}>
          {children}
        </div>
      </div>
    );
  }
}

Popover.defaultProps = defaultProps;


const LAW_BROWSER_URL = 'https://browser.catalex.nz'

const formatLink = (props) => {
    return `${LAW_BROWSER_URL}/open_article/query?doc_type=instrument&title=${props.title}&find=location&location=${props.location}`;
}


const replaceUrls = (html) => html.replace(/href="\//g, `rel="noopener noreferrer" target="_blank" href="${LAW_BROWSER_URL}/`);


@connect(state => state.lawBrowser,
    {
        fetchData: (query) => requestLawBrowser(query)
    })
export class LawBrowserContent extends React.Component {

    componentWillMount() {
        return this.props.fetchData(this.query())
    }

    query() {
        return `${LAW_BROWSER_URL}/query?doc_type=instrument&title=${this.props.title}&find=location&location=${this.props.location}`;
    }

    render() {
        return <div>
            { this.props[this.query()] && this.props[this.query()].data &&
                <div className="fragment">
                    <div dangerouslySetInnerHTML={{__html: replaceUrls(this.props[this.query()].data.html_content) }} />
                </div> }
            { !this.props[this.query()] || !this.props[this.query()].data && <Loading /> }
            <p/>
            <div className="popover-footer">
                  <a className="btn btn-primary" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank">Open in Law Browser <Glyphicon glyph="new-window"/></a>
            </div>
            </div>

    }
}



export class LawBrowserPopover extends React.Component {
    render() {
        return <Popover id={`${this.props.title.replace(' ', '-')}-${this.props.location.replace(' ', '-')}`} title={`${this.props.title} ${this.props.location}`} close={this.props.close} {...this.props}>
                <LawBrowserContent {...this.props} />
              </Popover>
    }
}


export default class LawBrowserLink extends React.Component {

    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    }

    render() {
        return <OverlayTrigger trigger="click" placement="bottom" overlay={ <LawBrowserPopover {...this.props} /> } target={() => ReactDOM.findDOMNode(this.refs.target)}>
           <a ref="target" className="law-browser-link" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank" onClick={e => e.preventDefault()}>{ this.props.children }<Glyphicon glyph="new-window"/></a>
        </OverlayTrigger>
    }
};
