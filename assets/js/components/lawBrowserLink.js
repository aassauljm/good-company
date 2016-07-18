import React, {PropTypes} from 'react';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';



export default class LawBrowserLink extends React.Component {
    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    };
    formatLink() {
        return `https://browser.catalex.nz/open_article/query?doc_type=instrument&title=${this.props.title}&find=location&location=${this.props.location}`;
    }
    render() {
        return <a className="law-browser-link" href={this.formatLink()} target="_blank">{ this.props.children }<Glyphicon glyph="new-window"/></a>
    }
};
