class TerminalNode {
    constructor(data, targetAttribute) {
        this.isTerminal = true;
        this.value = this.getMostFrequentTargetValue(data, targetAttribute);
    }

    getMostFrequentTargetValue(data, targetAttribute) {
        let targetValues = {};
        for (let i = 0; i < data.length; i++) {
            if (!targetValues[data[i][targetAttribute]]) {
                targetValues[data[i][targetAttribute]] = 0;
            }
            targetValues[data[i][targetAttribute]]++;
        }
        let keys = Object.keys(targetValues);
        let maxOccurances = 0;
        let index = 0;
        for (let i = 0; i < keys.length; i++) {
            if (targetValues[keys[i]] > maxOccurances) {
                maxOccurances = targetValues[keys[i]];
                index = i;
            }
        }
        return keys[index];
    }
}

class DecisionNode {
    constructor(attributeName, attributeValue, left, right) {
        this.attributeName = attributeName;
        this.attributeValue = attributeValue;
        this.left = left;
        this.right = right;
        this.isTerminal = false;
    }
}

class DecisionTree {
    constructor(trainingData, targetValue) {
        this.data = trainingData;
        this.targetValue = targetValue;

        this.attributes = Object.keys(trainingData[0]);
        this.attributes.splice(this.attributes.indexOf(this.targetValue, 1));

        this.classesDistribution = {};
        for (let i = 0; i < trainingData.length; i++) {
            if (!this.classesDistribution[trainingData[i][this.targetValue]]) {
                this.classesDistribution[trainingData[i][this.targetValue]] = 0;
            }
            this.classesDistribution[trainingData[i][this.targetValue]]++;
        }

        this.classes = Object.keys(this.classesDistribution);

        this.maximumDepth = 5;

        this.tree;
    }

    calculateEntropyOnGroup(data) {
        let targetValues = {};
        for (let i = 0; i < data.length; i++) {
            if (!targetValues[data[i][this.targetValue]]) {
                targetValues[data[i][this.targetValue]] = 0;
            }
            targetValues[data[i][this.targetValue]]++;
        }

        let entropy = 0;
        targetValues = Object.values(targetValues);
        for (let i = 0; i < targetValues.length; i++) {
            let proportion = targetValues[i] / data.length;
            entropy += proportion * proportion;
        }
        return entropy;
    }

    calculateGiniIndex(groups) {
        let giniIndex = 0;
        for (let i = 0; i < groups.length; i++) {
            let entropy = this.calculateEntropyOnGroup(groups[i]);
            giniIndex += (1.0 - entropy) * (groups[i].length / this.data.length);
        }
        return giniIndex;
    }

    splitIntoTwo(attribute, value) {
        let left = [];
        let right = [];
        for (let i = 0; i < this.data.length; i++) {
            if (typeof this.data[i][attribute] == 'string') {
                if (this.data[i][attribute] == value) {
                    left.push(this.data[i]);
                } else {
                    right.push(this.data[i]);
                }
                continue;
            }
            if (this.data[i][attribute] < value) {
                left.push(this.data[i]);
            } else {
                right.push(this.data[i]);
            }
        }
        return [left, right];
    }

    findBestSplit() {
        let bestAttribute;
        let bestValue;
        let bestGiniIndex = 1;
        let splitGroups;
        for (let attributeValue = 0; attributeValue < this.attributes.length; attributeValue++) {
            for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
                let groups = this.splitIntoTwo(
                    this.attributes[attributeValue],
                    this.data[rowIndex][this.attributes[attributeValue]]
                );
                let giniIndex = this.calculateGiniIndex(groups);

                if (giniIndex < bestGiniIndex) {
                    bestAttribute = this.attributes[attributeValue];
                    bestValue = this.data[rowIndex][this.attributes[attributeValue]];
                    bestGiniIndex = giniIndex;
                    splitGroups = groups;
                }
            }
        }
        return [bestAttribute, bestValue, bestGiniIndex, splitGroups];
    }
}

let dataExample = [
    {
        Age: 18,
        Occupation: 'Student',
        Income: 'Low',
        CreditHistory: 'None',
        LoanApproved: 'No',
    },
    {
        Age: 22,
        Occupation: 'Programmer',
        Income: 'Medium',
        CreditHistory: 'Good',
        LoanApproved: 'Yes',
    },
    {
        Age: 30,
        Occupation: 'Programmer',
        Income: 'High',
        CreditHistory: 'Good',
        LoanApproved: 'Yes',
    },
    {
        Age: 50,
        Occupation: 'Teacher',
        Income: 'Medium',
        CreditHistory: 'Bad',
        LoanApproved: 'No',
    },
    {
        Age: 65,
        Occupation: 'Pensioner',
        Income: 'Low',
        CreditHistory: 'Good',
        LoanApproved: 'No',
    },
];
console.log(dataExample);
let tree = new DecisionTree(dataExample, 'LoanApproved');
let dataKeys = Object.keys(dataExample[0]);
console.log(tree.findBestSplit());
