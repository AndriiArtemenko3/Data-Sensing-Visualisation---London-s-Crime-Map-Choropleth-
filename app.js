d3.select("body")
  .append("div")
  .attr("id", "tooltip");

d3.xml("data/LondonMap.svg").then(rawSvg => {
  document.getElementById("svg-container")
    .appendChild(rawSvg.documentElement);
    // adding the month selector ( dropdown menu ) for the map
    var selector = d3.select("body")
    .insert("select", "#svg-container")
    .attr("id", "month-selector");
  
  
  d3.csv("data/crime_data.csv").then(data => {
    // pulling 'month' data from the .csv file
    const uniqueMonths = data.map(d => d.Month);

    // Binding the data from the months column to the dropdown menu
    selector.selectAll("option")
      .data(uniqueMonths)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

  
    var rowsForMonth = data.filter(row => row.Month === uniqueMonths[0]);
    var colorScale = getColorScale(rowsForMonth);

    applyChoroplethColoring(rowsForMonth, colorScale);

    selector.on("change", (event) => {
      var selected = event.target.value;
      var rowsForMonth = data.filter(row => row.Month === selected);
      var colorScale = getColorScale(rowsForMonth);

      applyChoroplethColoring(rowsForMonth, colorScale);
    });

    // const uniqueBoroughs = data.map(d => d.BoroughName); -> doesn't work properly for the bar graph
    // have to sort out unique boroughs to avoid duplication issue in the bar graph drowdownn menu
    var boroughsRaw = data.map(d => d.BoroughName);
    var uniqueBoroughs = [];
    boroughsRaw.forEach(b => {
      if (!uniqueBoroughs.includes(b)) uniqueBoroughs.push(b);
    });
    uniqueBoroughs.sort();

    // 
    var boroughSelector = d3.select("body")
      .insert("select", "#bar-chart")
      .attr("id", "borough-selector");

    boroughSelector.selectAll("option")
      .data(uniqueBoroughs)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

    renderBarChart(data, uniqueBoroughs[0]);

    boroughSelector.on("change", event => {
      var selected = event.target.value;
      renderBarChart(data, selected);
    });
  });
});

function applyChoroplethColoring(rows, colorScale) {
  rows.forEach(row => {
    var id = row.BoroughName.replaceAll(" ", "_"); // not strictly necessary for my csv but just in case
    var crimes = +row.Crimes;

    var target = d3.select(`#${id}`);
    if (!target.empty()) {
      var paths = target.selectAll("path");
      paths
        .attr("fill", colorScale(crimes))
        .on("mouseover", function (event) {
          d3.select("#tooltip")
            .style("opacity", 1)
            .html(`<strong>${row.BoroughName}</strong><br/>Crimes: ${crimes}`);
        })
        .on("mousemove", function (event) {
          d3.select("#tooltip")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          d3.select("#tooltip").style("opacity", 0);
        });
    }
  });
}

function getColorScale(data) {
      var crimes = data.map(d => +d.Crimes).sort(d3.ascending);
      var thresholds = [0.2, 0.4, 0.6, 0.8].map(p => d3.quantileSorted(crimes, p));
      return d3.scaleThreshold()
        .domain(thresholds)
        .range(["#FFE2E2", "#FFA2A2", "#FB2C36", "#C10007", "#82181A"]); // first went with d3's color ranges, then built my own using tailwind and figma for better vibrancy
}

function renderBarChart(data, selectedBorough) {
  var svg = d3.select("#bar-chart");

  clearChart(svg); // important because it prevents axes from duplicating every time I chnage the borough

  var boroughData = data.filter(d => d.BoroughName === selectedBorough);

  var x = getXScale(boroughData);
  var y = getYScale(boroughData);

  svg.append("g")
    .attr("transform", "translate(0,260)")
    .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 2 === 0)));

  svg.append("g")
    .attr("transform", "translate(40,0)")
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(boroughData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.Month))
    .attr("y", d => y(+d.Crimes))
    .attr("width", x.bandwidth())
    .attr("height", d => 260 - y(+d.Crimes))
    .attr("fill", "#FB2C36");
}

 function clearChart(svg) {
  svg.selectAll("*").remove(); 
}

function getXScale(data) {
  return d3.scaleBand()
    .domain(data.map(d => d.Month))
    .range([40, 580]) 
    .padding(0.1);
}

function getYScale(data) {
  return d3.scaleLinear()
    .domain([0, d3.max(data, d => +d.Crimes)])
    .range([260, 20]); 
}





