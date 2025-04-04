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
    constructor(
        attributeName,
        attributeValue,
        targetAttribute,
        dataGroups,
        currentDepth,
        maximumDepth,
        minimalGroupSize
    ) {
        this.attributeName = attributeName;
        this.attributeValue = attributeValue;
        this.targetAttribute = targetAttribute;
        this.groups = dataGroups;
        this.depth = currentDepth;
        this.maximumDepth = maximumDepth;
        this.minimalGroupSize = minimalGroupSize;
        this.isTerminal = false;
        this.children = [];
        this.addChildren();
    }

    addChildren() {
        if (this.groups[0].length == 0 || this.groups[1].length == 0) {
            this.children[0] = new TerminalNode(
                Array.prototype.concat(...this.groups),
                this.attributeName
            );
            return;
        }

        if (this.depth >= this.maximumDepth) {
            for (let i = 0; i < this.groups.length; i++) {
                this.children[i] = new TerminalNode(this.groups[i], this.targetAttribute);
            }
            return;
        }

        for (let i = 0; i < this.groups.length; i++) {
            if (this.groups[i].length < this.minimalGroupSize) {
                this.children[i] = new TerminalNode(this.groups[i], this.targetAttribute);
                continue;
            }
            let split = new DataSplitter(this.groups[i], this.targetAttribute).findBestSplit();

            this.children[i] = new DecisionNode(
                split[0],
                split[1],
                this.targetAttribute,
                split[2],
                this.depth + 1,
                this.maximumDepth,
                this.minimalGroupSize
            );
        }
    }
}

class DataSplitter {
    constructor(trainingData, targetAttribute) {
        this.data = trainingData;
        this.targetAttribute = targetAttribute;

        this.attributes = Object.keys(trainingData[0]);
        this.attributes.splice(this.attributes.indexOf(this.targetAttribute, 1));

        this.classesDistribution = {};
        for (let i = 0; i < trainingData.length; i++) {
            if (!this.classesDistribution[trainingData[i][this.targetAttribute]]) {
                this.classesDistribution[trainingData[i][this.targetAttribute]] = 0;
            }
            this.classesDistribution[trainingData[i][this.targetAttribute]]++;
        }

        this.classes = Object.keys(this.classesDistribution);
    }

    calculateEntropyOnGroup(data) {
        let targetValues = {};
        for (let i = 0; i < data.length; i++) {
            if (!targetValues[data[i][this.targetAttribute]]) {
                targetValues[data[i][this.targetAttribute]] = 0;
            }
            targetValues[data[i][this.targetAttribute]]++;
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
        return [bestAttribute, bestValue, splitGroups, bestGiniIndex];
    }
}

class DecisionTree {
    constructor(trainingData, targetAttribute) {
        let split = new DataSplitter(trainingData, targetAttribute).findBestSplit();
        this.maximumDepth = 5;
        this.minimalGroupSize = 5;

        this.root = new DecisionNode(
            split[0],
            split[1],
            targetAttribute,
            split[2],
            1,
            this.maximumDepth,
            this.minimalGroupSize
        );
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
console.log(tree);
