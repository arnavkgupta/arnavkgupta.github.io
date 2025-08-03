let svg = d3.select("#chart"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    margin = { top: 40, right: 20, bottom: 40, left: 60 };

let chartWidth = width - margin.left - margin.right;
let chartHeight = height - margin.top - margin.bottom;

let g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

let xScale = d3.scaleLinear().range([0, chartWidth]);
let yScale = d3.scaleLinear().range([chartHeight, 0]);

let colorScale = d3.scaleOrdinal()
  .domain(["USA", "Europe", "Japan"])
  .range(["#1f77b4", "#2ca02c", "#d62728"]);

let tooltip = d3.select("body").append("div").attr("class", "tooltip").style("position", "absolute").style("visibility", "hidden").style("padding", "6px").style("background", "#eee").style("border", "1px solid #ccc");

let currentData = [], currentScene = 1;

d3.json("data.json").then(data => {
  data = data.filter(d => d.Horsepower && d.Miles_per_Gallon);
  data.forEach(d => {
    d.Horsepower = +d.Horsepower;
    d.Miles_per_Gallon = +d.Miles_per_Gallon;
  });
  currentData = data;

  xScale.domain(d3.extent(data, d => d.Horsepower));
  yScale.domain(d3.extent(data, d => d.Miles_per_Gallon));

  renderScene(1);

  d3.select("#scene1").on("click", () => renderScene(1));
  d3.select("#scene2").on("click", () => renderScene(2));
  d3.select("#scene3").on("click", () => renderScene(3));
  d3.select("#scene4").on("click", () => renderScene(4));
  d3.select("#regionSelect").on("change", function () {
    renderScene(4, this.value);
  });
});

function renderScene(scene, region = "All") {
  currentScene = scene;
  d3.select("#region-filter").style("display", scene === 4 ? "block" : "none");
  g.selectAll("*").remove();

  let data = currentData;
  if (scene === 4 && region !== "All") {
    data = data.filter(d => d.Origin === region);
  }

  g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(xScale)).append("text").text("Horsepower").attr("x", chartWidth / 2).attr("y", 35);
  g.append("g").call(d3.axisLeft(yScale)).append("text").text("MPG").attr("x", -40).attr("y", -10);

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.Horsepower))
    .attr("cy", d => yScale(d.Miles_per_Gallon))
    .attr("r", 5)
    .attr("fill", d => colorScale(d.Origin))
    .on("mouseover", (event, d) => {
      if (scene === 4) {
        tooltip.style("visibility", "visible").text(`${d.Name} (${d.Origin}) - ${d.Miles_per_Gallon} MPG`);
      }
    })
    .on("mousemove", (event) => {
      tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  if (scene === 1) {
    addAnnotation("Each dot is a car. X = horsepower, Y = fuel efficiency.", xScale(150), yScale(15));
  } else if (scene === 2) {
    addAnnotation("Japanese cars cluster top-left: high MPG, low power.", xScale(90), yScale(30));
  } else if (scene === 3) {
    let outlier = data.reduce((a, b) => (a.Miles_per_Gallon < b.Miles_per_Gallon ? a : b));
    addAnnotation(`Worst MPG: ${outlier.Name}`, xScale(outlier.Horsepower), yScale(outlier.Miles_per_Gallon));
  }
}

function addAnnotation(label, x, y) {
  const annotation = [
    {
      note: { label: label },
      x: x,
      y: y,
      dy: -30,
      dx: 50
    }
  ];
  const makeAnnotation = d3.annotation().annotations(annotation);
  g.append("g").call(makeAnnotation);
}