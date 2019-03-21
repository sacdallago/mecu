Heatmap = {};

Heatmap.draw = (data, elementID, relativeHippie) => {
    // set the dimensions and margins of the graph
    let margin = {top: 0, right: 0, bottom: 0, left: 0};
    let width = 500 - margin.left - margin.right;
    let height = 500 - margin.top - margin.bottom;
    elementID = elementID || "#protein_heatmap";

// Makes transactions smooth
    let timeoutFunction = null;

// append the svg object to the body of the page
    let svg = d3.select(elementID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// Labels of row and columns
    let indexes = new Set([
        ... data.map(e => e.interactor1+"-"+(e.interactor1_experiment)),
        ...data.map(e => e.interactor2+"-"+e.interactor2_experiment)
    ]);

    let proteins = [... indexes];

// Build X scales and axis:
    let x = d3.scaleBand()
        .range([ 0, width ])
        .domain(proteins)
        .padding(0.03);
// Uncomment the following to append axis ticks
// svg.append("g")
//     .attr("transform", "translate(0," + height + ")")
//     .call(d3.axisBottom(x));

// Build X scales and axis:
    let y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(proteins.reverse())
        .padding(0.03);
// Uncomment the following to append axis ticks
// svg.append("g")
//     .call(d3.axisLeft(y));

// Build color scale
    let blue = d3.scaleLinear()
        .range(["white", "#3b8ab3"])
        .domain([Math.max.apply(Math, data.map(e => e.distance)), Math.min.apply(Math, data.map(e => e.distance))]);

    let yDomain;
    if(relativeHippie){
        yDomain = [Math.min.apply(Math, data.map(e => e.correlation)), Math.max.apply(Math, data.map(e => e.correlation))];
    } else {
        yDomain = [0, 1];
    }

    let orange = d3.scaleLinear()
        .range(["white", "#b3813d"])
        .domain(yDomain);

// create a tooltip
    let tooltip = d3.select(elementID)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "#fbfbfb")
        .style("border", "solid")
        .style("position", "relative")
        .style("border-width", .4)
        .style("width", 300)
        .style("border-radius", "3px")
        .style("padding", "5px");

    let mouseover = function(d) {
        d3.select(this)
            .style("stroke", "black");
        d3.select("#" + d.interactor2 + "" + d.interactor2_experiment + "" + d.interactor1 + "" + d.interactor1_experiment)
            .style("stroke", "black");

        tooltip
            .style("opacity", 1);
    };

    let mousemove = function(d) {
        clearTimeout(timeoutFunction);
        tooltip
            .html(
                "Protein " + d.interactor1 + " in experiment " + d.interactor1_experiment + "<br\>" +
                "Protein " + d.interactor2 + " in experiment " + d.interactor2_experiment + "<br\>" +
                "Euc. distance: " + d.distance.toFixed(2) + "<br\>" +
                "HIPPIE score: " + d.correlation)
            .style("left", (d3.mouse(this)[0]-50) + "px")
            .style("top", (d3.mouse(this)[1]-470) + "px")
    };

    let mouseleave = function(d) {
        d3.select(this)
            .style("stroke", "none");
        d3.select("#" + d.interactor2 + "" + d.interactor2_experiment + "" + d.interactor1 + "" + d.interactor1_experiment)
            .style("stroke", "none");

        timeoutFunction = setTimeout(() => {
            tooltip.style("opacity", 0);
        }, 100);

    };

    svg.selectAll()
        .data(data)
        .enter()
        .append("rect")
        .attr("id", (d) => d.interactor1 + "" + d.interactor1_experiment + "" + d.interactor2 + "" + d.interactor2_experiment)
        .attr("x", (d) =>  x(d.interactor1 + "-" + d.interactor1_experiment))
        .attr("y", (d) => y(d.interactor2 + "-" + d.interactor2_experiment))
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", (d) => {
                // Diagonal
                if(d.interactor1 + "-" + d.interactor1_experiment === d.interactor2 + "-" + d.interactor2_experiment){
                    return orange(d.correlation);
                    //Right off-diagonal
                } else if(x(d.interactor1 + "-" + d.interactor1_experiment) > y(d.interactor2 + "-" + d.interactor2_experiment)){
                    return blue(d.distance);
                    // Left off-diagonal
                } else {
                    return orange(d.correlation);
                }
            }
        )
        .style("stroke-width", 2)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
};
