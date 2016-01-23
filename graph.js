var resizeAdded = false;

function addGraph() {
    if(!resizeAdded) {
        d3.select(window).on('resize', addGraph);
        $("body").click(function(e) {
            setTimeout(function() {
                addGraph();
            }, 300);
        });
        resizeAdded = true;
    }
    
    d3.select('svg').remove();
    
    var dataset = {
      accounts: [checking, savings],
    };

    var width = d3.select('#tabBalance').style('width');
    var width = parseInt(width.substring(0, width.length), 10);
    console.log("width: " + width);
    if(!isNaN(width)) {
        var height = 600,
            radius = Math.min(width, height) / 2;

        var color = d3.scale.category20();

        var pie = d3.layout.pie()
            .sort(null)
            .startAngle(-1.570796325)
            .endAngle(1.570796325);

        var arc = d3.svg.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius - 50);

        var svg = d3.select("#graph").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var path = svg.selectAll("path")
            .data(pie(dataset.accounts))
          .enter().append("path")
            .attr("fill", function(d, i) {
                if(i == 1) {
                    return "rgb(46,204,113)";
                }
                else {
                    return "rgb(239,72,54)";
                }
            })
            .attr("d", arc);
    }
}