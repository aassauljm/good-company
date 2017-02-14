import React from 'react';
import ReactDOM from 'react-dom';


const ScrollToTop = ComposedComponent => {

    class Injector extends React.Component {

        componentDidMount() {
            window && window.scroll && window.scroll(window.scrollY, 0)
        }


        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} />;
        }
    }

    return Injector;
}

export default ScrollToTop;