let CANVAS_WIDTH;
let CANVAS_HEIGHT;

function getChildren(treeNode) {
    if (treeNode.isTerminal) {
        return [];
    }
    return treeNode.children;
}

function getText(node) {
    let treeNode = node.data;
    if (treeNode.isTerminal) {
        return [treeNode.value, treeNode.value];
    }
    return [treeNode.attributeName, treeNode.attributeValue.toString()];
}

function wrapText(text, maxPixelWidth) {
    const maxCharsPerLine = Math.max(3, Math.floor(maxPixelWidth / 7));
    const lines = [];

    for (let i = 0; i < text.length; i += maxCharsPerLine) {
        lines.push(text.substring(i, i + maxCharsPerLine));
    }

    return lines;
}

export class DecisionTreeVisualizer {
    constructor(rootNode, treeContainerId) {
        this.rootNode = rootNode;
        this.container = d3.select(`#${treeContainerId}`);
        this.container.html('');

        this.width = document.getElementById(treeContainerId).clientWidth;
        CANVAS_WIDTH = this.width;
        this.height = 500;
        CANVAS_HEIGHT = this.height;

        this.svg = this.getSVGField();

        this.hierarchyData = d3.hierarchy(rootNode, getChildren);
        this.layout = d3.tree().size([this.width - 80, this.height - 80]);
        this.layout(this.hierarchyData);

        this.buildLinks();

        this.nodes = this.getNodes();

        this.styleNodes();
        this.addText();
        this.makeInteractive();
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
            .attr('id', (d) => `algorithm-decision-tree-node-${d.data.nodeId}`)
            .attr('class', 'algorithm-decision-tree-node')
            .attr('transform', (d) => `translate(${d.x},${d.y})`)
            .style('cursor', 'pointer');
    }

    styleNodes() {
        this.nodes.each(function (d) {
            const nodeGroup = d3.select(this);
            const textLines = wrapText(getText(d)[0], CANVAS_WIDTH / Math.pow(2, d.data.depth));
            const maxLineLength = Math.max(...textLines.map((line) => line.length));
            const width = Math.max(maxLineLength * 7 + 5, 20);
            const height = textLines.length * 20 + 8;

            nodeGroup
                .insert('rect', 'text')
                .attr('rx', 8)
                .attr('fill', d.data.isTerminal ? '#22b14d' : 'white')
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .attr('x', -width / 2)
                .attr('y', -height / 2)
                .attr('width', width)
                .attr('height', height);
        });
    }

    addText() {
        this.nodes.each(function (d) {
            const group = d3.select(this);
            const lines = wrapText(getText(d)[0], CANVAS_WIDTH / Math.pow(2, d.data.depth));
            const textGroup = group.append('g').attr('class', 'text-group');

            lines.forEach((line, i) => {
                textGroup
                    .append('text')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .attr('fill', 'black')
                    .style('font-size', '12px')
                    .attr('y', i * 14 - (lines.length - 1) * 7)
                    .text(line);
            });
            d.textLines = lines;
            d.attributeName = getText(d)[0];
            d.attributeValue = getText(d)[1];
        });
    }

    makeInteractive() {
        this.nodes
            .on('mouseover', function (event, d) {
                const group = d3.select(this);
                group.select('.text-group').remove();

                const lines = wrapText(
                    d.attributeValue.toString(),
                    CANVAS_WIDTH / Math.pow(2, d.data.depth)
                );
                const textGroup = group.append('g').attr('class', 'text-group');

                lines.forEach((line, i) => {
                    textGroup
                        .append('text')
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .attr('fill', 'black')
                        .style('font-size', '12px')
                        .attr('y', i * 14 - (lines.length - 1) * 7)
                        .text(line);
                });
                d3.select(this).select('rect').attr('fill', 'black');
                d3.select(this).select('text').attr('fill', 'white');
            })
            .on('mouseout', function (event, d) {
                const group = d3.select(this);
                group.select('.text-group').remove();

                const lines = wrapText(d.attributeName, CANVAS_WIDTH / Math.pow(2, d.data.depth));
                const textGroup = group.append('g').attr('class', 'text-group');

                lines.forEach((line, i) => {
                    textGroup
                        .append('text')
                        .attr('text-anchor', 'middle')
                        .attr('alignment-baseline', 'middle')
                        .attr('fill', 'black')
                        .style('font-size', '12px')
                        .attr('y', i * 14 - (lines.length - 1) * 7)
                        .text(line);
                });
                d3.select(this)
                    .select('rect')
                    .attr('fill', d.data.isTerminal ? '#22b14d' : 'white');

                d3.select(this).select('text').attr('fill', 'black');
            });
    }

    buildLinks() {
        let nodesLinker = d3
            .linkVertical()
            .x((d) => d.x)
            .y((d) => d.y);
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
