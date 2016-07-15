"use strict";

export function importCompany(companyNumber, options) {
    let data, company, state, processedDocs, companyName;
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
                    .then(function(_processedDocs) {
                        processedDocs = _processedDocs;
                        return company.getRootCompanyState();
                    })
                    .then(function(_state){
                        state = _state;
                        return Action.bulkCreate(processedDocs.map((p, i) => ({id: p.id, data: p, previous_id: (processedDocs[i+1] || {}).id})));
                    })
                    .then(function(pendingAction){
                        state.set('pending_historic_action_id', pendingAction[0].id);
                        return state.save();
                    })
                }
            })
    })
    .then(() => {
        return ActivityLog.create({
            type: ActivityLog.types.IMPORT_COMPANY,
            userId: options.userId,
            description: `Imported ${companyName} from Companies Office.`,
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
                ownerId: ownerId
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