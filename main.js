// set up SVG for D3
var width  = 960,
    height = 600;

var svg = d3.select('body')
    .append('svg')
    .attr('oncontextmenu', 'return false;')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
const Color = {
    white: 'white',
    gray: '#aaaaaa',
    black: '#558888',
};
var nodes = [
        {id: 'bash', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'glibc', reflexive: true, color: Color.white, enter: 0, leave: 0},
        {id: 'basesystem', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'shutter', reflexive: false, color: Color.white, enter: 0, leave: 0},
        /*4*/{id: 'glibc-common', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'ImageMagick-perl', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'ImageMagick', reflexive: false, color: Color.white, enter: 0, leave: 0},
        /*7*/{id: 'tzdata', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'libgcc', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'nss-softokn', reflexive: false, color: Color.white, enter: 0, leave: 0},
        /*10*/{id: 'perl', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'perl-Carp', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'libselinux', reflexive: false, color: Color.white, enter: 0, leave: 0},
        {id: 'nss-softokn-freebl', reflexive: false, color: Color.white, enter: 0, leave: 0},
    ],
    links = [],
    _links = [
        {source: nodes[3], target: nodes[0], left: false, right: true },
        {source: nodes[3], target: nodes[5], left: false, right: true },
        {source: nodes[4], target: nodes[0], left: false, right: true },
        {source: nodes[4], target: nodes[12], left: false, right: true },
        {source: nodes[4], target: nodes[7], left: false, right: true },
        {source: nodes[1], target: nodes[2], left: false, right: true },
        {source: nodes[1], target: nodes[4], left: false, right: true },
        {source: nodes[1], target: nodes[8], left: false, right: true },
        {source: nodes[1], target: nodes[13], left: false, right: true },
        {source: nodes[5], target: nodes[6], left: false, right: true },
        {source: nodes[5], target: nodes[1], left: false, right: true },
        {source: nodes[5], target: nodes[10], left: false, right: true },
        {source: nodes[5], target: nodes[11], left: false, right: true },
    ];
const wait = async (t = 50) => {
    await new Promise(r => setTimeout(r, t));
    restart();
};
const linksFromNode = node => {
    return _links
        .filter(link => link.source === node && link.target.color === Color.white)
        .map(link => link.target);
};
const doSearch = async (stack, i = 0) => {
    const node = stack.pop();
    node.enter = ++i;
    node.color = Color.gray;
    await wait();
    const links = linksFromNode(node).filter(link => !stack.includes(link));
    for (const link of links) {
        stack.push(link);
        i = await doSearch(stack, i);
    }
    node.color = Color.black;
    node.leave = ++i;
    await wait();
    return i;
};
setTimeout(async () => {
    for (const link of _links) {
        links.push(link);
        await wait(100);
    }
    await wait(500);
    await doSearch([nodes[3]]);
    for (const node of nodes.filter(n => n.leave).sort((a, b) => a.leave - b.leave)) {
        const div = document.createElement('div');
        div.innerText = node.id;
        document.body.appendChild(div);
    }
}, 0);
document.body.onclick = restart;

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');


// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}
// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(links);

    // update existing links
    path.style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', function(d) { return d.color; })
        .classed('reflexive', function(d) { return d.reflexive; });
    circle.selectAll('.inner')
        .text(d => {
            return `${d.enter}/${d.leave}`
        });
    circle.selectAll('.outer')
        .text(d => d.id);
    // add new links
    path.enter().append('svg:path')
        .attr('class', 'link')
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })

    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes);


    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 16)
        .style('stroke', 'black')
        .style('fill', function(d) { return d.color; })
        .call(force.drag);

    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'inner')
        .text(d => `${d.enter}/${d.leave}`);
    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', -25)
        .attr('class', 'outer')
        .text(d => d.id);


    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();
}

restart();