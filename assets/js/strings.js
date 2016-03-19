export default {
    id: '#',
    companyName: 'Company Name',
    nzbn: 'NZBN',
    companyNumber: 'Company Number',
    addressForService: 'Address for Service',
    registeredCompanyAddress: 'Registered Company Address',
    incorporationDate: 'Incorporation Date',
    name: 'Full Name',
    address: 'Address',
    parcel: 'Parcel',
    amount: 'Amount',
    shareClass: 'Class',
    defaultShareClass: 'Ordinary',
    effectiveDate: 'Effective Date',
    holding: 'Shareholding',
    arFilingMonth: 'AR Filing Month',
    fraReportingMonth: 'FRA Reporting Month',
    holdingName: 'Holding Name',
    appointment: 'Appointment Date',
    cessation: 'Cessation of Directorship Date',
    shareRegister: {
        shareClass: 'Class of Share',
        name: 'Name of Person',
        address: 'Address',
        current: 'Current Holder',
        holdingName: 'Allocation',
        limitations: 'Restrictions / Limitations',
        votingRights: 'Voting Rights',
        amount: 'Current No. of Shares Held',
        sum: 'Sum of all No. Increases',
        issueHistory: 'Date and No. of Shares Issued by Company',
        repurchaseHistory: 'Date and No. of Repurchase or Redemption',
        transferHistoryTo: 'Date of transfer of Shares to the Shareholder',
        transferHistoryFrom: 'Date of transfer of Shares from the Shareholder'
    },
    transactionTypes: {
        SEED: 'Seed from Companies Office',
        INCORPORATION: 'Incorporation',
        ISSUE: 'Issue',
        ISSUE_UNALLOCATED: 'Issue',
        ISSUE_TO: 'Issue to',
        AMEND: 'Amend',
        COMPOUND: 'Compound Transaction',
        NEW_ALLOCATION: 'New Allocation',
        REMOVE_ALLOCATION: 'Remove Allocation',
        DETAILS: 'Details',
        NAME_CHANGE: 'Company Name Change',
        ADDRESS_CHANGE: 'Company Address Change',
        HOLDING_CHANGE: 'Shareholding Detail Change',
        HOLDER_CHANGE: 'Shareholder Change',
        TRANSFER: 'Transfer',
        TRANSFER_TO: 'Transfer To',
        TRANSFER_FROM: 'Transfer From',
        CONVERSION: 'Conversion',
        ACQUISITION: 'Acquisition',
        ANNUAL_RETURN: 'Annual Return',
        NEW_DIRECTOR: 'New Director',
        REMOVE_DIRECTOR: 'Remove Director',
        UPDATE_DIRECTOR: 'Update Director',
        PURCHASE: 'Purchase',
        PURCHASE_FROM: 'Purchase From',
        REDEMPTION: 'Redemption',
        REDEMPTION_FROM: 'Redemption From'
    },
    transfer: {
        from: 'Source Holding',
        to: 'Destination Holding',
    },
    interestsRegister: {
        date: 'Date',
        persons: 'Persons',
        details: 'Details',
        documents: 'Documents'
    },
    companyDocuments: {
        id: 'ID',
        filename: 'File Name',
        type: 'Type',
        date: 'Date',
        createdAt: 'Date Imported'
    },
    shareClasses: {
        name: 'Share Class',
        documents: 'Documents',
        limitations: 'Restrictions/Limitations',
        votingRights: {
            _: 'Voting Rights',
            "appointDirectorAuditor": "Appoint or remove a director or auditor",
            "adoptConstitution": "Adopt a constitution",
            "alterConstitution": "Alter a constitution",
            "approveMajorTransactions": "Approve a major transaction",
            "approveAmalgamation": "Approve an amalgation",
            "liquidation": "Put company into liquidation"
        }
    }
}