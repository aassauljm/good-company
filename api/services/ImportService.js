"use strict";
import Promise from 'bluebird';


export function importCompany(companyNumber, options) {
    let data, company, state, newRoot, processedDocs, companyName, pendingAction;
    return ScrapingService.fetch(companyNumber)
        .then(ScrapingService.parseNZCompaniesOffice)
        .tap(checkNameCollision.bind(null, options.userId))
        .tap(checkExtensive)
        .tap(checkEntityType)
        //.then(ScrapingService.fetchParentCompanyChanges)
        .then((_data) => {
            data = _data;
            companyName = data.companyName;
            return ScrapingService.getDocumentSummaries(data)
        })
        .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
        .then((_processedDocs) => {
            const now = new Date();
            processedDocs = _processedDocs.filter(d => !d.effectiveDate || d.effectiveDate <= now);
            const processedFutureDocs = _processedDocs.filter(d => d.effectiveDate && d.effectiveDate > now);
            return sequelize.transaction(function(){
                return ScrapingService.populateDB(data, options.userId)
                .then(function(_company) {
                    company = _company;
                    if(options.history === false){
                        return;
                    }
                    return company.getRootCompanyState()
                        .then(_state => {
                            state = _state;
                            return state.buildPrevious({transaction: null, transactionId: null}, {newRecords: true});
                        })
                        .then(function(_newRoot){
                            newRoot = _newRoot
                            return newRoot.save();
                        })
                        .then(function(){
                            return state.setPreviousCompanyState(newRoot);
                        })
                        .then(function(){
                            return SourceData.create({data: processedDocs});
                        })
                        .then(function(sourceData){
                            return company.setHistoricProcessedDocuments(sourceData);
                        })
                        .then(() => {
                            return Action.bulkCreate(processedDocs.map((p, i) => ({id: p.id, data: p, previous_id: (processedDocs[i+1] || {}).id})));
                        })
                        .then(function(_pendingAction){
                            pendingAction = _pendingAction;
                            newRoot.set('pending_historic_action_id', pendingAction[0].id);
                            return newRoot.save()
                        })
                        .then(() => {
                            if(processedFutureDocs.length){
                                processedFutureDocs.reverse();
                                return Action.bulkCreate(processedFutureDocs.map((p, i) => ({id: p.id, data: p, previous_id: (processedFutureDocs[i+1] || {}).id})))
                                .then(() => state.update({'pending_future_action_id': processedFutureDocs[0].id}))
                            }
                        })
                        .then(() => {
                            return state.getHistoricActions()
                                .then(hA => {
                                    hA.set({previous_id: pendingAction[0].id});
                                    return hA.save();
                                })
                        })
                    })
                })
                .catch(e => {
                    throw e;
                })
         })
        .then(() => {
            return ActivityLog.create({
                type: ActivityLog.types.IMPORT_COMPANY,
                userId: options.userId,
                companyId: company.id,
                description: `Imported ${companyName} from Companies Office`,
                data: {companyId: company.id
                }
            });
        })
        .then(() => {
            return company;
        })
        .catch(e => {
            sails.log.error(e);
            throw e;
        })
}


export function checkNameCollision(ownerId, data) {
    return Company.findAll({
            where: {
                ownerId: ownerId,
                deleted: false
            },
            include: [{
                model: CompanyState,
                as: 'currentCompanyState',
                where: {
                    companyName: data.companyName //and not deleted
                }
            }]
        })
        .then(function(results) {
            if (results.length) {
                throw new sails.config.exceptions.NameExistsException('A company with that name already exists');
            }
        })
};


export function checkExtensive(data) {
    if(data.holdings.extensive && !sails.config.IMPORT_EXTENSIVE) {
        throw new sails.config.exceptions.UnsupportedCompanyException(
            'Good Companies does not currently support companies with extensive shareholding.  We are developing this feature for release in 2017.');
    }
}


export function checkEntityType(data) {
    if(data.entityType === 'Overseas Non-ASIC Company') {
        throw new sails.config.exceptions.UnsupportedCompanyException(
            'Good Companies does not support Overseas Non-ASIC companies.');
    }
    if(data.entityType === 'Overseas ASIC Company') {
        throw new sails.config.exceptions.UnsupportedCompanyException(
            'Good Companies does not currently support Overseas ASIC companies.  We are developing this feature for release in 2017.');
    }
}


export function refetchDocuments(companyId) {
    let data;
    return Company.findById(companyId, {
                include: [{
                    model: SourceData,
                    as: 'sourceData'
                }]
            })
            .then(function(company) {
                data = company.sourceData.data;
                return ScrapingService.getDocumentSummaries(data);
            })
            .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
            .then((processedDocs) => {
                return SourceData.create({data: processedDocs});
            })
}
