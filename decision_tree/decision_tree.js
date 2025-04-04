class DecisionTree {
    constructor(trainingData, targetValue) {
        this.data = trainingData;
        this.targetValue = targetValue;

        this.attributes = Object.keys(trainingData[0]);
        this.attributes.splice(this.attributes.indexOf(this.targetValue, 1));
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

    calculateGiniIndex(attribute) {
        let attributeValues = {};
        for (let i = 0; i < this.data.length; i++) {
            if (!attributeValues[this.data[i][attribute]]) {
                attributeValues[this.data[i][attribute]] = [];
            }
            attributeValues[this.data[i][attribute]].push(this.data[i]);
        }
        let attributeKeys = Object.keys(attributeValues);
        attributeValues = Object.values(attributeValues);

        let gini = {};
        for (let i = 0; i < attributeValues.length; i++) {
            gini[attributeKeys[i]] =
                (attributeValues[i].length / this.data.length) *
                (1 - this.calculateEntropyOnGroup(attributeValues[i]));
        }
        return gini;
    }

    findBestSplit() {
        let attribute;
        let value;
        let giniIndex = 1;
        for (let i = 0; i < this.attributes.length; i++) {
            let indices = this.calculateGiniIndex(this.attributes[i]);
            let keys = Object.keys(indices);
            let values = Object.values(indices);
            for (let j = 0; j < keys.length; j++) {
                if (values[j] < giniIndex) {
                    attribute = this.attributes[i];
                    value = keys[j];
                    giniIndex = values[j];
                }
            }
        }
        console.log(attribute, value, giniIndex);
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
tree.findBestSplit();
