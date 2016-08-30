"use strict";

export function importCompany(companyNumber, options) {
    let data, company, state, newRoot, processedDocs, companyName, pendingAction;
    return sequelize.transaction(function(t){
        return ScrapingService.fetch(companyNumber)
            .then(ScrapingService.parseNZCompaniesOffice)
            .tap(checkNameCollision.bind(null, options.userId))
            .then((_data) => {
                data = _data;
                companyName = data.companyName;
                return ScrapingService.populateDB(data, options.userId);
            })
            .then(function(_company) {
                company = _company;
                if(options.history !== false){
                    return ScrapingService.getDocumentSummaries(data)
                    .then((readDocuments) => ScrapingService.processDocuments(data, readDocuments))
                    .then((_processedDocs) => {
                        processedDocs = _processedDocs;
                        return company.getRootCompanyState();
                    })
                    .then(_state => {
                        state = _state;
                        return state.buildPrevious({transaction: null, transactionId: null}, {newRecords: true})
                    })
                    .then(function(_newRoot){
                        newRoot = _newRoot
                        return newRoot.save();
                    })
                    .then(function(){
                        return state.setPreviousCompanyState(newRoot);
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
                        state.set('original_historic_action_id', pendingAction[0].id);
                        return state.save();
                    })

                    .then(() => {
                        state.getHistoricActions()
                            .then(hA => {
                                hA.set({previous_id: pendingAction[0].id});
                                return hA.save();
                            })
                    })
                }
            })
    })
    .then(() => {
        return ActivityLog.create({
            type: ActivityLog.types.IMPORT_COMPANY,
            userId: options.userId,
            description: `Imported ${companyName} from Companies Office`,
            data: {companyId: company.id
            }
        });
    })
    .then(() => {
        return company;
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