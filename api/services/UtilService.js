
//http://bl.ocks.org/jorpic/30a754884a7c908fea42

export function subsetSum(xs, goal) {
    /**
     * http://en.wikipedia.org/wiki/Subset_sum_problem#Pseudo-polynomial_time_dynamic_programming_solution
     */

    // This allows conveniet access to array of bits
    // with indices in the range [min, max].
    function BitSet(min, max, arr) {
        var size = max - min + 1;
        var data = arr || new Uint32Array(Math.ceil(size / 32));

        this.set = function(i) {
            i -= min;
            data[Math.floor(i / 32)] |= 1 << (i % 32);
        }

        this.isSet = function(i) {
            i -= min;
            return !!(data[Math.floor(i / 32)] & (1 << (i % 32)));
        }

        this.copy = function(i) {
            return new BitSet(min, max, Array.prototype.slice.apply(data));
        }
    }
    var min = Math.min.apply(null, xs);
    var newRow = new BitSet(min, goal);
    var pool = [newRow];
    var maxSum = 0;

    // Forward: compute partial sums
    // NB: early exit if exact solution found
    var i = 0;
    for (; i < xs.length && maxSum < goal; ++i) {
        var prevRow = newRow;
        var newRow = prevRow.copy();
        pool.push(newRow);
        var x = xs[i];
        if (x > goal) continue;
        newRow.set(x);
        for (var j = min; j <= goal - x; ++j) {
            if (prevRow.isSet(j)) {
                newRow.set(x + j);
                maxSum = Math.max(maxSum, x + j);
            }
        }
    }

    var solution = [];
    var partialSum = maxSum;

    // Backward: extract optimal subset from row pool
    for (i = i - 1; i >= 0 && partialSum > 0; --i) {
        var x = xs[i];
        var newPartialSum = partialSum - x;
        if (newPartialSum > 0 && pool[i].isSet(newPartialSum)) {
            solution.push(x);
            partialSum = newPartialSum;
        } else if (newPartialSum === 0) {
            solution.push(x);
        }
    }

    return {
        sum: maxSum,
        vals: solution
    }
}