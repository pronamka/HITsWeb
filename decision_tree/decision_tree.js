function getMostFrequentTargetValue(data, targetAttribute) {
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

class TerminalNode {
    constructor(nodeId, data, targetAttribute, currentDepth = 5) {
        this.nodeId = nodeId;
        if (nodeId == 32) {
            console.log(data, targetAttribute);
        }
        this.isTerminal = true;
        this.value = getMostFrequentTargetValue(data, targetAttribute);
        this.depth = currentDepth;
    }
}

class DecisionNode {
    constructor(
        nodeId,
        attributeName,
        attributeValue,
        targetAttribute,
        dataGroups,
        currentDepth,
        maximumDepth,
        minimalGroupSize
    ) {
        this.nodeId = nodeId;
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
                this.nodeId * 2,
                Array.prototype.concat(...this.groups),
                this.targetAttribute,
                this.depth + 1
            );
            return;
        }

        if (this.depth >= this.maximumDepth) {
            let groupTargetValues = [];
            for (let i = 0; i < this.groups.length; i++) {
                groupTargetValues[i] = getMostFrequentTargetValue(
                    this.groups[i],
                    this.targetAttribute
                );
            }
            if (groupTargetValues[0] == groupTargetValues[1]) {
                this.children[0] = new TerminalNode(
                    this.nodeId * 2,
                    Array.prototype.concat(...this.groups),
                    this.targetAttribute,
                    this.depth + 1
                );
                return;
            }
            for (let i = 0; i < this.groups.length; i++) {
                this.children[i] = new TerminalNode(
                    this.nodeId * 2 + i,
                    this.groups[i],
                    this.targetAttribute,
                    this.depth + 1
                );
            }
            return;
        }

        for (let i = 0; i < this.groups.length; i++) {
            if (this.groups[i].length < this.minimalGroupSize) {
                this.children[i] = new TerminalNode(
                    this.nodeId * 2 + i,
                    this.groups[i],
                    this.targetAttribute,
                    this.depth + 1
                );
                continue;
            }
            let split = new DataSplitter(this.groups[i], this.targetAttribute).findBestSplit();

            this.children[i] = new DecisionNode(
                this.nodeId * 2 + i,
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
        this.attributes.splice(this.attributes.indexOf(this.targetAttribute), 1);

        this.bannedAttributes = ['id', 'name'];
        this.attributes = this.attributes.filter((attr) => !this.bannedAttributes.includes(attr));

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
        for (let attributeIndex = 0; attributeIndex < this.attributes.length; attributeIndex++) {
            let attribute = this.attributes[attributeIndex];
            let sampleValue = this.data[0][attribute];
            let isNumeric = typeof sampleValue === 'number';

            let uniqueValues = new Set(this.data.map((row) => row[attribute]));

            // Если это строка с подозрительно большим количеством уникальных значений — пропускаем
            if (!isNumeric && uniqueValues.size > this.data.length * 0.5) {
                continue;
            }

            for (let rowIndex = 0; rowIndex < this.data.length; rowIndex++) {
                let groups = this.splitIntoTwo(
                    this.attributes[attributeIndex],
                    this.data[rowIndex][this.attributes[attributeIndex]]
                );
                let giniIndex = this.calculateGiniIndex(groups);

                if (giniIndex < bestGiniIndex) {
                    bestAttribute = this.attributes[attributeIndex];
                    bestValue = this.data[rowIndex][this.attributes[attributeIndex]];
                    bestGiniIndex = giniIndex;
                    splitGroups = groups;
                }
            }
        }
        return [bestAttribute, bestValue, splitGroups, bestGiniIndex];
    }
}

export class DecisionTree {
    constructor(trainingData, targetAttribute, maxDepth = 5, minGroupSize = 5) {
        let split = new DataSplitter(trainingData, targetAttribute).findBestSplit();
        this.maximumDepth = maxDepth;
        this.minimalGroupSize = minGroupSize;

        this.root = new DecisionNode(
            1,
            split[0],
            split[1],
            targetAttribute,
            split[2],
            1,
            this.maximumDepth,
            this.minimalGroupSize
        );
    }

    async getPrediction(data) {
        let currentNode = this.root;
        let path = [];

        while (!currentNode.isTerminal) {
            path.push(currentNode);

            if (typeof currentNode.attributeValue === 'string') {
                currentNode =
                    data[currentNode.attributeName] == currentNode.attributeValue
                        ? currentNode.children[0]
                        : currentNode.children[1];
            } else {
                currentNode =
                    data[currentNode.attributeName] < currentNode.attributeValue
                        ? currentNode.children[0]
                        : currentNode.children[1];
            }
        }

        path.push(currentNode);

        for (let i = 0; i < path.length; i++) {
            await this.highlightNode(path[i]);
        }

        for (let i = path.length - 1; i >= 0; i--) {
            await this.dehighlightNode(path[i]);
        }

        return currentNode.value;
    }

    highlightNode(node) {
        return new Promise((resolve) => {
            const selector = `#algorithm-decision-tree-node-${node.nodeId} rect`;
            d3.select(selector)
                .transition()
                .duration(300)
                .attr('fill', 'orange')
                .on('end', () => setTimeout(resolve, 500));
        });
    }

    dehighlightNode(node) {
        return new Promise((resolve) => {
            const selector = `#algorithm-decision-tree-node-${node.nodeId} rect`;
            const originalColor = node.isTerminal ? '#22b14d' : 'white';
            d3.select(selector)
                .transition()
                .duration(300)
                .attr('fill', originalColor)
                .on('end', resolve);
        });
    }
}

/*
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
*/
