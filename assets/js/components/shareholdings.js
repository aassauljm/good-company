"use strict";
import React, {PropTypes} from 'react';
import { showModal } from '../actions';
import { pureRender, numberWithCommas } from '../utils';
import { Link } from 'react-router';
//import PieChart  from 'react-d3-components/lib/PieChart';
import Panel from './panel';
import STRINGS from '../strings';


class NotFound extends React.Component {
    static propTypes = {
        descriptor: PropTypes.string.isRequired
    };
    render() {
        return <div className="container"><h4 className="text-center">{this.props.descriptor} Not Found</h4></div>
    }
};


@pureRender
export class ShareholdingsPanel extends React.Component {

    static propTypes = {
        holdings: PropTypes.array.isRequired,
        totalShares: PropTypes.number.isRequired,
        totalAllocatedShares: PropTypes.number.isRequired
    };

    groupHoldings() {
        const total = this.props.totalAllocatedShares;
        return {values: this.props.holdings.map(holding => ({
            y: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            x: holding.name
        }))};
    };

    countClasses() {
       const length = new Set(this.props.holdings.reduce((acc, holding) => {
            return [...acc, ...holding.parcels.map(p => p.shareClass)]
       }, [])).size;
       return length;
    };

    countHolders() {
       const length = new Set(this.props.holdings.reduce((acc, holding) => {
            return [...acc, ...holding.holders.map(p => p.personId)]
       }, [])).size;
       return length;
    };

    render(){
        const classCount = this.countClasses();
        const holderCount = this.countHolders();
        return <div className="panel panel-info actionable">
            <div className="panel-heading">
            <h3 className="panel-title">Current Shareholdings</h3>
            </div>
            <div className="panel-body">
                <div className="row">
                    <div className="col-xs-6">
                    <div><strong>{numberWithCommas(this.props.totalShares)}</strong> Total Shares</div>
                    <div><strong>{this.props.holdings.length}</strong> Holdings</div>
                    <div><strong>{holderCount}</strong> Shareholder{holderCount !== 1 && 's'}</div>
                    <div><strong>{classCount}</strong> Share Class{classCount !== 1 && 'es'}</div>
                    </div>
                    <div className="col-xs-6 text-center">
                       <div className="hide-graph-labels">
                         { /*<PieChart
                          data={this.groupHoldings()}
                          width={100}
                          height={100}
                          innerRadius={0.0001}
                          outerRadius={50}
                          showInnerLabels={false}
                          showOuterLabels={false} /> */ }
                          </div>
                    </div>
                </div>
            </div>
        </div>
    }
}


@pureRender
export class HoldingDL extends React.Component {
    static propTypes = {
        holding: PropTypes.object.isRequired,
        total: PropTypes.number.isRequired,
        percentage: PropTypes.string.isRequired
    };
    render(){
        return  <dl className="dl-horizontal ">
                <dt>Name</dt>
                <dd>{ this.props.holding.name }</dd>
                <dt>Total Shares</dt>
                <dd>{numberWithCommas(this.props.total) + ' ' + this.props.percentage}</dd>
                <dt>Parcels</dt>
                { this.props.holding.parcels.map((p, i) =>
                    <dd key={i} >{numberWithCommas(p.amount)} of {p.shareClass || STRINGS.defaultShareClass } Shares<br/></dd>) }
                <dt>Holders</dt>
                { this.props.holding.holders.map((holder, i) =>
                    <dd key={i} >{holder.name} <br/>
                    <span className="address">{holder.address}</span></dd>) }
            </dl>
    }
}


@pureRender
export class Holding extends React.Component {
    static propTypes = {
        holding: PropTypes.object.isRequired,
        total: PropTypes.number.isRequired,
        editHolding: PropTypes.func
    };
    render(){
        const sum = this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0),
            percentage = (sum/this.props.total*100).toFixed(2) + '%';

        return <div className="well holding actionable" onClick={() => this.props.editHolding(this.props.holding)}>
            <div className="row">
                <div className="col-xs-10">
                    <HoldingDL holding={this.props.holding} total={sum} percentage={percentage}  />
                </div>
                <div className="col-xs-2">
                   <div className="hide-graph-labels">
                 { /*<<PieChart
                          data={{values: [{y: sum, x: 'this'}, {y: this.props.total-sum, x: 'other'}]}}
                          innerRadius={0.001}
                          outerRadius={30}
                          width={60}
                          height={60} /> */ }
                    </div>
                    </div>
            </div>
        </div>
    }
}


@pureRender
export class Shareholdings extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        showModal: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.editHolding = ::this.editHolding
    }

    editHolding(holding) {
        this.props.showModal('updateHolding', {
            companyId: this.props.companyId,
            companyState: this.props.companyState,
            holding: holding,
            afterClose: {
                location: this.props.location.pathname
            }
        });
    }

    groupHoldings() {
        const total = this.props.companyState.totalAllocatedShares;
        return {values: this.props.companyState.holdingList.holdings.map(holding => ({
            y: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
            x: holding.name
        }))};
    };
    render() {
        return <div className="container"><div className="row">
            <div className="col-md-6">
                { this.props.companyState.holdingList.holdings.map((holding, i) =>
                    <Holding key={i} holding={holding}
                        total={this.props.companyState.totalShares}
                        editHolding={this.editHolding} />
                )}
            </div>
            <div className="col-md-6 text-center">
                <div className="hide-graph-labels">
               {/*<PieChart
                  data={this.groupHoldings()}
                  width={100}
                  height={100}
                  innerRadius={0.0001}
                  outerRadius={50}
                  showInnerLabels={false}
                  showOuterLabels={false} /> */ }
                  </div>
            </div>
        </div>
        </div>
    }
}



