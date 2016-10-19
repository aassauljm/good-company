"use strict";
import React, {PropTypes} from 'react';
import { requestResource, showModal } from '../actions';
import { pureRender, numberWithCommas, stringToDate } from '../utils';
import { connect } from 'react-redux';
import STRINGS from '../strings';
import { asyncConnect } from 'redux-connect';




export class Shareholder extends React.Component {
    static propTypes = {
        shareholder: PropTypes.object.isRequired,
        editHolder: PropTypes.func
    };

    render() {
        const classList = ['shareholder', 'well'];
        if(this.props.editHolder){
            classList.push('actionable')
        }
        const classes = classList.join(' ')
        return <div className={classes}  onClick={() => this.props.editHolder && this.props.editHolder(this.props.shareholder) }>
            <dl className="dl-horizontal" >
                <dt>Name</dt>
                <dd>{ this.props.shareholder.name }</dd>
                <dt>Address</dt>
                <dd><span className="address">{ this.props.shareholder.address}</span></dd>
                { this.props.shareholder.firstEffectiveDate && <dt>Shareholder since</dt> }
                { this.props.shareholder.firstEffectiveDate && <dd>{ stringToDate(this.props.shareholder.firstEffectiveDate) }</dd> }
                { this.props.shareholder.current && <dt>Current Parcels</dt> }
                { this.props.shareholder.current &&  this.props.shareholder.parcels.map((p, i) => {
                    const shareClass = p.shareClass || STRINGS.defaultShareClass;
                    const amount = numberWithCommas(p.amount);
                    return <dd key={i}>{`${amount} ${shareClass} shares`}</dd> ;
                }) }
                { this.props.shareholder.lastEffectiveDate && <dt>Shareholder until</dt> }
                { this.props.shareholder.lastEffectiveDate && <dd>{ stringToDate(this.props.shareholder.lastEffectiveDate) }</dd> }
            </dl>
        </div>
    }
}


@asyncConnect([{
    key: 'shareholders',
    promise: ({store: {dispatch, getState}, params}) => {
        return dispatch(requestResource('/company/' + params.id + '/shareholders'));
    }
}])
@connect((state, ownProps) => {
    return {data: {}, ...state.resources['/company/'+ownProps.params.id +'/shareholders']}
})
export class Shareholders extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
    };

    key() {
        return this.props.params.id
    }

    render() {
        const shareholders = (this.props.data || {}).shareholders;
        if(!shareholders){
            return <div className="loading"></div>
        }
        const editHolder = (person) => {
            this.props.dispatch(showModal('updatePerson', {
                companyState: this.props.companyState,
                companyId: this.props.companyId,
                person: person,
                afterClose: {
                    location: this.props.location.pathname
                }}));
        }
        const current = shareholders.filter(s => s.current).map((shareholder, i) => <div key={i}><Shareholder shareholder={shareholder} editHolder={editHolder}/></div>);
        const previous = shareholders.filter(s => !s.current).map((shareholder, i) => <div  key={i}><Shareholder shareholder={shareholder}  /></div>);
        return <div className="container">
                 <div className="row">
                <div className="text-center"><h3>Current Shareholders</h3></div>
                    <div className="col-md-6">
                        { current.slice(0, current.length/2)}
                    </div>
                    <div className="col-md-6">
                        { current.slice(current.length/2) }
                    </div>
                </div>
                { shareholders.filter(s => !s.current).length !== 0 &&
                 <div className="row">
                    <div className="text-center"><h3>Former Shareholders</h3></div>
                    <div className="col-md-6">
                        { previous.slice(0, previous.length/2) }
                    </div>
                    <div className="col-md-6">
                        { previous.slice(previous.length/2) }
                    </div>
                </div> }
            </div>
    }
}

@pureRender
export class ShareholdersPanel extends React.Component {
    static propTypes = {
    };
    render(){
        return <div className="panel panel-danger" >
            <div className="panel-heading">
            <h3 className="panel-title">Shareholders</h3>
            </div>
            <div className="panel-body">
                View all past and present shareholders
            </div>
        </div>
    }
}
