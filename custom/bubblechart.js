document.addEventListener("DOMContentLoaded", function() {
  // Select the container for the bubble chart
  const container = d3.select("#d3chart4");
  // Use the container's dimensions or fallback to fixed size
  const boundingRect = container.node().getBoundingClientRect();
  const width = boundingRect.width || 800;
  const height = boundingRect.height || 600;

  // Create a tooltip div
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Load the JSON data
  d3.json("data/creditors.json").then(function(data) {
    if (!data || !data.children || data.children.length === 0) {
      console.error("Invalid JSON structure. Check if 'children' array exists.");
      return;
    }

    // Compute total closing balance
    const totalBalance = d3.sum(data.children, d => d.closing_balance);
    // For each child, compute:
    // 1. logBalance for packing (with +1 to avoid log(0))
    // 2. share as a fraction (0 to 1)
    data.children.forEach(d => {
      d.logBalance = Math.log(d.closing_balance + 1);
      d.share = d.closing_balance / totalBalance;
      d.ledger_name = d.ledger_name;
    });

    // Create a hierarchy and sum using the log-transformed value.
    const root = d3.hierarchy(data)
      .sum(d => d.logBalance)
      .sort((a, b) => b.value - a.value);

    // Create the circle packing layout with specified size and padding.
    const pack = d3.pack()
      .size([width, height])
      .padding(5);
    pack(root); // Compute positions and radii

    // Create an SVG element in the container
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("display", "block")
      .style("margin", "0 auto");

    // Compute maximum share 
    const maxShare = d3.max(data.children, d => d.share);

    // Use a power scale to exaggerate differences among small share values.
    const shareScale = d3.scalePow()
      .exponent(0.3)
      .domain([0, maxShare])
      .range([0, 1]);

    // Define a color scale using a blue-green gradient.
    // The input is the transformed share value.
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
      .domain([0, 1]);

    // Create groups for each leaf node
    const node = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Draw circles for each ledger, using the transformed share for the color gradient
    node.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => colorScale(shareScale(d.data.share)))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(
          `<strong>${d.data.ledger_name}</strong><br>` +
          `Closing Balance: $${d.data.closing_balance.toLocaleString()}<br>` +
          `Share: ${(d.data.share * 100).toFixed(2)}%`
        )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });

  }).catch(function(error) {
    console.error("Error loading JSON data:", error);
  });
});
