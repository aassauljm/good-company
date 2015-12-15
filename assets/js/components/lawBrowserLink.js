import React, {PropTypes} from 'react';

export default class LawBrowserLink extends React.Component {
    static propTypes = {
        title: PropTypes.string,
        location: PropTypes.string
    };
    formatLink() {
        return `https://browser.catalex.nz/open_article/query?doc_type=instrument&title=${this.props.title}&find=location&location=${this.props.location}`
    }
    render() {
        return <a href={this.formatLink()} target="_blank">{ this.props.children }</a>
    }
};
