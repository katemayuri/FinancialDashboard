document.addEventListener("DOMContentLoaded", function() {
  // Set up dimensions and margins for the chart.
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const extraLeft = 10;  // Additional offset to shift chart content to the right.
  const container = d3.select("#d3chart5");
  const boundingRect = container.node().getBoundingClientRect();
  const width = boundingRect.width || 800;
  const height = boundingRect.height || 500;

  // Append an SVG element to the container.
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // Append a tooltip div to the body.
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);


  // Date parser for transaction dates
  const parseDate = d3.timeParse("%d-%b-%Y");

  // Load the creditors JSON.
  d3.json("data/creditors1.json").then(function(data) {
    if (!data || !data.children || data.children.length === 0) {
      console.error("Invalid JSON structure: 'children' missing or empty.");
      return;
    }

    // Flatten transactions from all ledgers.
    let transactions = [];
    data.children.forEach(ledger => {
      if (ledger.transactions) {
        ledger.transactions.forEach(tx => {
          tx.parsedDate = parseDate(tx.date);
          tx.ledger = ledger.ledger_name;
          // Convert credit_amt to number.
          tx.credit_amt = +tx.credit_amt;
          transactions.push(tx);
        });
      }
    });

    // Get a sorted array of unique ledger names (to use as stack keys).
    const ledgers = Array.from(new Set(transactions.map(d => d.ledger)));

    // Aggregation function: Given a view ("Yearly", "Monthly", "Daily", "Quarterly"),
    // group transactions by the time period and ledger, summing credit_amt.
    function aggregateData(view) {
      let formatTime;
      if (view === "Yearly") {
        formatTime = d3.timeFormat("%Y");
      } else if (view === "Monthly") {
        formatTime = d3.timeFormat("%Y-%m");
      } else if (view === "Daily") {
        formatTime = d3.timeFormat("%Y-%m-%d");
      } else if (view === "Quarterly") {
        // Quarterly: format as "YYYY-Qx"
        formatTime = function(date) {
          const year = date.getFullYear();
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `${year}-Q${quarter}`;
        };
      }
      // Group by formatted date and ledger using d3.rollups.
      const rolled = d3.rollups(
        transactions,
        v => d3.sum(v, d => d.credit_amt),
        d => formatTime(d.parsedDate),
        d => d.ledger
      );
      // Transform the rolled data into an array of objects.
      const aggregated = [];
      rolled.forEach(([dateStr, ledgerArray]) => {
        const obj = { date: dateStr };
        ledgerArray.forEach(([ledger, sum]) => {
          obj[ledger] = sum;
        });
        // fill missing keys with 0.
        ledgers.forEach(l => {
          if (obj[l] === undefined) {
            obj[l] = 0;
          }
        });
        aggregated.push(obj);
      });
      // Parse date strings back into Date objects if view is not Quarterly.
      let parseFunc;
      if (view === "Yearly") {
        parseFunc = d3.timeParse("%Y");
      } else if (view === "Monthly") {
        parseFunc = d3.timeParse("%Y-%m");
      } else if (view === "Daily") {
        parseFunc = d3.timeParse("%Y-%m-%d");
      }
      if (view !== "Quarterly") {
        aggregated.forEach(d => {
          d.date = parseFunc(d.date);
        });
        // Sort numerically by date.
        aggregated.sort((a, b) => a.date - b.date);
      } else {
        // For quarterly, sort by string.
        aggregated.sort((a, b) => a.date.localeCompare(b.date));
      }
      return aggregated;
    }

    // Function to draw/update the stacked area chart.
    function drawChart(view) {
      // Aggregate data according to the selected view.
      const aggregatedData = aggregateData(view);

      // Set up x scale based on view.
      let x;
      if (view === "Quarterly") {
        x = d3.scaleBand()
          .domain(aggregatedData.map(d => d.date))
          .range([margin.left + extraLeft, width - margin.right])
          .padding(0.1);
      } else {
        x = d3.scaleTime()
          .domain(d3.extent(aggregatedData, d => d.date))
          .range([margin.left + extraLeft, width - margin.right]);
      }

      // Use d3.stack to create a stacked layout.
      const stack = d3.stack()
        .keys(ledgers)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
      const series = stack(aggregatedData);

      // Determine maximum stacked value for y domain.
      const yMax = d3.max(series, s => d3.max(s, d => d[1]));
      const y = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height - margin.bottom, margin.top]);

      // Clear previous contents.
      svg.selectAll("*").remove();

      // Define an area generator.
      let area;
      if (view === "Quarterly") {
        area = d3.area()
          .x(d => x(d.data.date) + x.bandwidth() / 2)
          .y0(d => y(d[0]))
          .y1(d => y(d[1]));
      } else {
        area = d3.area()
          .x(d => x(d.data.date))
          .y0(d => y(d[0]))
          .y1(d => y(d[1]));
      }

      // Append paths for each series (each ledger).
      svg.selectAll("path")
        .data(series)
        .enter()
        .append("path")
        .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
        .attr("d", area)
        .on("mouseover", function(event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${d.key}</strong>`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500).style("opacity", 0);
        });

      // Add the x-axis.
      if (view === "Quarterly") {
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("font-size", "14px");
      } else {
        svg.append("g")
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(6))
          .selectAll("text")
          .style("font-size", "14px");
      }

      // Add the y-axis with increased font size and convert numbers to millions.
      svg.append("g")
        .attr("transform", `translate(${margin.left + extraLeft},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => "$" +(d/1e6).toFixed(1) + "M"))
        .selectAll("text")
        .style("font-size", "14px");
    }

    // Initially draw chart with "Yearly" aggregation.
    drawChart("Yearly");

    // Redraw chart when the dropdown selection changes.
    d3.select("#timeScaleSelect").on("change", function() {
      const selectedView = d3.select(this).property("value");
      drawChart(selectedView);
    });

  }).catch(function(error) {
    console.error("Error loading JSON data:", error);
  });
});
