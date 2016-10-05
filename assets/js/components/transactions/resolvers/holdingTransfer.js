"use strict";
import React, { PropTypes } from 'react';
//import { requestResource, updateResource, showModal, addNotification } from '../../actions';
//import { pureRender, stringToDate, stringToDateTime, renderShareClass, generateShareClassMap, formFieldProps, requireFields, joinAnd, numberWithCommas } from '../../utils';
import Button from 'react-bootstrap/lib/Button';
import Input from '../../forms/input';
import { Link } from 'react-router'
import STRINGS from '../../../strings'
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import { enums as TransactionTypes } from '../../../../../config/enums/transactions';


function holdingTranferSimple(context, submit, reset){
    const ignoredAction = {...context.actionSet.data, totalShares: null};
    ignoredAction.actions = ignoredAction.actions.filter(r => {
        return r.id !== context.action.id;
    });

    function doSubmit(pendingActions){
        if(ignoredAction.actions.length){
            pendingActions.push(ignoredAction)
        }
        return submit({
            pendingActions: pendingActions.map(p => ({id: context.action.id, data: p, previous_id: context.actionSet.previous_id}))
        });
    }



    function after(){
        const pendingActions = [{
            // REMOVE FIRST
            ...context.actionSet.data, totalShares: null, actions: [{
                    effectiveDate: context.action.effectiveDate,
                    holders: context.action.beforeHolders,
                    transactionType: TransactionTypes.REMOVE_ALLOCATION
                }]
            },{ // THE TRANSFER
                ...context.actionSet.data, totalShares: null, actions: [{
                    ...context.action,
                    transactionType: TransactionTypes.HOLDING_TRANSFER,
                    transactionMethod: null,
                    amount: null,
                    beforeAmount: context.action.afterAmount
                }]
            }, {
                // THEN THE AMEND
                ...context.actionSet.data, totalShares: null, actions: [{
                    ...context.action,
                    afterHolders: context.action.beforeHolders,
                }]
            }
        ];
        //THEN THE REST
        doSubmit(pendingActions);
    }

    function before(){
        const pendingActions = [{
                //  AMEND FIRST
                ...context.actionSet.data, totalShares: null, actions: [{
                    ...context.action,
                    beforeHolders: context.action.afterHolders,
                }]
            }, {
            // THEN THE REMOVE
            ...context.actionSet.data, totalShares: null, actions: [{
                    effectiveDate: context.action.effectiveDate,
                    holders: context.action.beforeHolders,
                    transactionType: TransactionTypes.REMOVE_ALLOCATION
                }]
            },{ // THE TRANSFER
                ...context.actionSet.data, totalShares: null, actions: [{
                    ...context.action,
                    transactionType: TransactionTypes.HOLDING_TRANSFER,
                    transactionMethod: null,
                    amount: null,
                    afterAmount: context.action.beforeAmount,
                }]
            },
        ];
        doSubmit(pendingActions);
    }

    return <div>
         <div className="row">
            <div className="col-md-12">
            <p className="instructions">What happened first?</p>
            </div>
         </div>
            <div className="button-row">
                <Button onClick={before} className="btn-primary">The shareholders changed</Button>
                <Button onClick={after} className="btn-primary">The number of shares changed</Button>
            </div>
    </div>
}


export default function HoldingTransfer(context, submit, reset){
    return holdingTranferSimple(context, submit, reset);
}