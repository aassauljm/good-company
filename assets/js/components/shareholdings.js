"use strict";
import React, {PropTypes} from 'react';
import { pureRender, numberWithCommas, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import { Link } from 'react-router';
import PieChart  from 'react-d3-components/lib/PieChart';
import Panel from './panel';
import STRINGS from '../strings';
import AutoAffix from 'react-overlays/lib/AutoAffix';

function largestHolders(shareClass, total, companyState, count = 3){
    const list = companyState.holdingList.holdings.reduce((acc, h) => {
        h.parcels.map(p => {
            if(p.shareClass === shareClass){
                acc.push({amount: p.amount, holding: h})
            }
        });
        return acc;
    }, []);
    list.sort((a, b) => b.amount - a.amount);

    return list.slice(0, count);
}


function renderHolders(holding){
    return joinAnd(holding.holders.map(h => h.person), {prop: 'name'});
}


function pieTooltip(x, y){
    const holding = this.data.values.filter(v => v.data.holdingId === x)[0].data;
    return <div className="graph-tooltip">{ renderHolders(holding) }</div>
}


function groupHoldings(companyState) {
    const total = companyState.totalAllocatedShares;
    return {values: companyState.holdingList.holdings.map(holding => ({
        y: holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100,
        x: holding.holdingId,
        data: holding
    }))};
};

@pureRender
export class ShareholdingsWidget extends React.Component {

    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func.isRequired,
        expanded: PropTypes.bool
    };

    countHolders() {
       return Object.keys(this.props.companyState.holders).length;
    }

    render() {
        const holderCount = this.countHolders();
        const shareCountByClass = this.props.companyState.shareCountByClass;
        const shareClassMap = generateShareClassMap(this.props.companyState);
        const classCount = Object.keys(shareClassMap).length

        let bodyClass = "widget-body expandable ";
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return <div className="widget shareholding-widget">
            <div className="widget-header">
                <div className="widget-title">
                    Shareholdings
                </div>
                <div className="widget-control">
                <Link to={`/company/view/${this.props.companyId}/shareholdings`}>View All</Link>
                </div>
            </div>

            <div className={bodyClass} onClick={() => this.props.toggle(!this.props.expanded)}>
                <div className="row">
                    <div className="col-sm-6 summary">
                    <div><span className="number">{numberWithCommas(this.props.companyState.totalShares)}</span> Total Shares</div>
                    <div><span className="number">{this.props.companyState.holdingList.holdings.length}</span> Total Allocations</div>
                    <div><span className="number">{holderCount}</span> Total Shareholder{holderCount !== 1 && 's'}</div>
                    <div><span className="number">{classCount}</span> Share Class{classCount !== 1 && 'es'}</div>
                    </div>
                     <div className="col-sm-6">
                       <div className="hide-graph-labels">
                         { <PieChart
                          data={groupHoldings(this.props.companyState)}
                          width={120}
                          height={120}
                          innerRadius={0.0001}
                          outerRadius={60}
                          tooltipHtml={pieTooltip}
                          tooltipMode={'mouse'}
                          showInnerLabels={false}
                          showOuterLabels={false} />  }
                          </div>
                    </div>
                    <div className="col-xs-12">
                    { Object.keys(shareCountByClass).map((k, i) => {
                        return <div key={i} className="class-summary">
                            <div><span className="number">{numberWithCommas(shareCountByClass[k].amount)}</span> Shares of Class:<strong> {renderShareClass(k, shareClassMap)}</strong></div>
                                { largestHolders(shareCountByClass[k].shareClass, shareCountByClass[k].amount, this.props.companyState).map((h, i) => {
                                    return <div key={i} className="indent"><strong>{numberWithCommas(h.amount)} ({(h.amount/shareCountByClass[k].amount*100).toFixed(2) + '%'})</strong> Held by {renderHolders(h.holding)}</div>
                                }) }
                            </div>
                    }) }
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
        percentage: PropTypes.string.isRequired,
        shareClassMap: PropTypes.object.isRequired
    };
    render(){
        return  <dl className="dl-horizontal ">
                <dt>Name</dt>
                <dd>{ this.props.holding.name }</dd>
                <dt>Total Shares</dt>
                <dd>{numberWithCommas(this.props.total) + ' ' + this.props.percentage}</dd>
                <dt>Parcels</dt>
                { this.props.holding.parcels.map((p, i) =>
                    <dd key={i} >{numberWithCommas(p.amount)} of {renderShareClass(p.shareClass, this.props.shareClassMap) } Shares<br/></dd>) }
                <dt>Shareholders</dt>
                { this.props.holding.holders.map((holder, i) =>
                    <dd key={i} >{holder.person.name} {(holder.data||{}).votingShareholder && <strong>(Voting Shareholder)</strong>}<br/>
                    <span className="address">{holder.person.address}</span></dd>) }
            </dl>
    }
}


@pureRender
export class Holding extends React.Component {
    static propTypes = {
        holding: PropTypes.object.isRequired,
        total: PropTypes.number.isRequired,
        select: PropTypes.func,
        shareClassMap: PropTypes.object.isRequired
    };
    render(){
        const sum = this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0),
            percentage = (sum/this.props.total*100).toFixed(2) + '%';
        const classes = ["outline", "shareholding"]
        if(this.props.select){
            classes.push('actionable');
        }
        return <div className={classes.join(' ')} onClick={() => this.props.select && this.props.select(this.props.holding)}>

                <div className="info">
                    <HoldingDL holding={this.props.holding} total={sum} percentage={percentage} shareClassMap={this.props.shareClassMap} />
                </div>
                   <div className="hide-graph-labels pie-chart">
                  <PieChart
                          data={{values: [{y: sum, x: 'this'}, {y: this.props.total-sum, x: 'other'}]}}
                          innerRadius={0.001}
                          outerRadius={30}
                          width={60}
                          height={60} />
            </div>
        </div>
    }
}


@pureRender
export class Shareholdings extends React.Component {
    static propTypes = {
        companyState: PropTypes.object,
        companyId: PropTypes.string
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
    render() {
        const holdings = [...this.props.companyState.holdingList.holdings];
        const shareClassMap = generateShareClassMap(this.props.companyState)
        holdings.sort((a, b) => (a.name||'').localeCompare(b.name))
        return <div className="container">

        <div className="widget">
            <div className="widget-header">
                <div className="widget-title">
                    Shareholdings
                </div>
            </div>
            <div className="widget-body">
                <div className="row">
                    <div className="col-md-6">
                        { holdings.map((holding, i) =>
                            <Holding key={i} holding={holding}
                                total={this.props.companyState.totalShares}
                                shareClassMap={shareClassMap}
                                select={this.editHolding} />
                        )}
                    </div>
                    <div className="col-md-6 col-xs-12 text-center">

                    <AutoAffix viewportOffsetTop={15} container={this}>
                        <div className="hide-graph-labels pie-chart responsive affixed">
                           {<PieChart
                            data={groupHoldings(this.props.companyState)}
                              viewBox={'0 0 400 400'}
                              width={400}
                              height={400}
                              innerRadius={0.0001}
                              outerRadius={150}
                              tooltipHtml={pieTooltip}
                              tooltipMode={'mouse'}
                              showInnerLabels={false}
                              showOuterLabels={false} />  }
                        </div>
                    </AutoAffix>


                    </div>
                </div>
            </div>
        </div>
        </div>
    }
}



