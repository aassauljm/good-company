"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom'


export default class BarGraph extends React.Component {

    render() {
        const data = this.props.data;
        const el = ReactFauxDOM.createElement('svg');
        const margin = {top: 0, right: 40, bottom: 24, left: 40},
            outerWidth = 550, outerHeight = 100,
            width = outerWidth  - margin.left - margin.right,
            height = outerHeight - margin.top - margin.bottom;

        const color = d3.scale.category20b();

        const x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.1);

        const y = d3.scale.linear()
            .range([height, 0]);

          x.domain(data.map(function(d) { return d.x; }));
          y.domain([0, d3.max(data, function(d) { return d.y; })]);

        const svg = d3.select(el)
                .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`)
                .attr("width", '100%')
                .attr("preserveAspectRatio", "xMinYMin meet")
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function(d, i) { return !(i % Math.floor(data.length/4)) ? data[i].label : ''; })
            .innerTickSize(3)
            .outerTickSize(0);

        const yAxis = d3.svg.axis()
            .scale(y)
            .tickFormat("")
            .outerTickSize(0)

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .select('path')
            .style({ 'stroke': '#bbb', 'stroke-width': '1px'})

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        svg.selectAll('text')
            .style({ 'font-size': '10', 'fill': '#777'})

        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.x); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.y); })
            .attr("height", function(d) { return height - y(d.y); })
            .style("fill", function (d, i) {return color(i) });

        return el.toReact();
    }
}