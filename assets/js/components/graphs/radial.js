"use strict";
import React, {PropTypes} from 'react';
import d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom'

function splitLines(string, lineLength=12){
    return string.split(' ').reduce((acc, string) => {
        acc.output += string;
        acc.length += string.length;
        if(acc.length > lineLength){
            acc.output += '\n';
            acc.length = 0;
        }
        else{
            acc.output += ' ';
        }
        return acc;
    }, {length: 0, output: ''}).output;
}

function splitLinesArray(string, lineLength=12){
    console.log(lineLength)
    return string.split(' ').reduce((acc, string) => {
        acc.output[acc.output.length-1] += string;
        acc.length += string.length;
        if(acc.length > lineLength){
            acc.output.push('');
            acc.length = 0;
        }
        else{
            acc.output[acc.output.length-1] += ' ';
        }
        return acc;
    }, {length: 0, output: ['']}).output;
}

function splitD3Lines(data){
    const el = d3.select(this);

    splitLinesArray(data.name, 12).map((t, i) => {
        console.log('this', t)
        el.append("tspan")
            .text(t)
            .attr("dy", i ? "1.5em" : '0.3em')
            .attr("x", '0')
            .attr("class", "tspan" + i);
    })
}


export default class RadialGraph extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired
    };
    render() {
        const diameter = 1200;
        const root = this.props.data;
        const el = ReactFauxDOM.createElement('svg');
        const svg = d3.select(el)
            .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var tree = d3.layout.tree()
        .size([360, diameter / 2 - (diameter/8)])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

  var nodes = tree.nodes(this.props.data),
      links = tree.links(nodes);

  var link = svg.selectAll(".link")
      .data(links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal);

  var node = svg.selectAll(".node")
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

  node.append("circle")
      .attr("r", 20);

  node.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
      .each(splitD3Lines)


    return el.toReact();
    }
}