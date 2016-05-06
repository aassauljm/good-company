"use strict"
import React, { PropTypes } from 'react'
import { pureRender }  from '../utils';
import { Link } from 'react-router';
import Actions from '../actions';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import { requestUserInfo } from '../actions';
import { connect } from 'react-redux';


export class CompanyHeader extends React.Component {

    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        userInfo: PropTypes.object.isRequired
    };

    showAccount() {
        if(this.props.userInfo && this.props.userInfo.username){
            return <li className="nav-item">
                <Link activeClassName="active" className="nav-link username" to={"/user/edit/"+this.props.userInfo.id}>{this.props.userInfo.username}
                </Link>
            </li>;
        }
    }


    showLogout() {
        return  <li className="nav-item"><a className="nav-link" href="/logout">Log out</a></li>
    }

    showMenus() {
        //Dashboard (default first page), Share Register, Interests Register, Update Company, Templates
        const id = this.props.companyId;
        return <ul className="nav navbar-nav">
             <li className="nav-item"><Link to={`/company/view/${id}`} activeClassName="active" className="nav-link">Dashboard</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}`} activeClassName="active" className="nav-link">Share Register</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}`} activeClassName="active" className="nav-link">Interests Register</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}`} activeClassName="active" className="nav-link">Update Company</Link></li>
             <li className="nav-item"><Link to={`/company/view/${id}`} activeClassName="active" className="nav-link">Templates</Link></li>
        </ul>
    }

    render() {
        return  <Navbar>


            <NavbarCollapse>




            <div className="navbar-top">
   <a className="navbar-brand" href="#"><span className="company-title">{this.props.companyState.companyName}</span></a>
            <ul className="nav navbar-nav navbar-right">
                { this.showAccount() }
                { this.showLogout() }
            </ul>
            </div>
            <div className="navbar-bottom">
                 {this.showMenus() }
            </div>
             </NavbarCollapse>
      </Navbar>

    }
};



const CompanyHeaderConnected = connect(state => { return { userInfo: state.userInfo} })(CompanyHeader);

export default CompanyHeaderConnected;