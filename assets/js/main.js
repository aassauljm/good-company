import React from "react"

import  "../styles/style.scss"

class Test extends React.Component {
    render() {
        return <div>Hello  pews {this.props.name}</div>;

    }
}

React.render(
  <Test name="World"/>,
  document.body
);
