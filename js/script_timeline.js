// offer email link if on mobile device
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  document.getElementById('myModal2').style.display = 'block';
};

var API_data = [];
var earliest_date,
    latest_date;

var full_timeline_width = 1200,
    secondary_timeline_width = 1000,

    secondary_timeline_xOffset = .5 * (full_timeline_width - secondary_timeline_width),
    full_timeline_x = 0,
    secondary_timeline_x = full_timeline_x + secondary_timeline_xOffset,

    full_timeline_y = 260,
    secondary_timeline_yOffset = 200,

    imageHeight = 120,
    full_timeline_imageWidth = imageHeight,
    secondary_timeline_imageWidth = full_timeline_imageWidth * 1.7;

//general timeline object constructor
// above/below as in secondary timeline above or below full timeline?
function Timeline(lowestDate, highestDate, x, y, width, img_width, id, full, secondary, above, below) {
    this.lowestDate = lowestDate;
    this.highestDate = highestDate;
    this.x = x;
    this.y = y;
    this.width = width;
    this.img_width = img_width;
    this.x_scale = d3.scaleLinear()
        .domain([lowestDate, highestDate])
        .range([0, width]);
    this.id = id;
    this.full = full;
    this.secondary = secondary;
    this.above = above;
    this.below = below;
}

// Using pre-processed data 
d3.json("NM_data.json").then(function (portraits_data) {
    // if fetching data from API call, earliest and latest date calculated live
    earliest_date = 1565;
    latest_date = 2008;
    console.log(portraits_data);

    /* Tried preloading images before drawing visualisation, but for slower internet speeds loading takes too long
    
    // preload images into the cache
    var images_portraits_data = [];
    portraits_data.forEach(function (d, i) {
        var img_src = d['ns1:thumbnail'].substring(0, d['ns1:thumbnail'].length - 7) + "600x600";
        images_portraits_data.push(img_src);
    });

    function preloadImages(srcs) {
        function loadImage(src) {
            return new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () {
                    resolve(img);
                };
                img.onerror = img.onabort = function () {
                    reject(src);
                };
                img.src = src;
            });
        }
        var promises = [];
        for (var i = 0; i < srcs.length; i++) {
            promises.push(loadImage(srcs[i]));
        }
        return Promise.all(promises);
    }
    
        preloadImages(images_portraits_data).then(function (imgs) {
        // all images are loaded now and in the array imgs
        //fade out loading spinner and draw viz
        d3.select('#cover-spin').style('display', 'none');
        drawVisualisation(portraits_data);
    }, function (errImg) {
        console.log('image failed');
    });
    */

    function visualisation_start() {
        d3.select('#cover-spin').style('display', 'none');
        drawVisualisation(portraits_data);
    }
    visualisation_start();

});

// Code below sets out the API call and processing to create NM_data.json
/*
kringla_ajaxCall(500, 0);

function kringla_ajaxCall(hitsPerPage, startRecord) {
    jQuery.ajax({
        url: 'http://kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage=' + hitsPerPage + '&startRecord=' + startRecord + '&x-api=%22test%22&query=porträtt%20and%20tavla%20and%20thumbnailExists=%22j%22%20and%20create_fromTime%3C=2018%20and%20create_toTime%3E=0%20and%20serviceOrganization=nomu',

        type: 'POST',
        dataType: 'json',
        success: function (data) {
            console.log(data);
            var data_records = data.result.records;
            var clean_data = [];
            data_records.forEach(function (d, i) {
                clean_data[i] = d['record']['@graph'];
            });
            if (API_data.length > 1) {
                API_data = API_data.concat(clean_data);
            } else {
                API_data = clean_data;
            };
            //            console.log(API_data);

            // repeat API call if hitsPerPage is below totalHits
            if ((hitsPerPage + startRecord) < data.result.totalHits) {
                kringla_ajaxCall(hitsPerPage, (startRecord + hitsPerPage + 1));
            } else {
                process_data(API_data);
            }

            //            process_data(API_data);
        }
    });
}

function process_data(x) {
    var clean_data_reconstructed = [];

    x.forEach(function (d, i) {
        // last item of record array is the full record
        var record = d[d.length - 1];
        replace_b_keys(record);

        // find and replace empty nodes (_:b keys) with matching object
        function replace_b_keys(obj) {
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    if (obj[p].constructor === Array) {
                        for (i = 0; i < obj[p].length; i++) {
                            if (obj[p][i].substring(0, 3) == "_:b") {
                                d.forEach(function (y) {
                                    if (y['@id'] == obj[p][i]) {
                                        record[p][i] = y;
                                    };
                                });
                            };
                        }
                    } else if (obj[p].constructor !== Object) {
                        if (obj[p].substring(0, 3) == "_:b") {
                            d.forEach(function (y) {
                                if (y['@id'] == obj[p]) {
                                    record[p] = y;
                                };
                            });
                        };
                    };
                }
            }
            clean_data_reconstructed.push(record);
        }
    });
    console.log(clean_data_reconstructed);
    parse_date_info_data(clean_data_reconstructed);
}

function parse_date_info_data(data) {
    // isolate 'production' dates
    data.forEach(function (d, i) {
        if (d['context'].constructor === Array) {
            var production_date = d['context'].filter(obj => {
                return (obj['context:Label'] == "Produktion");
            });
            // remove production contexts with no dates (either missing fromTime, toTime or both)
            if (production_date.length > 1) {
                var production_hasdate = production_date.filter(obj => {
                    return ('ns1:fromTime' in obj);
                });
                production_hasdate = production_hasdate.filter(obj => {
                    return ('ns1:toTime' in obj);
                });
                production_date = production_hasdate;
                // choose earliest production date if there in more than 1
                if (production_hasdate.length > 1) {
                    function compare(a, b) {
                        if (a['ns1:fromTime'] < b['ns1:fromTime'])
                            return -1;
                        if (a['ns1:fromTime'] > b['ns1:fromTime'])
                            return 1;
                        return 0;
                    }
                    production_hasdate.sort(compare);
                    production_date = production_hasdate[0];
                } else {
                    production_date = production_date[0];
                }
            } else {
                production_date = production_date[0];
            };
            //            console.log(production_date);
        };
        data[i].date = production_date;
    });

    // remove items where date or fromTime/toTime is undefined
    data = data.filter(item => item.date !== undefined);
    data = data.filter(item => ((item.date['ns1:fromTime'] !== undefined) || (item.date['ns1:toTime'] !== undefined)));

    //data items to remove - includes 1850-1860 lithographs showing people in historical costume, empty frames, low-quality photo, object not a portrait
    var items_to_remove = ["http://kulturarvsdata.se/nomu/object/NM0269502", "http://kulturarvsdata.se/nomu/object/NM0259576", "http://kulturarvsdata.se/nomu/object/NM0269501", "http://kulturarvsdata.se/nomu/object/NM0046598", "http://kulturarvsdata.se/nomu/object/NM0269498", "http://kulturarvsdata.se/nomu/object/NM0269513", "http://kulturarvsdata.se/nomu/object/NM0269516", "http://kulturarvsdata.se/nomu/object/NM0269504", "http://kulturarvsdata.se/nomu/object/NM0269515", "http://kulturarvsdata.se/nomu/object/NM0269503", "http://kulturarvsdata.se/nomu/object/NM0269501", "http://kulturarvsdata.se/nomu/object/NM0269493", "http://kulturarvsdata.se/nomu/object/NM0269496",
    "http://kulturarvsdata.se/nomu/object/NM0269503", "http://kulturarvsdata.se/nomu/object/NM0269508", "http://kulturarvsdata.se/nomu/object/NM0269494", "http://kulturarvsdata.se/nomu/object/NM0269512", "http://kulturarvsdata.se/nomu/object/NM0269497", "http://kulturarvsdata.se/nomu/object/NM0269517",
    "http://kulturarvsdata.se/nomu/object/NM0269495", "http://kulturarvsdata.se/nomu/object/NM0269518", "http://kulturarvsdata.se/nomu/object/NM0269509",
    "http://kulturarvsdata.se/nomu/object/NM0269507", "http://kulturarvsdata.se/nomu/object/NM0269506", "http://kulturarvsdata.se/nomu/object/NM0269505", "http://kulturarvsdata.se/nomu/object/NM0269507", "http://kulturarvsdata.se/nomu/object/NM0269511", "http://kulturarvsdata.se/nomu/object/NM0269500", "http://kulturarvsdata.se/nomu/object/NM0269510", "http://kulturarvsdata.se/nomu/object/NM0269499", "http://kulturarvsdata.se/nomu/object/NM0269514", "http://kulturarvsdata.se/nomu/object/NM0083661", "http://kulturarvsdata.se/nomu/object/NM0037647", "http://kulturarvsdata.se/nomu/object/NM0265730", "http://kulturarvsdata.se/nomu/object/NM0206653", "http://kulturarvsdata.se/nomu/object/NM0183702*1", "http://kulturarvsdata.se/nomu/object/NM0502296*1"];
    data = data.filter((item) => !items_to_remove.includes(item["@id"]));

    // keep only the year for date information
    data.forEach(function (d, i) {
        data[i].date.earliest = parseInt(d['date']['ns1:fromTime'].substring(0, 4));
        data[i].date.latest = parseInt(d['date']['ns1:toTime'].substring(0, 4));
    });

    earliest_date = d3.min(data, function (d) {
        return parseInt(d['date']['ns1:fromTime'].substring(0, 4));
    });
    earliest_date = earliest_date - 5;
    latest_date = d3.max(data, function (d) {
        return parseInt(d['date']['ns1:toTime'].substring(0, 4));
    });
    latest_date = latest_date + 5;

    // to reduce file size, remove all fields except ones used in the timeline viz
    var data_reduced = data.map(function (d, i) {
        return {
            'ns1:url': d['ns1:url'],
            'ns1:thumbnail': d['ns1:thumbnail'],
            '@id': d['@id'],
            'ns1:itemLabel': d['ns1:itemLabel'],
            'date': d['date']
        };
    });
    console.log(JSON.stringify(data_reduced));
//    drawVisualisation(data_reduced);
}
*/

function drawVisualisation(data) {

    console.log(data);

    var viz_width = 1200,
        viz_height = 800,
        vis_top_margin = 100;

    var chart = d3.select('#viz_wrapper')
        .append('svg:svg')
        .attr('id', 'visualisation')
        .attr('width', viz_width)
        .attr('height', viz_height)
        .append('g')
        .attr('id', 'visualisation_with_padding')
        .attr('transform', 'translate(0,' + vis_top_margin + ')');

    /************************
    			Visualise Axes
    		*************************/

    function visualise_axis(timeline) {
        d3.select('#visualisation_with_padding').append('g').attr('class', 'images_wrapper ' + timeline.id);
        visualise_rects(timeline);

        // check if axis ticks need to be rendered above or below (depending on which timeline)
        if (timeline.secondary && timeline.above) {
            var axis = d3.axisTop(timeline.x_scale)
                .tickSize(6, 0, 0)
                .tickFormat(d3.format("d"));
        } else {
            var axis = d3.axisBottom(timeline.x_scale)
                .tickSize(6, 0, 0)
                .tickFormat(d3.format("d"));
        };

        if (timeline.secondary) {
            //set the axis tick values explicitly, as the array of ticks
            //generated by the scale PLUS the max and min values from the scale domain
            //concatenated into a single array
            axis.tickValues(timeline.x_scale.ticks(1).concat(timeline.x_scale.domain()));
        } else if (timeline.full) {
            axis.ticks(9).tickSizeOuter(0);
        };

        d3.select('#visualisation_with_padding').append('g')
            .attr('class', 'axis')
            .attr('id', timeline.id)
            .call(axis);

        // adjust timeline height for secondary timelines, so doesn't overlap images
        if (timeline.secondary) {
            if (timeline.above) {
                d3.select('#' + timeline.id).attr('transform', 'translate(' + timeline.x + ',' + (timeline.y - (timeline.img_width / 2)) + ')');
                // translate down tick lines for above axis, so they are visible
                d3.select('#' + timeline.id).selectAll('.tick').selectAll('line').attr('y1', 1);
            } else if (timeline.below) {
                d3.select('#' + timeline.id).attr('transform', 'translate(' + timeline.x + ',' + (timeline.y + (timeline.img_width / 2)) + ')');
            };
        } else {
            d3.select('#' + timeline.id).attr('transform', 'translate(' + timeline.x + ',' + timeline.y + ')');
        };

        if (timeline.secondary) {
            var shuffle_box_padding_from_timeline = 10,
                shuffle_box_width = 105,
                shuffle_box_height = 30,
                shuffle_text_x = 7,
                shuffle_text_y = 20,
                shuffle_image_x = 75;

            // declare shuffle/show all box
            d3.select("#visualisation_with_padding")
                .append("g")
                .attr('class', 'shuffle_box_wrapper ' + timeline.id)
                .append('rect')
                .attr("class", "shuffle_box " + timeline.id)
                .attr('width', shuffle_box_width)
                .attr('height', shuffle_box_height);

            d3.select('.shuffle_box_wrapper.' + timeline.id).append('svg:text').attr('class', 'shuffle_box_text ' + timeline.id).attr('transform', 'translate(' + shuffle_text_x + ',' + shuffle_text_y + ')');
            d3.select('.shuffle_box_text.' + timeline.id).append('tspan').attr('id', 'shuffle_text_portion').attr('class', timeline.id);
            d3.select('.shuffle_box_text.' + timeline.id).append('tspan').text(" of ");
            d3.select('.shuffle_box_text.' + timeline.id).append('tspan').attr('id', 'shuffle_text_total').attr('class', timeline.id);

            d3.select('.shuffle_box_wrapper.' + timeline.id).append('svg:image').attr('class', 'shuffle ' + timeline.id).attr('xlink:href', 'css/shuffle2.png').attr('width', 20).attr('height', 30).attr('transform', 'translate(' + shuffle_image_x + ',0)');

            var shuffle_box_x = timeline.x + timeline.width - shuffle_box_width,
                shuffle_box_timeline_padding = 5,
                shuffle_box_above_y = timeline.y - timeline.img_width / 2 + shuffle_box_timeline_padding,
                shuffle_box_padding_from_timeline,
                shuffle_box_below_y = timeline.y + timeline.img_width / 2 - shuffle_box_height - shuffle_box_timeline_padding,
                shuffle_box_padding_from_timeline;

            if (timeline.above) {
                d3.select('.shuffle_box_wrapper.' + timeline.id).attr('transform', 'translate(' + shuffle_box_x + ',' + shuffle_box_above_y + ')');
            } else if (timeline.below) {
                d3.select('.shuffle_box_wrapper.' + timeline.id).attr('transform', 'translate(' + shuffle_box_x + ',' + shuffle_box_below_y + ')');
            };

            draw_connecting_lines(full_timeline, timeline);
        };
    }

    function filter_image_data(timeline) {
        var image_data = [];
        // full or minor timeline?
        if (timeline.full) {
            image_data = sample_evenly_across_date_span(0, data);
        } else if (timeline.secondary) {
            //filter image data for timeline by scale 
            var date_span = timeline.x_scale.domain();
            var data_filtered_by_date_span = data.filter(function (d) {
                // date span of records must overlap with focus timeline domain
                return (d.date.earliest < date_span[1]) && (d.date.latest > date_span[0]);
            });
            image_data = sample_evenly_across_date_span(7, data_filtered_by_date_span);

            d3.select('#shuffle_text_portion.' + timeline.id).transition().text(image_data.length);
            d3.select('#shuffle_text_total.' + timeline.id).transition().text(data_filtered_by_date_span.length);

            d3.select('#shuffle_text_total.' + timeline.id).on('click', function () {
                d3.select('#tile_viz_wrapper').style('display', 'inline');
                d3.select('#tile_viz_wrapper').selectAll('div').remove();
                visualise_data_as_tiles(data_filtered_by_date_span);
                d3.select('#tile_viz_header').transition().text(String(timeline.x_scale.domain()[0]) + '-' + String(timeline.x_scale.domain()[1]));
                var elmnt = document.getElementById("tile_viz_wrapper");
                elmnt.scrollIntoView(({
                    block: 'start',
                    behavior: 'smooth'
                }));

            });

        };

        // random sample over date range
        //        function sample(sample_size, data) {
        //            if (sample_size < data.length) {
        //                var sample_indices = [],
        //                    sample_data = [];
        //                while (sample_indices.length < sample_size) {
        //                    var random_index = Math.floor(Math.random() * data.length);
        //                    // check haven't already picked that record in sample
        //                    if (sample_indices.indexOf(random_index) > -1) continue;
        //                    sample_indices[sample_indices.length] = random_index;
        //                    sample_data.push(data[random_index]);
        //                };
        //                return sample_data;
        //            } else {
        //                return data;
        //            }
        //        }

        // spread sample evenly across date range, by sampling over 
        function sample_evenly_across_date_span(sample_size, data_filtered) {
            //            console.log(sample_size);
            //            console.log(data_filtered.length);

            // only do this if dataset is larger than sample_size
            if (sample_size < data_filtered.length) {
                var sample_data = [];

                var lower_date = timeline.x_scale.domain()[0],
                    upper_date = timeline.x_scale.domain()[1];

                // divide date range into N portions, where N is sample size
                for (i = 0; i < sample_size; i++) {

                    var portion_lower = lower_date + ((upper_date - lower_date) / sample_size) * i;
                    var portion_upper = lower_date + ((upper_date - lower_date) / sample_size) * (i + 1);
                    var portion_date_span = [portion_lower, portion_upper];

                    //filter image data again, for portioned date span
                    var data_filtered_portion = data_filtered.filter(function (d) {
                        return (d.date.earliest < portion_date_span[1]) && (d.date.latest > portion_date_span[0]);
                    });

                    if (data_filtered_portion.length > 0) {
                        var random_index = Math.floor(Math.random() * data_filtered_portion.length);
                        var random_image = data_filtered_portion[random_index];

                        // truncate image's date span to the date span of the portion (if it's wider) so images are more evenly spaced when they are plotted on timeline 

                        // if date span does not need to be truncated, make sure remove trunc dates, as these store values from previous data filtering
                        if (random_image.date.earliest < portion_lower) {
                            random_image.date.earliest_trunc = portion_lower;
                        } else {
                            delete random_image.date['earliest_trunc'];
                        };
                        if (random_image.date.latest > portion_upper) {
                            random_image.date.latest_trunc = portion_upper;
                        } else {
                            delete random_image.date['latest_trunc'];
                        };

                        sample_data.push(random_image);

                        //remove pushed item from data_filtered to avoid duplicates
                        data_filtered = $.grep(data_filtered, function (e) {
                            return e["ns1:url"] != (random_image["ns1:url"]);
                        });

                    };
                };
                return sample_data;
            } else {
                return data_filtered;
            };
        }
        console.log(image_data);
        return image_data;
    }

    function visualise_rects(timeline) {
        var rect_height = 5;

        // only visualise frequency on main timeline
        if (timeline.full) {
            var rects = d3.select('#visualisation_with_padding').append('g').attr('class', 'rects_wrapper ' + timeline.id).selectAll('.rect').data(data)
                .enter()
                .append('svg:rect')
                .attr('y', timeline.y - rect_height / 2)
                .attr('x', function (d) {
                    return timeline.x + timeline.x_scale(d.date.earliest);
                })
                .attr('height', rect_height)
                .style('fill', 'white')
                .attr('class', 'rect')
                .each(function (d) {
                    if (d.date.latest == d.date.earliest) {
                        d3.select(this).attr('width', 1).style('opacity', 0.5);
                    } else {
                        var opacity_rect_scale = d3.scalePow().exponent(0.5).domain([0, 200]).range([0.5, 0.3]);
                        var rect_width_measured = timeline.x_scale(d.date.latest) - timeline.x_scale(d.date.earliest);
                        d3.select(this).attr('width', rect_width_measured).style('opacity', opacity_rect_scale(rect_width_measured));
                    };
                });
        }
    }

    function visualise_images(timeline) {

        console.log('visualising images');

        var image_data = filter_image_data(timeline);
        var selection = d3.select('.images_wrapper.' + timeline.id).selectAll('.image_node').data(image_data, function (d) {
            return d["ns1:url"];
        });

        selection.enter().append('g')
            .attr('class', 'image_node')
            .append('svg:image')
            .attr('id', 'image_svg')
            .attr('height', timeline.img_width)
            .attr('width', timeline.img_width)
            .each(function (d, i) {
                function halfwayDate(earliest, latest) {
                    return earliest + ((latest - earliest) * 0.5);
                }
                var halfwayDate;
                var earliest_trunc,
                    latest_trunc;
                // use truncated dates if they exist (from sample_evenly_across_date_span())
                if ("earliest_trunc" in d.date) {
                    earliest_trunc = d.date.earliest_trunc;
                } else {
                    earliest_trunc = d.date.earliest;
                };
                if ("latest_trunc" in d.date) {
                    latest_trunc = d.date.latest_trunc;
                } else {
                    latest_trunc = d.date.latest;
                };

                // check if halfway date falls outside timeline datespan
                if ((earliest_trunc < timeline.x_scale.domain()[0]) && (latest_trunc > timeline.x_scale.domain()[1])) {
                    halfwayDate = halfwayDate(timeline.x_scale.domain()[0], timeline.x_scale.domain()[1]);
                } else if (earliest_trunc < timeline.x_scale.domain()[0]) {
                    halfwayDate = halfwayDate(timeline.x_scale.domain()[0], latest_trunc);
                } else if (latest_trunc > timeline.x_scale.domain()[1]) {
                    halfwayDate = halfwayDate(earliest_trunc, timeline.x_scale.domain()[1]);
                } else {
                    halfwayDate = halfwayDate(earliest_trunc, latest_trunc);
                };
                var datum = d;
                datum.halfwayDate = halfwayDate;
                d3.select(this)
                    .attr('x', timeline.x_scale(halfwayDate))
                    .datum(datum);
            })
            .attr('y', function () {
                return timeline.y - (timeline.img_width / 2);
            })
            .attr('xlink:href', function (d) {
                return d['ns1:thumbnail'].substring(0, d['ns1:thumbnail'].length - 7) + "600x600";
            })
            .attr('data-id', function (d) {
                return d["@id"];
            })
            .attr('data-title', function (d) {
                return d["ns1:itemLabel"];
            })
            .attr('data-link', function (d) {
                return d["ns1:url"];
            })
            .attr('data-date', function (d) {
                if (d.date.earliest == d.date.latest) {
                    return String(d.date.earliest);
                } else {
                    return String(d.date.earliest) + "-" + String(d.date.latest);
                };
            })
            .style('opacity', 0)
            .on("click", function (d) {
                launch_lightbox(d['ns1:thumbnail'].substring(0, d['ns1:thumbnail'].length - 7) + "1200x1200", d3.select(this));
            });

        // fade images in
        d3.select('.images_wrapper.' + timeline.id).selectAll('.image_node').selectAll('#image_svg').transition().style('opacity', 1);
        image_hover();
    }

    function image_hover() {
        //mouseover - tooltip and image reorder
        d3.selectAll('.image_node')
            .on("mouseover", function (d) {
                // create tooltip
                var short_tooltip = d3.select("body")
                    .append("div") // declare the tooltip div 
                    .attr("class", "tooltip") // apply the 'tooltip' class
                    .style("opacity", 0); // set the opacity to nil    

                //bring image to front    
                d3.select(this).node().parentElement.appendChild(this);
                // show tooltip
                short_tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                short_tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                var tooltip_date;
                if (d.date.earliest == d.date.latest) {
                    tooltip_date = d.date.earliest;
                } else {
                    tooltip_date = String(d.date.earliest) + "-" + String(d.date.latest);
                }
                short_tooltip.html("<p style='background-color: rgba(22, 22, 22, 0.95);'>" + d["ns1:itemLabel"] + ", " + tooltip_date + "</p>");
                clientRect = d3.select(this).node().getBoundingClientRect();
                var x_pos_short_tooltip = clientRect.right;
                var y_pos_short_tooltip = clientRect.top;
                short_tooltip.style("left", x_pos_short_tooltip + window.pageXOffset + "px")
                    .style("top", y_pos_short_tooltip + window.pageYOffset + "px");
            })
            .on("mouseout", function (d) {
                d3.select('.tooltip').transition().duration(100).style("opacity", 0);
                d3.selectAll('.tooltip').remove();
            });

    }

    function draw_connecting_lines(major_timeline, minor_timeline) {

        var svg = d3.select("#visualisation_with_padding");

        // draw line showing where short timeline fits with full timeline
        var link = d3.linkVertical()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            });

        if (minor_timeline.above) {
            var link1_points = {
                source: {
                    x: minor_timeline.x,
                    y: minor_timeline.y - minor_timeline.img_width / 2
                },
                target: {
                    x: major_timeline.x_scale(minor_timeline.lowestDate),
                    y: major_timeline.y
                }
            };
            var link2_points = {
                source: {
                    x: minor_timeline.x + minor_timeline.width,
                    y: minor_timeline.y - minor_timeline.img_width / 2
                },
                target: {
                    x: major_timeline.x_scale(minor_timeline.highestDate),
                    y: major_timeline.y
                }
            };
        } else if (minor_timeline.below) {
            var link1_points = {
                source: {
                    x: minor_timeline.x,
                    y: minor_timeline.y + minor_timeline.img_width / 2
                },
                target: {
                    x: major_timeline.x_scale(minor_timeline.lowestDate),
                    y: major_timeline.y
                }
            };
            var link2_points = {
                source: {
                    x: minor_timeline.x + minor_timeline.width,
                    y: minor_timeline.y + minor_timeline.img_width / 2
                },
                target: {
                    x: major_timeline.x_scale(minor_timeline.highestDate),
                    y: major_timeline.y
                }
            };
        }

        svg.append("path")
            .attr("d", link(link1_points))
            .attr('id', 'lowest')
            .attr('class', 'link ' + minor_timeline.id)
            .style("fill", "none")
            .style("stroke", "#00cccc")
            .style("stroke-width", "1px")
            .style('opacity', 0.5);

        svg.append("path")
            .attr("d", link(link2_points))
            .attr('id', 'highest')
            .attr('class', 'link ' + minor_timeline.id)
            .style("fill", "none")
            .style("stroke", "#00cccc")
            .style("stroke-width", "1px")
            .style('opacity', 0.5);

        // check if secondary timeline ABOVE or BELOW major timeline
        var brush_thickness = 15;
        if (minor_timeline.y < major_timeline.y) {
            var brush = d3.brushX()
                .extent([[0, -brush_thickness], [major_timeline.width, 0]])
                .handleSize(20) // expand handle size
                .on("brush", brushed_axis)
                .on("end", brushed_images);
        } else {
            var brush = d3.brushX()
                .extent([[0, 0], [major_timeline.width, brush_thickness]])
            .handleSize(20)
                .on("brush", brushed_axis)
                .on("end", brushed_images);
        };

        d3.select('#' + major_timeline.id)
            .append('g')
            .attr('class', 'brush ' + minor_timeline.id)
            .call(brush)
            .call(brush.move, [major_timeline.x_scale(minor_timeline.x_scale.domain()[0]), major_timeline.x_scale(minor_timeline.x_scale.domain()[1])]);

        //remove brush overlay layer, so only moving and resizing is possible
        d3.selectAll('.brush').select('.overlay').remove();

        // activate shuffle button
        d3.select('.shuffle.' + minor_timeline.id).on('click', brushed_images);

        function brushed_axis() {
            if (!d3.event.sourceEvent) return; // Only transition after input.
            if (!d3.event.selection) return; // Ignore empty selections.

            var s = d3.event.selection;
            var selected_years = s.map(major_timeline.x_scale.invert, major_timeline.x_scale);
            selected_years.forEach(function (d, i) {
                selected_years[i] = Math.round(d);
            });

            //make sure domain starts and ends on round values (so can show tick values start/end of secondary axes) 
            minor_timeline.x_scale.domain(selected_years);

            if (minor_timeline.secondary && minor_timeline.above) {
                var axis = d3.axisTop(minor_timeline.x_scale)
                    .tickSize(6, 0, 0)
                    .tickFormat(d3.format("d"));
            } else {
                var axis = d3.axisBottom(minor_timeline.x_scale)
                    .tickSize(6, 0, 0)
                    .tickFormat(d3.format("d"));
            };

            //set the axis tick values explicitly, as the array of ticks
            //generated by the scale PLUS the max and min values from the scale domain
            //concatenated into a single array
            axis.tickValues(minor_timeline.x_scale.ticks(2).concat(minor_timeline.x_scale.domain()));

            link1_points.target.x = major_timeline.x_scale(minor_timeline.x_scale.domain()[0]);
            link2_points.target.x = major_timeline.x_scale(minor_timeline.x_scale.domain()[1]);

            // transition minor timeline ticks
            d3.select('#' + minor_timeline.id).call(axis);

            // translate down tick lines for above axis, so they are visible
            if (minor_timeline.secondary && minor_timeline.above) {
                d3.select('#' + minor_timeline.id).selectAll('.tick').selectAll('line').attr('y1', 1);
            };

            //transisiton curved lines
            d3.select('#highest.' + minor_timeline.id).attr('d', link(link2_points)).transition();
            d3.select('#lowest.' + minor_timeline.id).attr('d', link(link1_points)).transition();

            // fade out images then remove .image_nodes on 'brushed'
            d3.select('.images_wrapper.' + minor_timeline.id).selectAll('#image_svg').transition().duration(50).style('opacity', 0).each(function () {
                d3.select(this.parentNode).remove();
            });

            // use 'transition' to move brush selection to the scale's 'nice' values - so it matches up with the curved line positions
            d3.select(this).transition().duration(0).call(d3.event.target.move, [major_timeline.x_scale(minor_timeline.x_scale.domain()[0]), major_timeline.x_scale(minor_timeline.x_scale.domain()[1])]);
        }

        function brushed_images() {
            // remove any existing images (in case brushed_axis() has not been called)
            d3.select('.images_wrapper.' + minor_timeline.id).selectAll('.image_node').remove();

            visualise_images(minor_timeline);

            // black background to axis text - call here so background moves with moving ticks
            //            add_background_to_axis_ticks();
        }
    }

    //construct full timeline (full collection timespan)
    var full_timeline = new Timeline(earliest_date, latest_date, full_timeline_x, full_timeline_y, full_timeline_width, full_timeline_imageWidth, "full_timeline", true, false, false, false);

    // construct secondary timeline ABOVE full timeline around random dates
    // make sure random_date_span is whole numbers so can have ticks for start and end of secondary timeline
    // manually set dates selected between to 1600 - 1920 to manage user's experience, as outside these dates there are few images
    var earliest_date_timeline_initial = 1600,
        latest_date_timeline_initial = 1920;

    function random_date_in_full_timeline_span_initial(earliest, latest) {
        return Math.round(earliest + (latest - earliest) * Math.random());
    }

    var random_date_in_full_timeline_span = random_date_in_full_timeline_span_initial(earliest_date_timeline_initial, latest_date_timeline_initial);
    var secondary_timeline1 = new Timeline(random_date_in_full_timeline_span, random_date_in_full_timeline_span + 10, secondary_timeline_x, full_timeline_y - secondary_timeline_yOffset, secondary_timeline_width, secondary_timeline_imageWidth, "secondary_timeline1", false, true, true, false);

    //construct secondary timeline BELOW full timeline around random dates 
    var random_date_in_full_timeline_span2 = random_date_in_full_timeline_span_initial(earliest_date_timeline_initial, latest_date_timeline_initial);
    var secondary_timeline2 = new Timeline(random_date_in_full_timeline_span2, random_date_in_full_timeline_span2 + 10, secondary_timeline_x, full_timeline_y + secondary_timeline_yOffset, secondary_timeline_width, secondary_timeline_imageWidth, "secondary_timeline2", false, true, false, true);

    //EXAMPLE: construct third timeline BELOW full timeline around random dates 
    var random_date_in_full_timeline_span3 = random_date_in_full_timeline_span_initial(earliest_date_timeline_initial, latest_date_timeline_initial);
    var secondary_timeline3 = new Timeline(random_date_in_full_timeline_span3, random_date_in_full_timeline_span3 + 10, secondary_timeline_x, full_timeline_y + (2 * secondary_timeline_yOffset), secondary_timeline_width, secondary_timeline_imageWidth, "secondary_timeline3", false, true, false, true);

    visualise_axis(full_timeline);
    visualise_axis(secondary_timeline1);
    visualise_axis(secondary_timeline2);
    //            visualise_axis(secondary_timeline3);

    function add_background_to_axis_ticks() {
        // remove existing backgrounds 
        d3.selectAll('.black_rect_axis_text').remove();

        document.fonts.ready.then(function () {
            d3.selectAll('.axis > .tick').each(function (d, i) {
                var client_rect_dates = d3.select(this).node().lastChild.getBoundingClientRect();
                d3.select(this)
                    .insert('rect', ':first-child')
                    .attr('class', 'black_rect_axis_text')
                    .attr('x', -client_rect_dates.width / 2)
                    .attr('y', 5)
                    .attr('width', client_rect_dates.width)
                    .attr('height', client_rect_dates.height)
                    .attr('fill', '#161616');
            });
        });
    }
}

function visualise_data_as_tiles(data) {
    //order data by earliest date
    // order data by date - earliest to latest (by 'ns1:fromTime')
    function compare_dates(a, b) {
        if (a['date']['ns1:fromTime'] < b['date']['ns1:fromTime'])
            return -1;
        if (a['date']['ns1:fromTime'] > b['date']['ns1:fromTime'])
            return 1;
        return 0;
    }
    data.sort(compare_dates);

    console.log(data);

    // sort data into buckets for centuries
    var earliest_date = parseInt(data[0]['date']['ns1:fromTime'].substring(0, 2) + "00");
    var latest_date = parseInt(data[data.length - 1]['date']['ns1:fromTime'].substring(0, 2) + "00");

    var centuries_array = [];
    for (i = earliest_date; i <= latest_date; i += 100) {
        centuries_array.push({
            century: i,
            century_data: []
        });
    };

    centuries_array.forEach(function (d, i) {
        data.forEach(function (k, j) {
            if ((typeof k['date']['ns1:fromTime'] != 'undefined') && (typeof k['date']['ns1:toTime'] != 'undefined')) {
                if ((parseInt(k['date']['ns1:fromTime'].substring(0, 2) + "00") < (d.century + 100)) && (parseInt(k['date']['ns1:fromTime'].substring(0, 2) + "00") > (d.century - 1))) {
                    centuries_array[i].century_data.push(k);
                };
            }

        });
    });

    var viz = d3.select('#tile_viz_wrapper')
        .selectAll('div')
        .data(centuries_array).enter()
        .append('div')
        .attr('class', 'century_div')
        //        .style('max-width', full_timeline_width)
        .selectAll('div')
        .data(function (d) {
            return d.century_data;
        }).enter().append('div')
        .style('display', 'inline-block')
        .attr('id', function (d) {
            return d['@id'];
        })
        .attr('class', 'tile_div')
        .attr('data-title', function (d) {
            return d["ns1:itemLabel"];
        })
        .attr('data-link', function (d) {
            return d["ns1:url"];
        })
        .attr('data-date', function (d) {
            if (d.date.earliest == d.date.latest) {
                return String(d.date.earliest);
            } else {
                return String(d.date.earliest) + "-" + String(d.date.latest);
            };
        })
        .html(function (d) {
            var tile_date;
            if (d.date.earliest == d.date.latest) {
                tile_date = d.date.earliest;
            } else {
                tile_date = String(d.date.earliest) + "-" + String(d.date.latest);
            };

            return '<img style="width:150px;" src="' + d['ns1:thumbnail'].substring(0, d['ns1:thumbnail'].length - 7) + '600x600"><p class="img_caption" style="width:150px; color: white;">' + tile_date + '</p>';
        }).on("click", function (d) {
            launch_lightbox(d['ns1:thumbnail'].substring(0, d['ns1:thumbnail'].length - 7) + "1200x1200", d3.select(this));

            //                window.open(d["ns1:url"]);
        });;
}

// LIGHTBOX

function launch_lightbox(img_url, this_DOM) {
    var thumbnail = this_DOM.node();
    var img = new Image();
    img.src = img_url;
    // image dimension ratios vary, so get dimensions from img_url
    img.onload = function () {
        var lightbox_img_height = img.height;
        var lightbox_img_width = img.width;
        // code here to use the dimensions

        var pswpElement = document.querySelectorAll('.pswp')[0];

        // build items array
        var items = [
            {
                src: img_url,
                w: lightbox_img_width,
                h: lightbox_img_height,
                link: thumbnail.getAttribute('data-link'),
                title: thumbnail.getAttribute('data-title'),
                date: thumbnail.getAttribute('data-date')
    }
];
        // define options (if needed)
        var options = {
            index: 0,
            escKey: false,
            showHideOpacity: true,
            bgOpacity: 0.85,
            shareEl: false,
            getThumbBoundsFn: function (index) {
                // See Options->getThumbBoundsFn section of docs for more info
                var pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();

                return {
                    x: rect.left,
                    y: rect.top + pageYScroll,
                    w: rect.width
                };
            },
            loadingIndicatorDelay: 500,
            addCaptionHTMLFn: function (item, captionEl, isFake) {
                if (!item.title) {
                    captionEl.children[0].innerText = '';
                    return false;
                }
                captionEl.children[0].innerHTML = '<a href="' + item.link + '" target="_blank">' + item.title + '</a>, ' + item.date + '<br/>';
                return true;
            },
        };
        // Initializes and opens PhotoSwipe
        var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    }
};

// MODAL
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("Modal_Btn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}