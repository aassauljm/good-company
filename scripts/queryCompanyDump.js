const fs  = require('fs');

const input = process.cwd() + '/' + process.argv[2];


fs.readFile(input, function(err, file){
    const data =  JSON.parse(file)
    data.map(function(company){
        const companyNumber = company.companyNumber;
        company.holdings.allocations.map(function(a) {
            a.holders.map(function(h){
                if(h.companyNumber === companyNumber && a.holders.length > 1){
                    console.log(company.companyName)
                }
            })
        })
    })
})
