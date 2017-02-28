import React from 'react';
import ReactDOM from 'react-dom';

/*
function childrenAreScrollingIntoView(children){
    return React.Children.toArray(children).some(c => c.props && (c.props.scrollIntoView || childrenAreScrollingIntoView(c.props.children)));
}
*/

const ScrollToTop = ComposedComponent => {

    class Injector extends React.Component {

        componentDidMount() {
            window && window.scroll && window.scroll(window.scrollY, 0);
        }


        render() {
            const {...props} = this.props;
            return <ComposedComponent {...props} />;
        }
    }

    return Injector;
}

export default ScrollToTop;