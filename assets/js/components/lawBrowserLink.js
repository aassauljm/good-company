import React, {PropTypes, cloneElement} from 'react';
import ReactDOM from 'react-dom';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Overlay from 'react-bootstrap/lib/Overlay';
import { connect } from 'react-redux';
import { requestLawBrowser } from '../actions';
import Loading from './loading';
import { DragSource, DropTarget } from 'react-dnd';
import createChainedFunction from 'react-bootstrap/lib/utils/createChainedFunction';
import { fetch } from '../utils';
import Position from 'dom-helpers/query/position';
import Offset from 'dom-helpers/query/offset';
import contains from 'dom-helpers/query/contains';


export const POPOVER_DRAGGABLE = 'POPOVER_DRAGGABLE';

const LAW_BROWSER_URL = 'https://browser.catalex.nz';

const formatLink = (props) => {
    if(props.location){
        return `${LAW_BROWSER_URL}/open_article/query?doc_type=instrument&title=${props.title}&find=location&location=${props.location}`;
    }
    else if(props.definition){
        return `${LAW_BROWSER_URL}/open_definition/${props.definition}`;

    }
}


const replaceUrls = (html) => html.replace(/href="\//g, `rel="noopener noreferrer" target="_blank" href="${LAW_BROWSER_URL}/`);

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



export class OverlayTrigger extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleToggle = ::this.handleToggle
    this.handleHide = ::this.handleHide
    this.handleShow = ::this.handleShow
    this.updatePosition = ::this.updatePosition
    this.handleMouseOver = ::this.handleMouseOver;
    this.handleMouseOut = ::this.handleMouseOut;
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

  handleMouseOver(e) {
    this.handleMouseOverOut(this.handleShow, e)
  }

  handleMouseOut(e) {
    this.handleMouseOverOut(this.handleHide, e)
  }

  handleMouseOverOut(handler, e) {
        const target = e.currentTarget;
        const related = e.relatedTarget || e.nativeEvent.toElement;
        //console.log(target, related, contains(target, related))
        if (!related || related !== target && !contains(target, related)) {
            handler(e);
        }
  };

  handleToggle(eventProxy) {
    if (this.state.show) {
      this.hide();
    } else {
        this.positionShow(eventProxy);
    }
  }

  positionShow(eventProxy) {
     const calcPlacement = (target) => {
        const pos = target.getBoundingClientRect();
        const doc = target.ownerDocument;
        if(!doc){
            return;
        }
        const win = doc.defaultView || doc.parentWindow;
        if(!win){
            return
        }
        const [elX, elY] = [pos.left + pos.width/2, pos.top + pos.height/2]
        const [width, height] = [win.innerWidth, win.innerHeight];
        const distances = [
            {dist: elY, placement: 'top'},
            {dist: height - elY, placement: 'bottom'},
            {dist: elX, placement: 'left'},
            {dist: width - elX, placement: 'right'}
        ]
        distances.sort((a, b) => b.dist - a.dist);
        return distances[0].placement
    }
    this.show(calcPlacement(eventProxy.target));
  }

  handleHide() {
    this.hide();
  }

  handleShow(eventProxy) {
    if(eventProxy){
        this.positionShow(eventProxy);
    }
    else{
        this.show();
    }
  }

  show(placement) {
    this.setState({ show: true, placement });
  }

  hide() {
    this.setState({ show: false, leftOffset: null, topOffset: null, dragged: false });
  }

  updatePosition(offset) {
        this.setState({leftOffset: this.state.leftOffset + offset.x, topOffset:  this.state.topOffset + offset.y, dragged: true, zIndex: popoverIndex++})
  }

  makeOverlay(overlay, props) {
    let overlayProps = {
    }
    if(!this.props.hover){
         overlayProps = {
            close: this.handleHide,
            updatePosition: this.updatePosition,
            reposition: () => this.forceUpdate(),
            draggedTop: this.state.topOffset,
            draggedLeft: this.state.leftOffset,
            dragged: this.state.dragged
        }
    }
    return (
      <Overlay
        {...props}
        show={this.state.show}
        onHide={this.handleHide}
        animation={false}
        target={this}
        placement={this.state.placement}
        shouldUpdatePosition={true}
      >
        { cloneElement(overlay, overlayProps)}
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
      onMouseOut,
      onMouseOver,
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

    if(this.props.hover){
        triggerProps.onMouseOver = createChainedFunction(childProps.onMouseOver, onMouseOver, this.handleMouseOver);
        triggerProps.onMouseOut = createChainedFunction(childProps.onMouseOut, onMouseOut, this.handleMouseOut);
    }
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
          { React.Children.map(children, c => cloneElement(c, c.needsReposition ? {reposition: this.props.reposition} : null)) }
        </div>
      </div>
    );
  }
}

Popover.defaultProps = defaultProps;





export class LawBrowserContent extends React.Component {
    render() {
        return <div>
            { this.props.data &&
                <div className="fragment">
                    <div dangerouslySetInnerHTML={{__html: replaceUrls(this.props.data.html_content) }} />
                </div> }
            {  !this.props.data && <Loading /> }
            <p/>
            </div>
    }
}


@connect(state => state.lawBrowser,
    {
        fetchData: (query) => requestLawBrowser(query)
    })
export class LawBrowserPopover extends React.Component {
    query() {
        if(this.props.location){
            return `${LAW_BROWSER_URL}/query?doc_type=instrument&title=${this.props.title}&find=location&location=${this.props.location}`;
        }
        else if(this.props.definition){
             return `${LAW_BROWSER_URL}/definition/${this.props.definition}`;
        }
    }

    data() {
        return this.props[this.query()] && this.props[this.query()].data;
    }

    componentWillMount() {
        return this.props.fetchData(this.query())
            .then(() => {
                this.props.reposition();
            })
    }

    render() {
        const id = `${this.props.title.replace(' ', '-')}-${this.props.location ? this.props.location.replace(' ', '-') : this.props.definition}`
        const title = this.data() ? this.data().full_title : this.props.title;
        return <Popover {...this.props} id={id} title={title} close={this.props.close}>
                <LawBrowserContent data={this.data()} needsReposition/>
                   <div className="popover-footer">
                      <a className="btn btn-primary" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank">Open in Law Browser <Glyphicon glyph="new-window"/></a>
                </div>
              </Popover>
    }
}

let touchStatus = null;


export default class LawBrowserLink extends React.Component {

    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    }

    static doTouch() {
        // Do DNS lookup and SSL handshake
        if(!touchStatus){
            touchStatus = 'fetching';
            fetch(`${LAW_BROWSER_URL}/touch`)
                .then(() => {
                    touchStatus = 'complete';
                })
                .catch(() => {
                    touchStatus = 'error';
                })
        }

    }

    componentWillMount() {
        LawBrowserLink.doTouch();
    }

    render() {
        return <OverlayTrigger trigger="click" overlay={ <LawBrowserPopover {...this.props} /> } target={() => ReactDOM.findDOMNode(this.refs.target)}>
           <a ref="target" className="law-browser-link" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank" onClick={e => e.preventDefault()}>{ this.props.children }<Glyphicon glyph="new-window"/></a>
        </OverlayTrigger>
    }
};
