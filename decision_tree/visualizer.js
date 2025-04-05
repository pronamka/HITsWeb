function getChildren(treeNode) {
    if (treeNode.isTerminal) {
        return [];
    }
    return treeNode.children;
}

function getText(node) {
    let treeNode = node.data;
    if (treeNode.isTerminal) {
        return treeNode.value;
    }
    let text = treeNode.attributeName + ': ' + treeNode.attributeValue.toString();
    return text;
}

export class DecisionTreeVisualizer {
    constructor(rootNode, treeContainerId) {
        this.rootNode = rootNode;
        this.container = d3.select(`#${treeContainerId}`);
        this.container.innerHTML = '';

        this.width = 1000;
        this.height = 1000;

        this.svg = this.getSVGField();

        this.hierarchyData = d3.hierarchy(rootNode, getChildren);
        this.layout = d3.tree().size([this.width - 80, this.height - 80]);
        this.layout(this.hierarchyData);

        this.buildLinks();

        this.nodes = this.getNodes();

        this.styleNodes();
        this.addText();
    }

    getSVGField() {
        return this.container
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', 'translate(40,40)');
    }

    getNodes() {
        return this.svg
            .selectAll('.node')
            .data(this.hierarchyData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', (d) => `translate(${d.y},${d.x})`)
            .style('cursor', 'pointer');
    }

    styleNodes() {
        this.nodes
            .append('rect')
            .attr('fill', (d) => (d.data.isTerminal ? 'lightblue' : 'red'))
            .attr('x', (d) => {
                const text = getText(d);
                const textLength = text.length * 7;
                return -textLength / 2 - 10;
            })
            .attr('y', -20)
            .attr('width', function (d) {
                const text = getText(d);
                return text.length * 7 + 20;
            })
            .attr('height', 40)
            .on('mouseover', function (event, d) {
                d3.select(this).attr('fill', 'yellow');
            })
            .on('mouseout', function (event, d) {
                d3.select(this).attr('fill', (d) => (d.data.isTerminal ? 'lightblue' : 'red'));
            });
    }

    addText() {
        this.nodes
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'white')
            .style('font-size', '12px')
            .text((d) => getText(d));
    }

    buildLinks() {
        let nodesLinker = d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x);
        this.svg
            .selectAll('.link')
            .data(this.hierarchyData.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('d', nodesLinker);
    }
}
