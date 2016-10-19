import React, {PropTypes} from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';
import { connect } from 'react-redux';
import { requestLawBrowser } from '../actions';
import Loading from './loading';

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
            <div className="button-row">
                  <a className="btn btn-primary" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank">Open in Law Browser <Glyphicon glyph="new-window"/></a>
            </div>
            </div>

    }
}



function CreateLawBrowserPopover(props){
    return <Popover id={`${props.title.replace(' ', '-')}-${props.location.replace(' ', '-')}`} title={`${props.title} ${props.location}`}>
            <LawBrowserContent {...props} />
          </Popover>
}


export default class LawBrowserLink extends React.Component {

    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    }

    render() {
        return <OverlayTrigger trigger="click" placement="bottom" overlay={ CreateLawBrowserPopover(this.props) } rootClose>
            <a className="law-browser-link" href={formatLink(this.props)} rel="noopener noreferrer" target="_blank" onClick={e => e.preventDefault()}>{ this.props.children }<Glyphicon glyph="new-window"/></a>
        </OverlayTrigger>
    }
};
