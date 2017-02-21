import React from 'react';
import ReactDOM from 'react-dom';


export const ScrollIntoViewOptional = ComposedComponent => {

    class Injector extends React.Component {

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

    return Injector;
}

const ScrollIntoView = ComposedComponent => {

    class Injector extends React.Component {

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

    return Injector;
}


export default ScrollIntoView;
