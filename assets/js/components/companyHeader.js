"use strict"
import React, { PropTypes } from 'react'
import { pureRender }  from '../utils';
import { Link, IndexLink } from 'react-router';
import { requestResource, createResource, deleteResource, addNotification, showTransactionView, resetTransactionViews } from '../actions';
import Navbar from 'react-bootstrap/lib/Navbar'
import Collapse from 'react-bootstrap/lib/Collapse'
import NavbarHeader from 'react-bootstrap/lib/NavbarHeader';
import NavbarToggle from 'react-bootstrap/lib/NavbarToggle';
import NavbarCollapse from 'react-bootstrap/lib/NavbarCollapse';
import Dropdown from 'react-bootstrap/lib/Dropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { requestUserInfo } from '../actions';
import { connect } from 'react-redux';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { push } from 'react-router-redux';
import { AccountControls } from './header'
import { FavouritesHOC } from '../hoc/resources';


const DropdownToggle = (props) => {
    return <a href={props.href} onClick={(e) => {e.preventDefault(); props.onClick(e);}}>
        {props.children}
      </a>
}

@FavouritesHOC()
export class CompanyHeader extends React.Component {

    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        userInfo: PropTypes.object.isRequired,
        favourites: PropTypes.object.isRequired
    };

    constructor(){
        super();
        this.closeMenu = ::this.closeMenu;
    }

    closeMenu() {
        this.props.resetData();
        // ugly ugly
        this.refs.dropdown.refs.inner.handleClose()
    }

    renderFavourites() {
        const items = (this.props.favourites.data || []);
        if(items.length){
           return [<li key={-1} className="separator" />].concat(items.map((f, i) => {
                return <li key={i}><Link to={`/company/view/${f.id}`} onClick={this.closeMenu}>{f.currentCompanyState.companyName}</Link></li>
           }));
       }
    }

    renderNavLinks() {
        const id = this.props.companyId;
        return [ <li key={-1} className="nav-item separator" />,
                <li key={0} className="nav-item">
                    <IndexLink to={`/company/view/${id}`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Dashboard</IndexLink>
                </li>,

                <Dropdown key={1} id="register-dropdown" className="nav-item" componentClass="li">
                    <DropdownToggle href={`/company/view/${id}/registers`} bsRole="toggle">
                        Registers
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/shareregister`)}><span className="fa fa-book"/>Share Register</MenuItem>
                        <MenuItem  onClick={() => this.props.navigate(`/company/view/${id}/interests_register`)}><span className="fa fa-book"/>Interests Register</MenuItem>
                        </Dropdown.Menu>
                </Dropdown>,

              <Dropdown key={3} id="update-dropdown" className="nav-item" componentClass="li">
                    <DropdownToggle href={`/company/view/${id}/new_transaction`} bsRole="toggle">
                        Update
                   </DropdownToggle>
                    <Dropdown.Menu bsRole="menu">
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/new_transaction/contact`) }><span className="fa fa-envelope"/> Contact</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/new_transaction/people`) }><span className="fa fa-users"/> People</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/new_transaction/shares`) }><span className="fa fa-exchange"/> Shares</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/new_transaction/reset_delete`) }><span className="fa fa-trash-o"/> Reset or Delete</MenuItem>
                        {/*<MenuItem onClick={() => this.startTransaction('addAssignShares') }>Add & Assign Share Classes</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('consolidateDivide') }>Consolidate or Subdivide Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('issue')}>Issue New Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('repurchaseRedeem') }>Repurchase or Redeem Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('transfer') }>Transfer Shares</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/contact`) }>Update Contact</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('updateAddresses')  }>Update Addresses</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('selectDirector') }>Update Directors</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('updateHoldingHolder') }>Update Shareholders</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('resetDelete') }>Reset or Delete Company</MenuItem> */ }
                        </Dropdown.Menu>
                </Dropdown>,
             <li key={4} className="nav-item"><Link to={`/company/view/${id}/templates`} onClick={() => this.closeMenu()} activeClassName="active" className="nav-link">Templates</Link></li>,
             ]
    }

    startTransaction(key) {
        const id = this.props.companyId;
        this.props.navigate(`/company/view/${id}/new_transaction`);
        this.props.startTransaction(key, this.props.companyState, this.props.companyId);
    }


    isFavourite() {
        const companyIdInt = parseInt(this.props.companyId, 10);
        // save result maybe
        return (this.props.favourites.data || []).filter(f => f.id === companyIdInt && f.favourited).length;
    }

    renderRightActions() {
        const glyph = this.isFavourite() ? 'star' : 'star-empty';
        return [<li key={0} className="nav-item">
            <a className="favourite actionable" href="#" onClick={() => this.toggleFavourite()}><Glyphicon glyph={glyph}/> <span className="visible-lg-inline">Favourite</span></a>
        </li>]
    }

    toggleFavourite() {
        (this.isFavourite() ? this.props.removeFavourite(this.props.companyId) : this.props.addFavourite(this.props.companyId))
            .then(response => {

            })
            .catch(e => {
                this.props.addNotification({error: true, message: this.isFavourite() ? 'Could not remove Favourite' : 'Could not add Favourite.'})
            })
    }

    render() {
        return  <Navbar>
            <div className="navbar-top">
                <Navbar.Header>

                    <Navbar.Brand>
                        <Dropdown id="title-dropdown"  ref="dropdown">
                            <DropdownToggle href="/" bsRole="toggle">
                                <span className="company-title"><Glyphicon glyph='menu-hamburger'/> {this.props.companyState.companyName}</span>
                            </DropdownToggle>
                            <Dropdown.Menu>
                                <li><Link to="/">Good Companies Home</Link></li>

                                { this.renderNavLinks() }
                                { this.renderFavourites() }
                                 <li className="separator" />
                               <li >
                                    <a href={this.props.login.userUrl} >{this.props.userInfo.username}
                                    </a>
                                </li>
                                <li><a href="/logout">Log out</a></li>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Navbar.Brand>
                </Navbar.Header>
                <NavbarCollapse>
                   <AccountControls {...this.props} />
                </NavbarCollapse>

            </div>
            <div className="navbar-bottom">
            <NavbarCollapse>
                 <ul className="nav navbar-nav">
                    { this.renderNavLinks() }
                   </ul>
                   <ul className="nav navbar-nav pull-right">
                        { this.renderRightActions() }
                   </ul>
            </NavbarCollapse>
            </div>
      </Navbar>

    }
};




const CompanyHeaderConnected = connect(state => {
     // adding routes so links update active status
    return { login: state.login, userInfo: state.userInfo, routing: state.routing }
}, {
    navigate: (url) => push(url),
    resetData: () => resetTransactionViews(),
    addFavourite: (id) => createResource(`/favourites/${id}`,  null, {invalidates: ['/favourites']}),
    removeFavourite: (id) => deleteResource(`/favourites/${id}`, {invalidates: ['/favourites']}),
    addNotification: (args) => addNotification(args),
    startTransaction: (key, companyState, companyId) => showTransactionView(key, {companyState: companyState, companyId: companyId})
})(CompanyHeader);

export default CompanyHeaderConnected;