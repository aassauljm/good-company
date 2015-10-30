import 'babel-core/polyfill';
import ReactDOM from 'react-dom';
import "../styles/style.scss";
import root from "./root"


let mountNode = document.getElementById("main");
if (mountNode)
    ReactDOM.render(<Root />, mountNode);


