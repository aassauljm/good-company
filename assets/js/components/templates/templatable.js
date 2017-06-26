import { stringDateToFormattedString, generateShareClassMap, renderShareClass } from '../../utils';
import { enums as TransactionTypes } from '../../../../config/enums/transactions';

function signatures(holders) {
    return {
        signingDate: {
            signingOnSameDay: "No",
        },
        signatories: holders.map(h => {
            return {
                name: h.name,
                signingMethod: {
                    signingMethod: "themself only",
                    capacity: {
                        capacityType: "No Capacity"
                    }
                }
            }
    })};
}

const  TEMPLATABLE = {
    [TransactionTypes.TRANSFER]: {
        url: 'transfer',
        format: (data, state) => {
            const shareClassMap = generateShareClassMap(state);
            let transferee = (data.subTransactions || data.actions).find(s => (s.type || s.transactionType) === TransactionTypes.TRANSFER_TO);
            let transferor = (data.subTransactions || data.actions).find(s => (s.type || s.transactionType) === TransactionTypes.TRANSFER_FROM);
            if(transferee.data){
                transferee = transferee.data;
            }
            if(transferor.data){
                transferor = transferor.data;
            }
            const result = {
                company: {
                    companyName: state.companyName,
                    companyNumber: state.companyNumber
                },
                transaction: {
                    parcels: transferee.parcels.map(p => ({amount: p.amount, shareClass: p.shareClass ? renderShareClass(p.shareClass, shareClassMap) : ''})),
                    effectiveDateString: stringDateToFormattedString(data.effectiveDate),
                    transferees: {
                        requiresSigning: "Yes",
                        persons: (transferee.holders || transferee.afterHolders || [])
                            .map(h => ({companyNumber: h.companyNumber || '', name: h.name, address: h.address})),
                        signing: signatures(transferee.holders || transferee.afterHolders || [])

                    },
                    transferors: {
                        persons: (transferor.holders || transferor.afterHolders || [])
                            .map(h => ({companyNumber: h.companyNumber || '', name: h.name, address: h.address})),

                        signing: signatures(transferor.holders || transferor.afterHolders || [])

                    }
                }
            }
            return result;
        }
    }
}


export default TEMPLATABLE;