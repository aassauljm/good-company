"use strict";

export function subsetSum(items, targetSum) {
    //exponential implementation, sucks.
    // trivial case
    for (let i = 0; i < items.length; i++) {
        if (items[i] === targetSum) {
            return {
                vals: [items[i]],
                sum: targetSum
            };
        }
    }

    let solutionIndexes = null,
        finished = false;

    const sum = (function subset(lastSum, indexList) {
        const indexListLength = indexList.length;
        let i, sum = lastSum;
        for (let i = 0; i < items.length && !finished; i++) {
            // break early
            if (sum === targetSum) {
                finished = true;
                break;
            }

            if (indexList.indexOf(i) === -1) {
                indexList[indexListLength] = i;
                sum = lastSum + items[i];
                if (sum === targetSum && indexList.length > 1) {
                    solutionIndexes = indexList.slice(0);
                    finished = true;
                    break;
                } else {
                    sum = subset(sum, indexList.slice(0));
                }
            }
        }
        return sum;
    })(0, [])


    if (!solutionIndexes) {
        throw Error('Could not find solution')
    }
    // Return the solution set
    return {
        vals: solutionIndexes.sort().map(i => items[i]),
        sum: targetSum
    }

}


// na, this sucks due to large targetSums
export function subsetSumMemoFail(items, targetSum) {
    // The value of subset[i][j] will be true if there is a subset of set[0..j-1]
    //  with sum equal to i
    console.log(items, targetSum)
    const subset = [[]], n = items.length;
    // trivial case
    for (let i = 0; i < items.length; i++) {
        subset[0][i] = true;
        if (items[i] === targetSum) {
            return {
                vals: [items[i]],
                sum: targetSum
            };
        }
    }

    // Fill the subset table in botton up manner
    for (let i = 1; i <= targetSum; i++) {
        for (let j = 1; j <= n; j++) {
            if(!subset[i]){
                subset[i] = [false];
            }
            subset[i][j] = subset[i][j - 1] ;
            if (i >= items[j - 1]){
                subset[i][j] = subset[i][j] || (subset[i - items[j - 1]]||[])[j - 1];
            }
        }
    }

    /* // uncomment this code to print table
     for (int i = 0; i <= sum; i++)
     {
       for (int j = 0; j <= n; j++)
          printf ("%4d", subset[i][j]);
       printf("\n");
     } */
    console.log(subset)
    if(!subset[targetSum][n]){
        throw Error('Could not find solution')
    }
    if(subset[targetSum][n]){
        subset[targetSum].map((v, i) => v ? i : null)
    }
}