"use strict";
import React, { PropTypes } from 'react';
import { pureRender, stringDateToFormattedString, stringDateToFormattedStringTime, generateShareClassMap,
    renderShareClass, formFieldProps, requireFields, joinAnd, numberWithCommas, holdingOptionsFromState, getTotalShares } from '../../../utils';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Input from '../../forms/input';
import DateInput from '../../forms/dateInput';
import { ParcelWithRemove } from '../../forms/parcel';
import { HoldingSelectWithNew, HoldingWithRemove } from '../../forms/holding';
import STRINGS from '../../../strings'
import { asyncConnect } from 'redux-connect';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import TransactionView from '../../forms/transactionView';
import { enums as ImportErrorTypes } from '../../../../../config/enums/importErrors';
import { enums as TransactionTypes } from '../../../../../config/enums/transactions';
import { Holding } from '../../shareholdings';
import { reduxForm } from 'redux-form';
import Panel from '../../panel';
import { beforeAndAfterSummary, holdingChangeSummary, renderHolders, actionAmountDirection } from './summaries'
import moment from 'moment';
import Shuffle from 'react-shuffle';
import firstBy from 'thenby';
import { showContextualTransactionView } from '../../../actions';
import { validateAmend, formatInitialState, formatSubmit, collectAmendActions, collectShareChangeActions, isAmendable,
    signedAmount, isTransfer, isIncrease, keyObject, UNREPORTED_TRANSACTION, SHARE_CHANGE_TYPES } from '../../forms/amend';


const INCREASE_OPTIONS = [
        <option key={1} value={TransactionTypes.ISSUE_TO}>{STRINGS.transactionVerbs[TransactionTypes.ISSUE_TO]}</option>,
        <option key={0} value={TransactionTypes.TRANSFER_TO}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_TO]}</option>,
        <option key={3} value={TransactionTypes.CONVERSION_TO}>{STRINGS.transactionVerbs[TransactionTypes.CONVERSION_TO]}</option>
    ];

const DECREASE_OPTIONS = [
        <option key={0} value={TransactionTypes.TRANSFER_FROM}>{STRINGS.transactionVerbs[TransactionTypes.TRANSFER_FROM]}</option>,
        <option key={2} value={TransactionTypes.REDEMPTION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.REDEMPTION_FROM]}</option>,
        <option key={3} value={TransactionTypes.ACQUISITION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.ACQUISITION_FROM]}</option>,
        <option key={4} value={TransactionTypes.CONSOLIDATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CONSOLIDATION_FROM]}</option>,

        <option key={5} value={TransactionTypes.CANCELLATION_FROM}>{STRINGS.transactionVerbs[TransactionTypes.CANCELLATION_FROM]}</option>,
        <option key={6} value={TransactionTypes.PURCHASE_FROM}>{STRINGS.transactionVerbs[TransactionTypes.PURCHASE_FROM]}</option>
];



 //etc

const TRANSACTION_MAPPING = {
    [TransactionTypes.ISSUE]: TransactionTypes.ISSUE_TO,
    [TransactionTypes.CONVERSION]: TransactionTypes.CONVERSION_TO,
    [TransactionTypes.SUBDIVISION]: TransactionTypes.SUBDIVISION_TO,
    [TransactionTypes.REDEMPTION]: TransactionTypes.REDEMPTION_FROM,
    [TransactionTypes.ACQUISITION]: TransactionTypes.ACQUISITION_FROM,
    [TransactionTypes.CONSOLIDATION]: TransactionTypes.CONSOLIDATION_FROM,
    [TransactionTypes.CANCELLATION]: TransactionTypes.CANCELLATION_FROM,
    [TransactionTypes.PURCHASE]: TransactionTypes.PURCHASE_FROM
}


const renderOption = (h, i) => {
    return h.remaining ?
        <option key={i} value={h.value}>{h.label} - {numberWithCommas(Math.abs(h.remaining))} {h.remaining < 0 ? 'over allocated' : 'under allocated'}</option> :
        <option key={i} value={h.value}>{h.label} - shares balanced</option>
}



@formFieldProps()
class AmendSubAction extends React.Component {

    renderTransfer(disabled) {
        const holdings = this.props.holdings;
        const decreases = holdings.filter(h => !h.increase).map(renderOption);
        const increases = holdings.filter(h => h.increase).map(renderOption);

        return <div className="input-row">
                        <Input type="select" {...this.formFieldProps('holding')}
                            disabled={disabled}
                            label={this.props.type.value === TransactionTypes.TRANSFER_TO ? 'Transfer From' : 'Transfer To'}>
                            <option value="" disabled></option>
                            {  this.props.increase && decreases.length && <optgroup label="Suggested">{ decreases }</optgroup> }
                            {  this.props.increase && increases.length &&<optgroup label="Other">{ increases } </optgroup> }
                            {  !this.props.increase && increases.length && <optgroup label="Suggested">{ increases } </optgroup> }
                            {  !this.props.increase && decreases.length && <optgroup label="Other">{ decreases } </optgroup> }
                        </Input>
                </div>
    }

    renderExternalTarget(disabled){
        return <div className="input-row">
                <Input type="select" {...this.formFieldProps('targetActionSet')}
                    disabled={disabled}
                    label={`${STRINGS.amendTypes[this.props.type.value]} Transaction`}>
                    <option value=""></option>
                    { this.props.externalActionSets[this.props.type.value] || [] }
                </Input>
        </div>
    }

    render(){
        const title =  `Transaction #${this.props.index+1}`;
        const options = this.props.increase ? INCREASE_OPTIONS : DECREASE_OPTIONS;
        const disabled = !!this.props.isInverse.value || this.props.allDisabled;
        const dateDisabled = !!this.props.type.value && !isTransfer(this.props.type.value) && !!this.props.targetActionSet.value && this.props.targetActionSet.value !== UNREPORTED_TRANSACTION;
        const showExternal = !!this.props.type.value && !isTransfer(this.props.type.value)
        return  <Panel title={title}>
                { this.props.isInverse.value && <p>Calculated from paired Transfer</p>}

                <DateInput {...this.formFieldProps('effectiveDate')} disabled={disabled || dateDisabled} time={true}/>
                <div className="input-row">
                    <Input type="select" {...this.formFieldProps('type')}
                    disabled={disabled}
                    label={false}>
                        <option value="" disabled></option>
                            {  this.props.increase && <optgroup label="Increases">{ INCREASE_OPTIONS }</optgroup> }
                            {  this.props.increase && <optgroup label="Decreases">{ DECREASE_OPTIONS } </optgroup> }
                            {  !this.props.increase &&<optgroup label="Decreases">{ DECREASE_OPTIONS } </optgroup> }
                            {  !this.props.increase && <optgroup label="Increases">{ INCREASE_OPTIONS }</optgroup> }
                    </Input>

                </div>
                <div className="row">{ this.props.parcels.map((p, i) =>{
                    const remove = this.props.parcels.length > 1 && (() => this.props.parcels.removeField(i));
                    const add = this.props.parcels.length < this.props.shareOptions.length && (() => this.props.parcels.addField({}));
                    return <ParcelWithRemove key={i} {...p} shareOptions={this.props.shareOptions} add={add} remove={remove} forceShareClass={true} allDisabled={this.props.allDisabled}/>
                }) }</div>

                { isTransfer(this.props.type.value) && this.renderTransfer(disabled) }

                { showExternal && this.renderExternalTarget(disabled) }
                { showExternal && this.props.targetActionSet.value === UNREPORTED_TRANSACTION && <div className="input-row"><div className="alert alert-warning">
                    Warning: This will change the total number of shares in a way that might not match the records on the companies register.
                    </div></div> }

        </Panel>
    }
}

@formFieldProps()
class ShareChangeSubAction extends React.Component {
    render(){
        const title =  `Transaction #${this.props.index+1}`;
        const disabled = !!this.props.isInverse.value || this.props.allDisabled;
        return  <Panel title={title}>
                <DateInput {...this.formFieldProps('effectiveDate')} disabled={disabled} time={true}/>
                <div className="row">{ this.props.parcels.map((p, i) =>{
                    const remove = this.props.parcels.length > 1 && (() => this.props.parcels.removeField(i));
                    const add = this.props.parcels.length < this.props.shareOptions.length && (() => this.props.parcels.addField({}));
                    return <ParcelWithRemove key={i} {...p} shareOptions={this.props.shareOptions} add={add} remove={remove} forceShareClass={true} allDisabled={this.props.allDisabled}/>
                }) }</div>

        </Panel>
    }
}


const SubAction = (props) => {
    if(SHARE_CHANGE_TYPES.indexOf(props.type.value) > -1){
        return <ShareChangeSubAction {...props} />
    }
    return <AmendSubAction {...props} />
}


function SubActions(props){
    const multipleTransactions = isAmendable(props.data.value);
    return <div className="">
            <Shuffle>
                { props.subActions.map((r, i) => {
                    const show = !r.isInverse.value;
                    if(!show){
                        const parcels = r.parcels.map(p => `${p.amount.value} ${renderShareClass(p.shareClass.value, props.shareClassMap)}`).join(', ');
                        const title = `Transfer of ${parcels} ${isIncrease(r.type.value) ?  'from' : 'to' } ${(props.holdings.find(h => h.value === r.holding.value) || {}).label}`;
                        return <div className="list-item" key={r._keyIndex.value}>
                            <Panel title={title} />
                        </div>
                    }
                    return <div className="list-item panel-external-controls" key={r._keyIndex.value}>
                            <SubAction {...r}
                            index={i}
                            increase={props.increase}
                            allSameDirection={props.allSameDirection}
                            holdings={props.holdings}
                            remove={() => props.subActions.removeField(i)}
                            shareOptions={ props.shareOptions }
                            allDisabled={props.allDisabled}
                            externalActionSets={props.externalActionSets}
                            />
                            {  multipleTransactions &&!r.isInverse.value &&  <div className="btn-group-vertical btn-group-sm list-controls">
                                { i > 0  && <button type="button" className="btn btn-default" onClick={() => props.subActions.swapFields(i, i - 1) } disabled={props.allDisabled}><Glyphicon glyph="arrow-up" /></button> }
                                <button type="button" className="btn btn-default"onClick={() => props.subActions.removeField(i) } disabled={props.allDisabled}><Glyphicon glyph="remove" /></button>
                                { i < props.subActions.length - 1  && <button type="button" className="btn btn-default" onClick={() => props.subActions.swapFields(i, i + 1) } disabled={props.allDisabled}><Glyphicon glyph="arrow-down" /></button> }
                            </div> }
                    </div>
                }) }
            </Shuffle>

          { props.error && props.error.map((e, i) => <div key={i} className="alert alert-danger">{ e }</div>)}

            { multipleTransactions && <div className="button-row">
                <Button type="button" disabled={props.allDisabled} onClick={() => {
                    const remaining = props.data.value.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0) - props.subActions.reduce((sum, r) => {
                        return sum + signedAmount(r.type.value, r.parcels.reduce((sum, p) => sum + p.amount.value, 0))
                    }, 0);
                    props.subActions.addField({
                        _keyIndex: keyObject.keyIndex++, effectiveDate: props.effectiveDate, userCreated: true,
                        parcels:[{shareClass: props.defaultShareClass, amount: Math.abs(remaining)}]
                    })    // pushes empty child field onto the end of the array
                }}>
                Add Transaction
                </Button>
             </div> }
    </div>
}

const ActionSummary = (props) => {
    if(SHARE_CHANGE_TYPES.indexOf(props.action.transactionType) > -1){
        return <ShareChangeActionSummary {...props} />
    }
    return <AmendActionSummary {...props} />
}


const AmendActionSummary = (props) => {
    return <div className="amend-summary panel panel-default">
        <div className="panel-heading">
        <div className="parcels">{ props.action.parcels.map((p, i) => {
            const direction = actionAmountDirection(props.action)
            const diffClassName = direction ? 'diff increase number': 'diff decrease number';
            return <div key={i} className="parcel-row">
                <span className="number">{ numberWithCommas(p.afterAmount) }</span>
                <span className={diffClassName}>{ numberWithCommas(p.amount) }</span>
                <span className="share-class">{ renderShareClass(p.shareClass, props.shareClassMap) } Shares</span>
            </div>
        })}
        </div>
        <div className="original-date"><label>Original Date</label> { stringDateToFormattedStringTime(props.action.effectiveDate) }</div>
        <div className="holders">{ (props.action.afterHolders || props.action.holders).map(renderHolders) }</div>
    </div>
    { props.allDisabled && <div className="disabled-overlay"><span className="fa fa-times"/></div>}
    </div>
}

const ShareChangeActionSummary = (props) => {
    return <div className="amend-summary panel panel-default">
        <div className="panel-heading">
        <div className="parcels">{ props.action.parcels.map((p, i) => {
            const direction = actionAmountDirection(props.action)
            const diffClassName = direction ? 'diff increase number': 'diff decrease number';
            return <div key={i} className="parcel-row">
                <span className="number">{ numberWithCommas(p.afterAmount) }</span>
                <span className={diffClassName}>{ numberWithCommas(p.amount) }</span>
                <span className="share-class">{ renderShareClass(p.shareClass, props.shareClassMap) } Shares</span>
            </div>
        })}
        </div>
        <div className="original-date"><label>Original Date</label> { stringDateToFormattedStringTime(props.action.effectiveDate) }</div>
        <div className="share-change">{ STRINGS.transactionTypes[props.action.transactionType] }</div>
    </div>
    { props.allDisabled && <div className="disabled-overlay"><span className="fa fa-times"/></div>}
    </div>
}




class AmendOptions extends React.Component {
    renderTransfer(action, actions) {
        const holders = actions.map(a => {
            return a.afterHolders || a.holders;
        })
        return <div className="row">

        </div>
    }

    renderAfterParcels(field) {
        const parcels = field.afterParcels;
        return this.props.shareOptions.length > 1 &&
                <Panel title="Share counts after all transactions">
                    { parcels.map((p, i) =>{
                        const remove = parcels.length > 1 && (() => parcels.removeField(i));
                        const add = parcels.length < this.props.shareOptions.length && (() => parcels.addField({}));
                        return <ParcelWithRemove key={i} {...p} shareOptions={this.props.shareOptions} add={add} remove={remove} forceShareClass={true}/>
                    }) }
                </Panel>
    }

    render() {
        const { shareClassMap, fields: { actions } } = this.props;
        const amountRemaining = (holding, i) => {
            const remaining = holding.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0) - this.props.values.actions[i].subActions.reduce((sum, a) => {
                return sum + (a.type ? signedAmount(a.type, a.parcels.reduce((sum, p) => sum + (parseInt(p.amount, 10) || 0), 0)) : 0)
            }, 0);
            return {...holding, remaining: remaining}
        }
        const getError = (index) => {
            return this.props.error && this.props.error.actions && this.props.error.actions[index];
        }
        const holdings = this.props.values.actions.filter(a => isAmendable(a.data)).map((r, i) => {
            const a = r.data;
            const increase = actionAmountDirection(a);
            const names = joinAnd(a.holders || a.afterHolders, {prop: 'name'});
            return {value: r.data.id, label: `#${i+1} - ${names}`, increase: increase, parcels: a.parcels};
        });


        return <form onSubmit={this.props.handleSubmit}>
            <div className="button-row">
            <Button onClick={this.props.cancel} bsStyle="default">Cancel</Button>
                <Button  onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
            <hr/>
            { actions.map((field, i) => {
                const action = field.data.value;
                const increase = actionAmountDirection(action);
                let className = "row ";
                const allDisabled = !!field.userSkip.value;
                if(allDisabled){
                    className += 'disabled ';
                }
                return <div  key={i} >
                    <div className={className}>
                        <div className="col-md-6">
                            <ActionSummary action={action} shareClassMap={this.props.shareClassMap} companyState={this.props.companyState } allDisabled={allDisabled}/>
                            { this.renderAfterParcels(field) }
                              <div className="button-row">
                                    { !field.userSkip.value && <Button bsStyle="danger" onClick={() => field.userSkip.onChange(!field.userSkip.value) && field.userSkip.onBlur() }>Ignore Transaction</Button> }
                                    { field.userSkip.value && <Button bsStyle="info" onClick={() => field.userSkip.onChange(!field.userSkip.value)  && field.userSkip.onBlur() }>Reinstate Transaction</Button> }
                              </div>

                        </div>
                        <div className="col-md-6">

                            { !allDisabled && <SubActions
                                allDisabled={allDisabled}
                                effectiveDate={this.props.effectiveDate}
                                subActions={actions[i].subActions}
                                data={actions[i].data}
                                increase={increase}
                                error={getError(i)}
                                shareClassMap={shareClassMap}
                                shareOptions={this.props.shareOptions}
                                defaultShareClass={this.props.defaultShareClass}
                                externalActionSets={this.props.externalActionSets}
                                holdings={holdings.map(amountRemaining).filter(h => h.value !== this.props.values.actions[i].data.id)} /> }
                             { allDisabled && <div className="alert alert-warning">
                                Ignoring this transaction may result in subsequent mismatches with the Companies Register documents.
                             </div> }
                        </div>
                    </div>
                    <hr/>
                </div>
            }) }

            <div className="button-row">
                <Button bsStyle="info" onClick={() => {
                    this.props.destroyReduxForm('selectCreateHoldingChange');
                    this.props.show('selectCreateHoldingChange', {
                        ...this.props.transactionViewData,
                         formName: 'amend',
                         field: `actions[${actions.length}].data`,
                         noEffectiveDate: true,
                         afterClose: { // open this transactionView again
                             showTransactionView: {key: this.props.viewName, data: {...this.props.transactionViewData}}
                         }
                     })}}>Add Shareholding</Button>
            </div>
             <div className="button-row">
             <Button onClick={this.props.cancel} bsStyle="default">Cancel</Button>
             <Button onClick={this.props.resetForm}>Reset</Button>
                <Button type="submit" bsStyle="primary" disabled={!this.props.valid }>Submit</Button>
            </div>
        </form>
    }
}


const amendFields = [
    'actions[].subActions[].type',
    'actions[].subActions[].parcels[].amount',
    'actions[].subActions[].parcels[].shareClass',
    'actions[].subActions[].parcels[].beforeAmount',
    'actions[].subActions[].parcels[].afterAmount',
    'actions[].subActions[].effectiveDate',
    'actions[].subActions[].holding',
    'actions[].subActions[].isInverse',
    'actions[].subActions[].userCreated',
    'actions[].subActions[]._keyIndex',
    'actions[].subActions[].targetActionSet',
    'actions[].afterParcels[].amount',
    'actions[].afterParcels[].shareClass',
    'actions[].effectiveDate',
    'actions[].userSkip',
    'actions[].data',
];

const AmendOptionsConnected = reduxForm({
    fields: amendFields,
    form: 'amend',
    validate: validateAmend,
    destroyOnUnmount: false
})(AmendOptions);


function generateExternalActionSetOptions(actionSets = []){
    const grouped = {};
    actionSets.map((set, i) => {
        set.data.actions.map((action, j) => {
            if(SHARE_CHANGE_TYPES.indexOf(action.transactionType) >= 0){
                const mappedType = TRANSACTION_MAPPING[action.transactionType]
                grouped[mappedType] = grouped[mappedType] || [];
                grouped[mappedType].push(
                    <option value={set.id} key={`${i}-${j}`}>
                        { stringDateToFormattedString(set.data.effectiveDate)} - { `${STRINGS.transactionTypes[action.transactionType]} of ${ action.parcels.map(p => `${numberWithCommas(p.amount)} shares`).join(', ') }` }
                    </option>);
            }
        });
    })
    SHARE_CHANGE_TYPES.map((type) => {
        const mappedType = TRANSACTION_MAPPING[type];
        grouped[mappedType] = grouped[mappedType] || [];

        grouped[mappedType].push(
            <option value={UNREPORTED_TRANSACTION} key={type}>
               { STRINGS.amend[UNREPORTED_TRANSACTION]}
            </option>);
    });
    return grouped;
}


export default function Amend(props){
    const { context, submit } = props;
    const { actionSet, companyState, pendingActions } = context;
    const amends = collectAmendActions(actionSet.data.actions);
    // sort by largest first
    amends.sort(firstBy(a => a.parcels.reduce((sum, p) => sum + p.amount, 0), -1));
    const amendActions = actionSet ? collectShareChangeActions(actionSet.data.actions).concat(amends) : [];

    const totalAmount = actionSet ? actionSet.data.totalAmount : 0;
    const effectiveDate = actionSet ? moment(actionSet.data.effectiveDate).toDate() : null;
    const shareClassMap = generateShareClassMap(companyState);
    const shareClasses = ((companyState.shareClasses || {}).shareClasses || []);
    const shareOptions = shareClasses.map((s, i) => {
        return <option key={i} value={s.id}>{s.name}</option>
    });
    const externalActionSets = generateExternalActionSetOptions(pendingActions);
    const defaultShareClass = shareClasses.length ? shareClasses[0].id : null;

    const handleSubmit = (values) => {
        submit(formatSubmit(values, actionSet, pendingActions))
    }

    return <div className="resolve">
            <AmendOptionsConnected
            effectiveDate={effectiveDate}
            totalAmount={totalAmount}
            shareClassMap={shareClassMap}
            shareOptions={shareOptions}
            externalActionSets={externalActionSets}
            defaultShareClass={defaultShareClass}
            onSubmit={handleSubmit}
            cancel={props.cancel}
            initialValues={formatInitialState(amendActions, actionSet.data.effectiveDate, defaultShareClass, props.resolving ? companyState : {}, actionSet.id)}
            show={props.show}
            transactionViewData={props.transactionViewData}
            viewName={props.viewName}
            destroyReduxForm={props.destroyForm}
            />
        </div>
}



