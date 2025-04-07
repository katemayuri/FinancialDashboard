document.addEventListener("DOMContentLoaded", function() {
  // Load the creditors JSON.
  d3.json("data/creditors.json").then(function(data) {
    if (!data || !data.children || data.children.length === 0) {
      console.error("Invalid JSON structure: 'children' missing or empty.");
      return;
    }
    
    // For each ledger, compute aggregated credit and debit amounts.
    data.children.forEach(ledger => {
      ledger.aggregateCredit = d3.sum(ledger.transactions, d => +d.credit_amt);
      ledger.aggregateDebit  = d3.sum(ledger.transactions, d => +d.debit_amt);
    });
    
    // Define a tooltip.
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
    
    // Select the container for the table.
    const tableContainer = d3.select("#d3chart6")
      .style("overflow-y", "auto")
      .style("border", "1px solid #ccc")
      .style("margin-bottom", "10px");
    
    // Clear the existing content.
    tableContainer.html("");
    
    // Append a table element.
    const table = tableContainer.append("table")
                           .attr("class", "ledger-summary-table")
                           .style("width", "100%")
                           .style("border-collapse", "collapse");
    
    // Append the table header with colored background.
    const thead = table.append("thead");
    const headerData = ["Ledger Name", "Count", "Aggregate Credit", "Aggregate Debit"];
    const headerRow = thead.append("tr");
    headerRow.selectAll("th")
      .data(headerData)
      .enter()
      .append("th")
      .text(d => d)
      .style("border", "1px solid #ccc")
      .style("padding", "8px")
      .style("background", "#4CAF50")
      .style("color", "#fff")
      .style("font-weight", "bold")
      .style("text-align", "left");
    
    // Append the table body.
    const tbody = table.append("tbody");
    
    // Create summary rows for each ledger.
    const rows = tbody.selectAll("tr")
      .data(data.children)
      .enter()
      .append("tr")
      .attr("class", "ledger-summary-row")
      .style("border", "1px solid #ccc")
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        // When a ledger row is clicked, generate the detailed chart in #d3chart7.
        drawLedgerChart(d);
      });
    
    // Append cells for each summary row.
    rows.append("td")
        .text(d => d.ledger_name)
        .style("padding", "8px")
        .style("border", "1px solid #ccc");
    rows.append("td")
        .text(d => d.transactions.length)  // Count of transactions.
        .style("padding", "8px")
        .style("border", "1px solid #ccc");
    rows.append("td")
        .text(d => d.aggregateCredit.toLocaleString())
        .style("padding", "8px")
        .style("border", "1px solid #ccc");
    rows.append("td")
        .text(d => d.aggregateDebit.toLocaleString())
        .style("padding", "8px")
        .style("border", "1px solid #ccc");
    
    // Attach search functionality.
    const searchBox = d3.select("#searchledger");
    searchBox.on("input", function() {
      const searchText = this.value.toLowerCase();
      d3.selectAll("tr.ledger-summary-row")
        .style("display", function(d) {
          return (d.ledger_name.toLowerCase().includes(searchText) ||
                  (d.ledger_name && d.ledger_name.toLowerCase().includes(searchText)))
            ? null : "none";
        });
    });
    
    // Function to draw a detailed bar chart for a given ledger in #d3chart7.
    function drawLedgerChart(ledger) {
      // Clear any previous chart in #d3chart7.
      const chartContainer = d3.select("#d3chart7");
      chartContainer.html("");
      
      // Set up dimensions and margins for the detail chart.
      const marginChart = { top: 30, right: 30, bottom: 50, left: 60 };
      const chartWidth = 600 - marginChart.left - marginChart.right;
      const chartHeight = 400 - marginChart.top - marginChart.bottom;
      
      // Append an SVG element.
      const svgChart = chartContainer.append("svg")
        .attr("width", chartWidth + marginChart.left + marginChart.right)
        .attr("height", chartHeight + marginChart.top + marginChart.bottom)
        .append("g")
        .attr("transform", `translate(${marginChart.left},${marginChart.top})`);
      
      // Parse transaction dates.
      const parseDate = d3.timeParse("%d-%b-%Y");
      // Prepare data: each transaction with date, credit, debit, and narration.
      let transactions = ledger.transactions.map(tx => ({
        date: parseDate(tx.date),
        credit: +tx.credit_amt,
        debit: +tx.debit_amt,
        narration: tx.narration
      }));
      // Sort transactions by date.
      transactions.sort((a, b) => a.date - b.date);
      
      // Format dates for the x-axis.
      const formatDate = d3.timeFormat("%d-%b");
      const groups = transactions.map(d => formatDate(d.date));
      const subgroups = ["credit", "debit"];
      
      // X scale for groups.
      const x = d3.scaleBand()
        .domain(groups)
        .range([0, chartWidth])
        .padding(0.2);
      
      // Subgroup scale.
      const xSub = d3.scaleBand()
        .domain(subgroups)
        .range([0, x.bandwidth()])
        .padding(0.05);
      
      // Y scale: maximum value among all transactions.
      const maxY = d3.max(transactions, d => Math.max(d.credit, d.debit));
      const y = d3.scaleLinear()
        .domain([0, maxY])
        .range([chartHeight, 0])
        .nice();
      
      // Color scale for bars.
      const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(["#1f77b4", "#ff7f0e"]);
      
      // Add x-axis.
      svgChart.append("g")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "12px");
      
      // Add y-axis.
      svgChart.append("g")
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => "$" + d3.format(".2s")(d)))
        .selectAll("text")
        .style("font-size", "12px");
      
      // Create groups for each transaction.
      const transactionGroups = svgChart.selectAll("g.transactionGroup")
        .data(transactions)
        .enter()
        .append("g")
        .attr("class", "transactionGroup")
        .attr("transform", (d, i) => `translate(${x(groups[i])},0)`);
      
      // Create bars for each subgroup.
      transactionGroups.selectAll("rect")
        .data(d => subgroups.map(key => ({ key: key, value: d[key], narration: d.narration })))
        .enter()
        .append("rect")
        .attr("x", d => xSub(d.key))
        .attr("y", d => y(d.value))
        .attr("width", xSub.bandwidth())
        .attr("height", d => chartHeight - y(d.value))
        .attr("fill", d => color(d.key))
        .on("mouseover", function(event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>${d.key.toUpperCase()}</strong><br>Amount: $${d.value.toLocaleString()}<br>Narration: ${d.narration}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500).style("opacity", 0);
        });
      
      // Add a chart title.
      svgChart.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Transactions for ${ledger.ledger_name}`);
    }
    
  }).catch(function(error) {
    console.error("Error loading JSON data:", error);
  });
});
