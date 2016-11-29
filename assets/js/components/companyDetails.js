"use strict";
import React, {PropTypes} from 'react';
import { showTransactionView } from '../actions';
import { pureRender, numberWithCommas, stringDateToFormattedString } from '../utils';
import ButtonInput from './forms/buttonInput';
import { Link } from 'react-router';
import STRINGS from '../strings';
import RadialGraph from './graphs/radial';


function companyStateToTree(state){
    return {
        name: state.companyName,
        children: [
            {
                name: 'Directors',
                children: state.directorList.directors.map(d => ({
                    name: d.person.name
                }))
            },
            {
                name: 'Shareholdings',
                children: state.holdingList.holdings.map(h => ({
                    name: h.name,
                    radiusProportion: h.parcels.reduce((sum, p) => sum + p.amount, 0) / state.totalShares,
                    children: h.holders.map(h => ({
                                name: h.person.name
                            }))
                }))
            }
        ]
    }
}

@pureRender
export class DetailsPanel extends React.Component {
    static propTypes = {
        companyState: PropTypes.object.isRequired
    };
    render(){

        const current = this.props.companyState;
        return <div className="panel panel-warning" >
            <div className="panel-heading">
            <h3 className="panel-title">Company Details</h3>
            </div>
            <div className="panel-body">
            <div className="row">
            <div className="col-xs-6">
                    <div><strong>Name</strong> {current.companyName}</div>
                    <div><strong>NZ Business Number</strong> {current.nzbn ||  'Unknown'}</div>
                    <div><strong>Incorporation Date</strong> {stringDateToFormattedString(current.incorporationDate)}</div>
                    </div>
            <div className="col-xs-6">
                    <div><strong>AR Filing Month</strong> {current.arFilingMonth ||  'Unknown'}</div>
                    <div><strong>Entity Type</strong> {current.entityType ||  'Unknown' }</div>
                    </div>
                </div>
            </div>
        </div>
    }
}



@pureRender
export class CompanyGraph extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        showTransactionView: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.editDirector = ::this.editDirector;
    }

    editDirector(director) {
        this.props.showTransactionView('updateDirector', {
            companyId: this.props.companyId,
            companyState: this.props.companyState,
            director: director,
            afterClose: {
                location: this.props.location.pathname
            }
        });
    }

    render() {
        const current = this.props.companyState;
        return <div className="container">
            <RadialGraph data={companyStateToTree(current)} />
            </div>
    }
}




