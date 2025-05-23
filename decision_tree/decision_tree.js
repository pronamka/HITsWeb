function getMostFrequentTargetValue(data, targetAttribute) {
    let targetValues = {};
    for (let sample of data) {
        if (!targetValues[sample[targetAttribute]]) {
            targetValues[sample[targetAttribute]] = 0;
        }
        targetValues[sample[targetAttribute]]++;
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
        minimalGroupSize,
        maxGiniScore
    ) {
        this.nodeId = nodeId;
        this.attributeName = attributeName;
        this.attributeValue = attributeValue;
        this.targetAttribute = targetAttribute;
        this.groups = dataGroups;
        this.depth = currentDepth;
        this.maximumDepth = maximumDepth;
        this.minimalGroupSize = minimalGroupSize;
        this.maxGiniScore = maxGiniScore;
        this.isTerminal = false;
        this.children = [];
        this.addChildren();
    }

    addChildren() {
        if (this.groups[0].length === 0 || this.groups[1].length === 0) {
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

            let dataSplitter = new DataSplitter(this.groups[i], this.targetAttribute);
            let split = dataSplitter.findBestSplit();

            if (split[3] > this.maxGiniScore) {
                this.children[i] = new TerminalNode(
                    this.nodeId * 2 + i,
                    this.groups[i],
                    this.targetAttribute,
                    this.depth + 1
                );
                continue;
            }

            this.children[i] = new DecisionNode(
                this.nodeId * 2 + i,
                split[0],
                split[1],
                this.targetAttribute,
                split[2],
                this.depth + 1,
                this.maximumDepth,
                this.minimalGroupSize,
                this.maxGiniScore
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
        for (let sample of trainingData) {
            if (!this.classesDistribution[sample[this.targetAttribute]]) {
                this.classesDistribution[sample[this.targetAttribute]] = 0;
            }
            this.classesDistribution[sample[this.targetAttribute]]++;
        }

        this.classes = Object.keys(this.classesDistribution);
    }

    calculateEntropyOnGroup(data) {
        let targetValues = {};
        for (let sample of data) {
            if (!targetValues[sample[this.targetAttribute]]) {
                targetValues[sample[this.targetAttribute]] = 0;
            }
            targetValues[sample[this.targetAttribute]]++;
        }

        let entropy = 0;
        targetValues = Object.values(targetValues);
        for (let targetVariation of targetValues) {
            let proportion = targetVariation / data.length;
            entropy += proportion * proportion;
        }
        return entropy;
    }

    calculateGiniIndex(groups) {
        let giniIndex = 0;
        for (let group of groups) {
            let entropy = this.calculateEntropyOnGroup(group);
            giniIndex += (1.0 - entropy) * (group.length / this.data.length);
        }
        return giniIndex;
    }

    splitIntoTwo(attribute, value) {
        let left = [];
        let right = [];
        for (let sample of this.data) {
            if (typeof sample[attribute] == 'string') {
                if (sample[attribute] == value) {
                    left.push(sample);
                } else {
                    right.push(sample);
                }
                continue;
            }
            if (sample[attribute] < value) {
                left.push(sample);
            } else {
                right.push(sample);
            }
        }
        return [left, right];
    }

    findBestSplit() {
        let bestAttribute;
        let bestValue;
        let bestGiniIndex = 1;
        let splitGroups;
        for (let attr of this.attributes) {
            let attribute = attr;
            let sampleValue = this.data[0][attribute];
            let isNumeric = typeof sampleValue === 'number';

            let uniqueValues = new Set(this.data.map((row) => row[attribute]));

            if (!isNumeric && uniqueValues.size > this.data.length * 0.5) {
                continue;
            }
            for (let sample of this.data) {
                let groups = this.splitIntoTwo(attr, sample[attr]);
                let giniIndex = this.calculateGiniIndex(groups);

                if (giniIndex < bestGiniIndex) {
                    bestAttribute = attr;
                    bestValue = sample[attr];
                    bestGiniIndex = giniIndex;
                    splitGroups = groups;
                }
            }
        }
        return [bestAttribute, bestValue, splitGroups, bestGiniIndex];
    }
}

export class DecisionTree {
    constructor(trainingData, targetAttribute, maxDepth = 5, minGroupSize = 5, maxGiniScore = 0.4) {
        let split = new DataSplitter(trainingData, targetAttribute).findBestSplit();
        this.maximumDepth = maxDepth;
        this.minimalGroupSize = minGroupSize;
        this.maxGiniScore = maxGiniScore;
        this.root = new DecisionNode(
            1,
            split[0],
            split[1],
            targetAttribute,
            split[2],
            1,
            this.maximumDepth,
            this.minimalGroupSize,
            this.maxGiniScore
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
