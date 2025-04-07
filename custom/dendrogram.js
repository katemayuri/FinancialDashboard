document.addEventListener("DOMContentLoaded", function() {
  // Select the container for dendrogram
  const container = d3.select("#d3chart1");
  const boundingRect = container.node().getBoundingClientRect();
  
  // Define margins.
  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  // Calculate width and height from container dimensions.
  const width = boundingRect.width - margin.left - margin.right;
  const height = boundingRect.height - margin.top - margin.bottom;
  
  // Append the SVG to the container.
  const svg = container.append("svg")
    .attr("width", boundingRect.width)
    .attr("height", boundingRect.height)
    .style("overflow", "hidden")
    // Attach zoom behavior.
    .call(d3.zoom()
      .scaleExtent([0.5, 5])
      // Allow panning within the full container.
      .translateExtent([[0, 0], [boundingRect.width, boundingRect.height]])
      .on("zoom", (event) => {
         g.attr("transform", event.transform);
      })
    );
  
  // Append a clipPath so content stays inside.
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);
  
  // Append main group with margins and apply clipPath.
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("clip-path", "url(#clip)");
  
  // Create a tree layout.
  const treeLayout = d3.tree().size([height, width]);
  let i = 0, duration = 750, root;
  
  // Load JSON data.
  d3.json("data/ledger_data.json").then(function(data) {
    // Build hierarchy.
    root = d3.hierarchy(data);
    root.x0 = height / 2;
    root.y0 = 0;
    
    // Collapse all nodes except the first level.
    if (root.children) {
      root.children.forEach(collapse);
    }
    
    update(root);
  }).catch(error => console.error("Error loading JSON:", error));
  
  // Collapse function: recursively collapse node's children.
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }
  
  // Update function: compute layout and render nodes and links.
  function update(source) {
    // Compute the new tree layout.
    const treeData = treeLayout(root);
    const nodes = treeData.descendants();
    const links = treeData.links();
    
    // Assign fixed horizontal spacing.
    nodes.forEach(d => { d.y = d.depth * 180; });
    
    // Nodes Section.
    const node = g.selectAll("g.node")
                  .data(nodes, d => d.id || (d.id = ++i));
    
    // Enter new nodes at parent's previous position.
    const nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .on("click", click);
    
    // Append circle for each node.
    nodeEnter.append("circle")
      .attr("r", 1e-6)
      .attr("fill", d => d._children ? "lightsteelblue" : "#fff")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);
    
    // Append text labels.
    nodeEnter.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d._children ? -15 : 15)
      .attr("text-anchor", d => d._children ? "end" : "start")
      .text(d => d.data.name);
    
    // Merge new and existing nodes.
    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // Update node circles.
    nodeUpdate.select("circle")
      .attr("r", 10)
      .attr("fill", d => d._children ? "lightsteelblue" : "#fff");
    
    // Transition exiting nodes.
    const nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .remove();
    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);
    
    // Links Section.
    const link = g.selectAll("path.link")
                  .data(links, d => d.target.id);
    
    const linkEnter = link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", d => {
         const o = { x: source.x0, y: source.y0 };
         return diagonal(o, o);
      })
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);
    
    const linkUpdate = linkEnter.merge(link);
    linkUpdate.transition()
      .duration(duration)
      .attr("d", d => diagonal(d.source, d.target));
    
    link.exit().transition()
      .duration(duration)
      .attr("d", d => {
         const o = { x: source.x, y: source.y };
         return diagonal(o, o);
      })
      .remove();
    
    // Save old positions for transitions.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
  
  // Diagonal path generator using cubic Bézier curves.
  function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
  }
  
  // Toggle children on click.
  function click(event, d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
});
