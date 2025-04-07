document.addEventListener("DOMContentLoaded", function() {
  const width = 600,
        height = 420,
        radius = Math.min(width, height) / 2;
  const formatNumber = d3.format(",d");

  // Scales for angles and radii.
  const x = d3.scaleLinear().range([0, 2 * Math.PI]);
  const y = d3.scaleSqrt().range([0, radius]);

  // Color scale using d3.schemeCategory10.
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Partition layout.
  const partition = d3.partition();

  // Arc generator.
  const arc = d3.arc()
      .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
      .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
      .innerRadius(d => Math.max(0, y(d.y0)))
      .outerRadius(d => Math.max(0, y(d.y1)));

  // Append the SVG and center the chart.
  const svg = d3.select("#d3chart2")
      .append("svg")
      .attr("width", width)
      .attr("height", height  )  // extra space for legend
      .style("font", "10px sans-serif")
      .style("margin-left", "90px")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

  // Legend updater.
  function updateLegend(currentFocus) {
    // Use children if available; otherwise use parent's children.
    let legendData;
    if (currentFocus.children) {
      legendData = currentFocus.children;
    } else if (currentFocus.parent && currentFocus.parent.children) {
      legendData = currentFocus.parent.children;
    } else {
      legendData = [];
    }
    // Create (or select) the legend container.
    let legend = d3.select("#d3chart2").select(".legend");
    if (legend.empty()) {
      legend = d3.select("#d3chart2")
        .append("div")
        .attr("class", "legend")
        .style("text-align", "center")
        .style("margin-top", "1px");
    }
    // Bind legend data.
    const items = legend.selectAll("span.legend-item")
        .data(legendData, d => d.data.name);
    items.exit().remove();
    const newItems = items.enter()
      .append("span")
      .attr("class", "legend-item")
      .style("display", "inline-block")
      .style("margin-right", "15px")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        click(null, d);
      });
    newItems.html(d => `<span style="display:inline-block;width:12px;height:12px;background:${color((d.children ? d : d.parent).data.name)};margin-right:4px;"></span>${d.data.name}`);
    newItems.merge(items)
      .html(d => `<span style="display:inline-block;width:12px;height:12px;background:${color((d.children ? d : d.parent).data.name)};margin-right:4px;"></span>${d.data.name}`);
  }

  // Preprocess data to aggregate leaf nodes.
  // For any node with more than 3 children, keep the first three
  // and append a dummy node that aggregates the remaining children’s
  // credit and debit values.
  function processNode(node) {
    if (node.children && node.children.length > 3) {
      // Copy all original children.
      const fullChildren = node.children.slice();
      // Keep only the first three.
      node.children = fullChildren.slice(0, 3);
      // Aggregate remaining children.
      const remaining = fullChildren.slice(3);
      const aggCredit = d3.sum(remaining, d => d.credit || 0);
      const aggDebit  = d3.sum(remaining, d => d.debit  || 0);
      // Append dummy node with aggregated values.
      node.children.push({ name: "...", dummy: true, credit: aggCredit, debit: aggDebit });
    }
    if (node.children) {
      node.children.forEach(processNode);
    }
  }

  // Load JSON data.
  d3.json("data/ledger_data.json").then(function(data) {
    if (!data || !data.children || data.children.length === 0) {
      console.error("Invalid JSON structure. Ensure a 'children' array exists.");
      return;
    }

    // Preprocess the raw data.
    processNode(data);

    // Create the hierarchy
    const root = d3.hierarchy(data)
        .sum(d => (d.credit !== undefined && d.debit !== undefined) ? d.credit + d.debit : 1)
        .sort((a, b) => b.value - a.value);

    // Post-process the hierarchy to compute separate aggregates.
    root.eachAfter(function(d) {
      if (d.children) {
        d.totalCredit = (d.data.credit || 0);
        d.totalDebit  = (d.data.debit  || 0);
        d.children.forEach(child => {
          d.totalCredit += child.totalCredit || 0;
          d.totalDebit  += child.totalDebit  || 0;
        });
      } else {
        d.totalCredit = d.data.credit || 0;
        d.totalDebit  = d.data.debit  || 0;
      }
    });

    // Compute the partition layout.
    partition(root);

    // Draw the sunburst segments.
    const path = svg.selectAll("path")
        .data(root.descendants())
        .enter().append("path")
        .attr("d", arc)
        .style("fill", d => color((d.children ? d : d.parent).data.name))
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .on("click", click)
        .append("title")
        .text(d => d.data.name +
                   "\nCredit: " + formatNumber(d.totalCredit) +
                   "\nDebit: "  + formatNumber(d.totalDebit));

    // Initially update legend using root's children.
    updateLegend(root);

    // Click handler for zooming.
    function click(event, p) {
      svg.transition()
          .duration(750)
          .tween("scale", function() {
            const xd = d3.interpolate(x.domain(), [p.x0, p.x1]),
                  yd = d3.interpolate(y.domain(), [p.y0, 1]),
                  yr = d3.interpolate(y.range(), [p.y0 ? 20 : 0, radius]);
            return function(t) { 
              x.domain(xd(t)); 
              y.domain(yd(t)).range(yr(t)); 
            };
          })
        .selectAll("path")
          .attrTween("d", d => function() { return arc(d); });
      
      updateLegend(p);
    }
  }).catch(function(error) {
    console.error("Error loading JSON data:", error);
  });
});
