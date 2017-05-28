import React from 'react';
import ReactDOM from 'react-dom';


export const ScrollIntoViewOptional = ComposedComponent => {

    class ScrollInjector extends React.PureComponent {

        componentDidMount() {
            if(this.props.scrollIntoView){
                const comp = ReactDOM.findDOMNode(this);
                if(comp && comp.scrollIntoView){
                    comp.scrollIntoView({block: "start", behavior: "smooth"});
                }
            }
        }


        render() {
            const {scrollIntoView, ...props} = this.props;
            return <ComposedComponent {...props} />;
        }
    }

    return ScrollInjector;
}

const ScrollIntoView = ComposedComponent => {

    class ScrollInjector extends React.PureComponent {

        componentDidMount() {
            const comp = ReactDOM.findDOMNode(this);
            if(comp && comp.scrollIntoView){
                comp.scrollIntoView({block: "start", behavior: "smooth"});
            }
        }


        render() {
            const {scrollIntoView, ...props} = this.props;
            return <ComposedComponent {...props} />;
        }
    }

    return ScrollInjector;
}


export default ScrollIntoView;
