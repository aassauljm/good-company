"use strict"
import React, { PropTypes } from 'react'
import ReactDOM  from 'react-dom'
import { pureRender }  from '../utils';
import { Link, IndexLink, withRouter } from 'react-router';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { addNotification, createResource, deleteResource, endTransactionView } from '../actions';
import { connect } from 'react-redux';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux';
import moment from 'moment'
import Calendar from 'react-widgets/lib/Calendar'
import { OverlayTrigger, OverlayPosition, Popover }   from './lawBrowserLink';
import Raven from 'raven-js';
import FavouriteControl from './favourites';


const DropdownToggle = (props) => {
    return <Link to={props.href} onClick={(e) => {e.preventDefault(); props.onClick(e);}} activeClassName="active" className={props.className} >
        {props.children}
      </Link>
}

@connect((state, ownProps) => ({login: state.login, userInfo: state.userInfo, routing: state.routing}),
    (dispatch) => ({
        navigate: (url) => { dispatch(push(url)); dispatch(endTransactionView()) },
    })
)
export default class CompanyHeader extends React.Component {

    constructor(props){
        super();
        this.selectDate = ::this.selectDate
        this.state = {companyState: props.companyState};
    }

    componentWillReceiveProps(newProps) {
        if(newProps.companyState && newProps.companyState.companyName){
            this.setState({companyState: newProps.companyState})
        }
    }

    closeMenu() {
        // ugly ugly
        //this.refs.dropdown.refs.inner.handleClose()
    }

    canUpdate() {
        return (this.props.companyState.permissions || []).indexOf('update') >= 0;
    }

    renderRightActions() {
        return [<div key={0} className="favourite">
                <FavouriteControl showLabel={true} companyId={this.props.companyId}/>
        </div>]
    }

    renderNavLinks() {
        const id = this.props.companyId;

        return [ <li key={-1} className="nav-item separator" />,
                <li key={0} className="nav-item">
                    <IndexLink to={this.props.baseUrl} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Dashboard</IndexLink>
                </li>,

             <Dropdown key={1} id="register-dropdown" className="nav-item" componentClass="li" >
                    <DropdownToggle href={`${this.props.baseUrl}/registers`} bsRole="toggle">
                        Registers
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/registers/shareregister`)}><span className="fa fa-book"/>Share Register</MenuItem>
                        <MenuItem  onClick={() => this.props.navigate(`${this.props.baseUrl}/registers/interests_register`)}><span className="fa fa-book"/>Interests Register</MenuItem>
                        <MenuItem  onClick={() => this.props.navigate(`${this.props.baseUrl}/registers/director_register`)}><span className="fa fa-book"/>Director Register</MenuItem>
                        </Dropdown.Menu>
                </Dropdown> ,

             this.canUpdate() && <Dropdown key={3} id="update-dropdown" className="nav-item" componentClass="li">
                    <DropdownToggle href={`${this.props.baseUrl}/new_transaction`} bsRole="toggle" className="update-dropdown">
                        Update
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/contact`) }><span className="fa fa-envelope"/> Contact</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/people`) }><span className="fa fa-users"/> People</MenuItem>
                        <MenuItem className="update-shares" onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/shares`) }><span className="fa fa-exchange"/> Shares</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`${this.props.baseUrl}/new_transaction/reset_delete`) }><span className="fa fa-trash-o"/> Reset or Delete</MenuItem>
                        </Dropdown.Menu>
                </Dropdown> ,
              this.canUpdate() && <li key={4} className="nav-item"><Link to={`${this.props.baseUrl}/templates`} onClick={this.closeMenu} activeClassName="active" className="nav-link">Templates</Link></li>,
             ]
    }

    dateControl() {
        const date = new Date(this.props.companyState.transaction ? this.props.companyState.transaction.effectiveDate : this.props.companyState.incorporationDate);
        return <div className="calendar-toggle">
                <OverlayTrigger placement="bottom" rootClose={true} overlay={
                    <Popover title="Select Date" className="time-travel">
                        <div>
                            <Calendar value={date} onChange={this.selectDate} />
                            <div className="button-row">
                            <Link to={`/company/view/${this.props.companyId}`} className="btn btn-info">Today</Link>
                            </div>
                        </div>
                    </Popover>
                }>
                <span className="actionable fa fa-calendar" />

                </OverlayTrigger>
        </div>
    }

    selectDate(value) {
        const date = moment(value).format('D-M-YYYY');
        this.props.navigate(`/company/at_date/${date}/view/${this.props.companyId}`);
    }

     render() {
        let date = this.props.date || this.state.companyState.dateOfState;
        let dateString = moment(date).format('hh:mm a D MMMM YYYY');
        return <div className="container">
            <div className="nav-controls">

                    <div className="company-summary">
                        <h1>{ this.state.companyState.companyName}</h1>
                        <h2>{ !this.canUpdate() && <strong>View Only </strong>}{ this.dateControl() } as at { dateString }  </h2>
                    </div>
                    <div className="full-controls">
                        <ul className="nav navbar-nav">
                        { this.renderNavLinks() }
                       </ul>

                      <ul className="nav navbar-nav pull-right">
                             { this.renderRightActions() }
                        </ul>
                    </div>

                    <div className="small-controls">
                            <ul className="nav navbar-nav">
                        <Dropdown id="menu-dropdown" className="nav-item" componentClass="li">
                           <DropdownToggle href={`/company/view/${this.props.companyId}`} className="active" bsRole="toggle">Menu</DropdownToggle>
                        <Dropdown.Menu bsRole="menu">
                                 { this.renderNavLinks() }
                            </Dropdown.Menu>
                     </Dropdown>
                     </ul>

                      <ul className="nav navbar-nav pull-right">
                             { this.renderRightActions() }
                        </ul>

                    </div>

            </div>

            </div>
        }
}
