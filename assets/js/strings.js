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

    entityType: 'Entity Type',
    companyStatus: 'Company Status',

    holdingName: 'Holding Name',
    appointment: 'Appointment Date',
    cessation: 'Cessation of Directorship Date',
    shareRegister: {
        shareClass: 'Class of Share',
        name: 'Name of Person',
        address: 'Address',
        current: 'Current Holder',
        holdingName: 'Allocation',
        limitations: 'Transfer Restrictions / Limitations',
        votingRights: 'Rights Attached to Shares',
        amount: 'Current No. of Shares Held',
        last_amount: 'Current No. of Shares Held',
        sumIncreases: 'Sum of all No. Increases',
        issueHistory: 'Date and No. of Shares Issued by Company',
        repurchaseHistory: 'Date and No. of Repurchase or Redemption',
        transferHistoryTo: 'Date of transfer of Shares to the Shareholder',
        transferHistoryFrom: 'Date of transfer of Shares from the Shareholder',
        hasNoTransferRestriction: "There are no restrictions or limitations on the transfer of shares",
        hasTransferRestriction: "There are restrictions or limitations on the transfer of shares"
    },
    bulkImport: {
        'listType': 'Identifier Type',
        'identifierListHelp': 'Each entry should on a separate line',
        'companyName': 'Full Company Name',
        'companyNumber': 'Company Number',
        'nzbn': 'NZBN'
    },
    transactionTypes: {
        _: 'Transaction Type',
        SEED: 'Import from Companies Office',
        INCORPORATION: 'Incorporation',
        ISSUE: 'Issue',
        ISSUE_UNALLOCATED: 'Issue',
        ISSUE_TO: 'Issue To',
        AMEND: 'Amend',
        COMPOUND: 'Compound Transaction',
        NEW_ALLOCATION: 'New Allocation',
        REMOVE_ALLOCATION: 'Remove Allocation',
        DETAILS: 'Details',
        NAME_CHANGE: 'Company Name Change',
        ADDRESS_CHANGE: 'Company Address Change',
        HOLDING_CHANGE: 'Amend Shareholding',
        HOLDER_CHANGE: 'Shareholder Change',
        TRANSFER: 'Transfer',
        TRANSFER_TO: 'Transfer To',
        TRANSFER_FROM: 'Transfer From',
        CONVERSION_TO: 'Conversion To',
        CONVERSION: 'Conversion/Subdivision',
        SUBDIVISION: 'Subdivison',
        SUBDIVISION_TO: 'Subdivison To',
        ACQUISITION: 'Acquisition',
        ANNUAL_RETURN: 'Annual Return',
        NEW_DIRECTOR: 'New Director',
        REMOVE_DIRECTOR: 'Remove Director',
        UPDATE_DIRECTOR: 'Update Director',
        PURCHASE: 'Purchase',
        PURCHASE_FROM: 'Purchase From',
        REDEMPTION: 'Redemption',
        REDEMPTION_FROM: 'Redemption From',
        ACQUISITION_FROM: 'Acquisition From',
        CONSOLIDATION: 'Consolidation',
        CONSOLIDATION_FROM: 'Consolidation From',
        APPLY_SHARE_CLASS: 'Apply Share Class',
        APPLY_SHARE_CLASSES: 'Apply Share Classes',
        CREATE_SHARE_CLASS: 'Create Share Class',
        COMPOUND_REMOVALS: 'Removals',
        HOLDING_TRANSFER: 'Transfer',
        UPLOAD_DOCUMENT: 'Upload Document',
        UPDATE_DOCUMENT: 'Update Document',
        CREATE_DIRECTORY: 'Create Directory',
    },
    amendTypes: {
        ISSUE_TO: 'Issue',
        CONVERSION_TO: 'Conversion/Subdivision',

        REDEMPTION_FORM: 'Redemption',
        ACQUISITION_FROM: 'Acquisition',
        CONSOLIDATION_FROM: 'Consolidation',
        PURCHASE_FROM: 'Purchase',

        TRANSFER_TO: 'Transfer',
        TRANSFER_FROM: 'Transfer',

    },
    transactionVerbs: {
        ISSUE_TO: 'Issue',
        TRANSFER_TO: 'Transfer',
        SUBDIVISION_TO: 'Subdivision',
        TRANSFER_FROM: 'Transfer',
        CONVERSION_TO: 'Conversion/Subdivision',
        ACQUISITION_TO: 'Acquisition',
        PURCHASE_FROM: 'Purchase',
        REDEMPTION_FROM: 'Redemption',
        ACQUISITION_FROM: 'Acquisition',
        CONSOLIDATION_FROM: 'Consolidation',
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
        limitations: 'Restrictions or limitations on transfer',
        rights: "Rights",
        "transferRestriction": "Restrictions on transfers",
        "transferRestrictionQuestion": "Are there restrictions or limitations on the transfer of shares?",
        "transferRestrictionDocument": "Location of document containing transfer restrictions",
        "transferRestrictionPlaceholder": "Type or select from the following",

        votingRights: {
            _: 'Rights Attached to Shares',
            votingRights: 'Rights Attached to Shares',
            "appointDirectorAuditor": "Appoint or remove a director or auditor",
            "adoptConstitution": "Adopt a constitution",
            "alterConstitution": "Alter a constitution",
            "approveMajorTransactions": "Approve a major transaction",
            "approveAmalgamation": "Approve an amalgation",
            "liquidation": "Put company into liquidation",
            "1(a)": "The right to 1 vote on a poll at a meeting of the company on any resolution",
            "1(b)": "The right to an equal share in dividends authorised by the board",
            "1(c)": "The right to an equal share in the distribution of the surplus assets of the company",
        }
    },
    calendar: {
        create: "Create Event",
        update: "Update Event",
        calendar: "Calendar",
        companyId: "Company",
        date: "Date",
        title: "Title",
        description: "Description",
        location: "Location",
        time: "Time",
        reminder: "Reminder",
        eventDeleted: 'Event Deleted',
        noEvents: "No scheduled events on this day",
        durations: {
            '-PT10M': '10 minutes',
            '-PT30M': '30 minutes',
            '-PT1H': '1 hour',
            '-P1D': '1 day',
            '-P1W': '1 week',
            '-P2W': '2 weeks',
            '-P30D': '30 days'
        }
    },
    deadlines: {
        annualReturn: "Annual Return",
    }
}