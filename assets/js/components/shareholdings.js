"use strict";
import React, {PropTypes} from 'react';
import { pureRender, numberWithCommas, generateShareClassMap, renderShareClass, joinAnd } from '../utils';
import { Link } from 'react-router';
import PieChart  from 'react-d3-components/lib/PieChart';
import Panel from './panel';
import STRINGS from '../strings';
import AutoAffix from 'react-overlays/lib/AutoAffix';
import d3 from 'd3';
import LawBrowserLink from './lawBrowserLink';
import LawBrowserContainer from './lawBrowserContainer'

const shareholdingLawLinks = () => <div>
        <LawBrowserLink title="Companies Act 1993" definition="28784-DLM320462/28784-DLM319977">Definition of shareholder</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 87(2)(a)">Shareholders entered in share register</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 97-100)">Liability of shareholders</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 104-106">Exercise of shareholder powers</LawBrowserLink>
        <LawBrowserLink title="Companies Act 1993" location="s 125">Ascertaining shareholders</LawBrowserLink>
    </div>

const colorScale = d3.scale.category20c();



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
    //const holding = this.data.values.filter(v => v.data.holdingId === x)[0].data;
    const holding = this.data.values[x].data;
    return <div className="graph-tooltip">{ renderHolders(holding) }</div>
}

function limitPrecision(num) {
    return Math.floor(num * 1000) / 1000;
}

function groupHoldings(companyState) {
    const total = companyState.totalAllocatedShares;

    return {values: companyState.holdingList.holdings.map((holding, i) => ({
        y: limitPrecision(holding.parcels.reduce((acc, p) => acc + p.amount, 0)/total * 100),
        //y: holding.parcels.reduce((acc, p) => acc + p.amount, 0),
        ///x: holding.holdingId,
        x: i,
        data: holding
    }))};
};



@pureRender
export class ShareholdingsWidget extends React.Component {

    static propTypes = {
        companyState: PropTypes.object.isRequired,
        companyId: PropTypes.string.isRequired,
        toggle: PropTypes.func,
        expanded: PropTypes.bool,
        baseUrl: PropTypes.string
    };

    countHolders() {
       return Object.keys(this.props.companyState.holders || {}).length;
    }

    render() {
        const holderCount = this.countHolders();
        const shareCountByClass = this.props.companyState.shareCountByClass;
        const shareClassMap = generateShareClassMap(this.props.companyState);;
        const classCount = Object.keys(shareCountByClass || {}).length

        let bodyClass = "widget-body ";
        if(this.props.toggle){
            bodyClass += "expandable "
        }
        if(this.props.expanded){
            bodyClass += "expanded ";
        }
        return <div className="widget shareholding-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <span className="fa fa-group"/> Shareholdings
                </div>
                <div className="widget-control">
                <Link to={`${this.props.baseUrl}/shareholdings`}>View All</Link>
                </div>
            </div>

            <div className={bodyClass} onClick={() => this.props.toggle && this.props.toggle(!this.props.expanded)}>
                <div className="row">
                    <div className="col-sm-6 summary">
                            <div className="col-xs-6 col-sm-12">
                                <div><span className="big-number number">{numberWithCommas(this.props.companyState.totalShares)}</span><span className="number-label">Total Shares</span></div>
                            </div>
                            <div className="col-xs-6 col-sm-12">
                                <div><span className="med-number number">{this.props.companyState.holdingList.holdings.length}</span><span className="number-label">Total Allocations</span></div>
                                <div><span className="med-number number">{holderCount}</span><span className="number-label">Total Shareholder{holderCount !== 1 && 's'}</span></div>
                                <div><span className="med-number number">{classCount}</span><span className="number-label">Share Class{classCount !== 1 && 'es'}</span></div>
                            </div>
                        </div>
                     <div className="col-sm-6">
                       <div className="hide-graph-labels pie-chart responsive">
                        <div className="pie-chart-limit">
                         { <PieChart
                                viewBox={'0 0 200 200'}
                                data={groupHoldings(this.props.companyState)}
                                width={200}
                                height={200}
                                innerRadius={0.000001}
                                outerRadius={100}
                                tooltipHtml={pieTooltip}
                                colorScale={colorScale}
                                sort={null}
                                tooltipMode={'mouse'}
                                showInnerLabels={false}
                                showOuterLabels={false} />  }
                          </div>
                          </div>
                    </div>
                    <div className="col-xs-12">
                    { Object.keys(shareCountByClass || {}).map((k, i) => {
                        return <div key={i} className="class-summary">
                            <div><strong>{numberWithCommas(shareCountByClass[k].amount)}</strong> Shares of Class:<strong> {renderShareClass(k, shareClassMap)}</strong></div>
                            <div className="largest-holdings">Largest Shareholdings:</div>
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
        total: PropTypes.number,
        percentage: PropTypes.string,
        shareClassMap: PropTypes.object.isRequired
    };
    render(){
        const className = this.props.vertical ? "dl ": "dl-horizontal "
        return  <dl className={className}>
                <dt>Name</dt>
                <dd>{ this.props.holding.name }</dd>
                <dt>Total Shares</dt>
                <dd><strong>{numberWithCommas(this.props.total)}</strong> { this.props.percentage && this.props.percentage }</dd>
                <dt>Parcels</dt>
                { this.props.holding.parcels.map((p, i) =>
                    <dd key={i} ><strong>{numberWithCommas(p.amount)}</strong> of {renderShareClass(p.shareClass, this.props.shareClassMap) } Shares<br/></dd>) }
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
        total: PropTypes.number,
        select: PropTypes.func,
        shareClassMap: PropTypes.object.isRequired
    };
    render(){
        const total = this.props.total || 0;
        const sum = this.props.holding.parcels.reduce((acc, p) => acc + p.amount, 0);
        const percentage = total ? (sum/this.props.total*100).toFixed(2) + '%' : null;
        const classes = ["outline", "shareholding"]
        if(this.props.select){
            classes.push('actionable');
        }
        return <div className={classes.join(' ')} onClick={() => this.props.select && this.props.select(this.props.holding)}>

                <div className="info">
                    <HoldingDL holding={this.props.holding} total={sum} percentage={percentage} shareClassMap={this.props.shareClassMap} vertical={true}/>
                </div>
                   <div className="hide-graph-labels pie-chart">
                  { !!total && <PieChart
                          data={{values: [{y: sum, x: 'this'}, {y: this.props.total-sum, x: 'other'}]}}
                          innerRadius={10}
                          outerRadius={30}
                          sort={null}
                          colorScale={colorScale}
                          width={60}
                          height={60} /> }
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
        this.props.destroyForm('holding');
        this.props.showTransactionView('updateHolding', {
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
        const shareClassMap = generateShareClassMap(this.props.companyState);

        holdings.sort((a, b) => (a.name||'').localeCompare(b.name));

        const holderCount =  Object.keys(this.props.companyState.holders || {}).length;
        const classCount = Object.keys(shareClassMap || {}).length;

        return <LawBrowserContainer lawLinks={shareholdingLawLinks()}>

        <div className="widget shareholding-widget">
            <div className="widget-header">
                <div className="widget-title">
                    Shareholdings
                </div>
            </div>
            <div className="widget-body">
                <div className="row summary big-summary">

                        <div className="col-sm-6">
                            <div><span className="big-number number">{numberWithCommas(this.props.companyState.totalShares)}</span><span className="number-label">Total Shares</span></div>
                        </div>

                        <div className="col-sm-6 minor hidden-xs">
                            <div><span className="med-number number">{this.props.companyState.holdingList.holdings.length}</span><span className="number-label">Total Allocations</span></div>
                            <div><span className="med-number number">{holderCount}</span><span className="number-label">Total Shareholder{holderCount !== 1 && 's'}</span></div>
                            <div><span className="med-number number">{classCount}</span><span className="number-label">Share Class{classCount !== 1 && 'es'}</span></div>
                        </div>

                        <div className="col-sm-6 visible-xs-block">
                            <div><span className="med-number number">{this.props.companyState.holdingList.holdings.length}</span><span className="number-label">Total Allocations</span></div>
                            <div><span className="med-number number">{holderCount}</span><span className="number-label">Total Shareholder{holderCount !== 1 && 's'}</span></div>
                            <div><span className="med-number number">{classCount}</span><span className="number-label">Share Class{classCount !== 1 && 'es'}</span></div>
                        </div>

                </div>

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
                              innerRadius={50}
                              outerRadius={150}
                              sort={null}
                              colorScale={colorScale}
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
        </LawBrowserContainer>
    }
}



