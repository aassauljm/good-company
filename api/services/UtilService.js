"use strict";

export function subsetSum(items, targetSum){

    // trivial case
    for(let i = 0; i < items.length; i++){
        if(items[i] === targetSum){
            return { vals: [items[i]], sum: targetSum };
        }
    }

    let solutionIndexes = null, finished = false;

    const sum = (function subset(lastSum, indexList){
        const indexListLength = indexList.length;
        let index = 0,
            sum = lastSum;
        for(index = 0; index < items.length && !finished; index += 1){
            if(sum === targetSum){
                finished = true;
                break;
            }
            if(indexList.indexOf(index) === -1 ){
                indexList[indexListLength] = index;
                sum = lastSum + items[index];
                if(sum === targetSum && indexList.length > 1){
                    solutionIndexes = indexList.slice(0);
                    finished = true;
                    break;
                }
                else{
                    sum = subset(sum, indexList.slice(0));
                }
            }
        }
        return sum;
    })( 0, [])


    if(!solutionIndexes){
        throw Error('Could not find solution')
    }
    // Return the solution set
    return { vals: solutionIndexes.sort().map(i => items[i]), sum: targetSum }

}