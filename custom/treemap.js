document.addEventListener("DOMContentLoaded", function() {
  // 1) Select the container for the treemap
  const container = d3.select("#d3chart3");
  const boundingRect = container.node().getBoundingClientRect();
  const width = boundingRect.width || 800;
  const height = boundingRect.height || 600;

  // 2) Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // 3) Load JSON data
  d3.json("data/creditors.json").then(function(data) {

    if (!data || !data.children || data.children.length === 0) {
      console.error("Invalid JSON structure. 'children' array is missing or empty.");
      return;
    }

    // 5) Compute Min–Max normalization on the sqrt of closing_balance
    const sqrtValues = data.children.map(d => Math.sqrt(d.closing_balance));
    const minSqrt = d3.min(sqrtValues);
    const maxSqrt = d3.max(sqrtValues);
    data.children.forEach(d => {
      // normalized_balance is in [0, 1]
      d.normalized_balance = (Math.sqrt(d.closing_balance) - minSqrt) / (maxSqrt - minSqrt);
    });

    // 6) Create a color scale for the rectangles
    const maxClosing = d3.max(data.children, d => d.closing_balance);
    const rectColorScale = d3.scaleSequential(d3.interpolateViridis)
                             .domain([0, maxClosing]);

    const textColorScale = d3.scaleSequential(d3.interpolateBlues)
                             .domain([0, d3.max(data.children, d => d.closing_balance)]);

    // 7) Build a hierarchy using normalized_balance for area
    const root = d3.hierarchy(data)
      .sum(d => d.normalized_balance)  // area is based on normalized balance
      .sort((a, b) => b.value - a.value);

    // 8) Create the treemap layout
    d3.treemap()
      .size([width, height])
      .paddingInner(3)(root);

    // 9) Append SVG
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("display", "block")
      .style("margin", "0 auto");

    // 10) Create groups for each leaf node
    const nodes = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // 11) Draw rectangles
    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => rectColorScale(d.data.closing_balance))
      .attr("stroke", "#fff")
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `<strong>${d.data.ledger_name}</strong><br>` +
          `Closing Balance: $${d.data.closing_balance.toLocaleString()}`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    nodes.append("text")
      .attr("x", 6)
      .attr("y", 18)
      .text(d => d.data.ledger_name.substring(0, 10)+"...")
      .attr("fill", d => textColorScale(d.data.closing_balance))
      .style("font-size", d => (Math.sqrt(d.y1 - d.y0) )+ "px")
      .style("font-weight", "bold")
      .attr("pointer-events", "none");

    nodes.append("text")
      .attr("x", 6)
      .attr("y", 36)
      .text(d => `$${d.data.closing_balance.toLocaleString()}`)
      .attr("fill", d => textColorScale(d.data.closing_balance))
      .style("font-size", d => (Math.sqrt(d.y1 - d.y0) - 2)+ "px")
      .attr("pointer-events", "none");

  }).catch(function(error) {
    console.error("Error loading JSON data:", error);
  });
});
