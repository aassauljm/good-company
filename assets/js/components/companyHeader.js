"use strict"
import React, { PropTypes } from 'react'
import { pureRender }  from '../utils';
import { Link, IndexLink } from 'react-router';
import { requestResource, createResource, deleteResource, addNotification, showModal } from '../actions';
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
        // ugly ugly
        this.refs.dropdown.refs.inner.handleClose()
    }

    fetch() {
        return this.props.requestData();
    };
    componentDidMount() {
        this.fetch();
    };

    componentDidUpdate() {
        this.fetch();
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

    renderFavourites() {
        const items = (this.props.favourites.data || []);
        if(items.length){
           return [<li key={-1} className="separator" />].concat(items.map((f, i) => {
                return <li key={i}><Link to={`/company/view/${f.id}`} onClick={this.closeMenu}>{f.currentCompanyState.companyName}</Link></li>
           }));
       }
    }

    renderActions() {
        const id = this.props.companyId;
        return [<li key={0} className="nav-item">
                    <IndexLink to={`/company/view/${id}`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Dashboard</IndexLink>
                </li>,
                <li key={1} className="nav-item">
                    <Link to={`/company/view/${id}/shareregister`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Share Register</Link>
                </li>,
                <li key={2} className="nav-item">
                    <Link to={`/company/view/${id}/interests_register`} activeClassName="active" className="nav-link"  onClick={this.closeMenu}>Interests Register</Link>
                </li>,

              <Dropdown key={3} id="update-dropdown" className="nav-item" componentClass="li">
                    <a href="#" onClick={e => e.preventDefault}  bsRole="toggle">
                        Update Company
                   </a>
                    <Dropdown.Menu>
                        <MenuItem onClick={() => this.startTransaction('addAssignShares') }>Add & Assign Share Classes</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('consolidateDivide') }>Consolidate or Subdivide Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('issue')}>Issue New Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('repurchaseRedeem') }>Repurchase or Redeem Shares</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('transfer') }>Transfer Shares</MenuItem>
                        <MenuItem onClick={() => this.props.navigate(`/company/view/${id}/contact`) }>Update Contact</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('selectDirector') }>Update Directors</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('updateHoldingHolder') }>Update Shareholders</MenuItem>
                        <MenuItem onClick={() => this.startTransaction('resetDelete') }>Reset or Delete Company</MenuItem>
                        </Dropdown.Menu>
                </Dropdown>,
             <li key={4} className="nav-item"><Link to={`/company/view/${id}/templates`} activeClassName="active" className="nav-link">Templates</Link></li>,
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
            <a className="favourite actionable" href="#" onClick={() => this.toggleFavourite()}><Glyphicon glyph={glyph}/> Favourite</a>
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
                            <a href="#" onClick={e => e.preventDefault}  bsRole="toggle">
                                <span className="company-title"><Glyphicon glyph='menu-hamburger'/> {this.props.companyState.companyName}</span>
                            </a>
                            <Dropdown.Menu>
                                <li><Link to="/">Good Company Home</Link></li>
                                <li className="nav-item separator" />
                                { this.renderActions() }
                                { this.renderFavourites() }
                            </Dropdown.Menu>
                        </Dropdown>
                    </Navbar.Brand>
                </Navbar.Header>
                <NavbarCollapse>
                    <ul className="nav navbar-nav navbar-right">
                        { this.showAccount() }
                        { this.showLogout() }
                    </ul>
                </NavbarCollapse>

            </div>
            <div className="navbar-bottom">
            <NavbarCollapse>
                 <ul className="nav navbar-nav">
                    { this.renderActions() }
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
    return { userInfo: state.userInfo, routing: state.routing, favourites: state.resources['/favourites'] || {} }
}, {
    requestData: (key) => requestResource('/favourites'),
    navigate: (url) => push(url),
    addFavourite: (id) => createResource(`/favourites/${id}`,  null, {invalidates: ['/favourites']}),
    removeFavourite: (id) => deleteResource(`/favourites/${id}`, {invalidates: ['/favourites']}),
    addNotification: (args) => addNotification(args),
    startTransaction: (key, companyState, companyId) => showModal(key, {companyState: companyState, companyId: companyId})
})(CompanyHeader);

export default CompanyHeaderConnected;