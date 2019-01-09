var API_data = [];
kringla_ajaxCall(500, 0);

function kringla_ajaxCall(hitsPerPage, startRecord) {
    jQuery.ajax({
        url: 'http://kulturarvsdata.se/ksamsok/api?method=search&hitsPerPage=' + hitsPerPage + '&startRecord=' + startRecord + '&x-api=%22test%22&query=Porträtt%20and%20tavla%20and%20thumbnailExists=%22j%22%20and%20create_fromTime%3C=2018%20and%20create_toTime%3E=0%20and%20serviceOrganization=nomu',
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
            console.log(API_data);

            // repeat API call if hitsPerPage is below totalHits
            if ((hitsPerPage + startRecord) < data.result.totalHits) {
                kringla_ajaxCall(hitsPerPage, (startRecord + hitsPerPage + 1));
            } else {
                process_data(API_data);
            }
        }
    });
}

function process_data(x) {
    console.log(x);
    var clean_data_reconstructed = [];

    x.forEach(function (d, i) {
        var record = d[d.length - 1];
        showObject(record);

        // find and replace empty nodes (_:b keys) with matching object
        function showObject(obj) {
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
            // remove production contexts with no dates
            if (production_date.length > 1) {
                var production_hasdate = production_date.filter(obj => {
                    return ('ns1:fromTime' in obj);
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
            console.log(production_date);
        };
        data[i].date = production_date;
    });

    // remove items where date is 'FOTOGRAFERING'
    var data = data.filter(item => item.date !== undefined);

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
    console.log(centuries_array);

    centuries_array.forEach(function (d, i) {
        data.forEach(function (k, j) {
            if ((typeof k['date']['ns1:fromTime'] != 'undefined') && (typeof k['date']['ns1:toTime'] != 'undefined')){if ((parseInt(k['date']['ns1:fromTime'].substring(0, 2) + "00") < (d.century + 100)) && (parseInt(k['date']['ns1:fromTime'].substring(0, 2) + "00") > (d.century - 1))) {
                centuries_array[i].century_data.push(k);
            };}
            
        });
    });

    console.log(centuries_array);
    visualise_data(centuries_array);
}

function visualise_data(data) {
    var viz = d3.select('#viz_wrapper')
        .selectAll('div')
        .data(data).enter()
        .append('div')
        .attr('class', 'century_div')
        .selectAll('div')
        .data(function (d) {
            return d.century_data;
        }).enter().append('div')
        .style('display', 'inline-block')
        .attr('id', function (k) {
            return k['@id'];
        })
        .html(function (k) {
            var date_string = "";
            if ((typeof k['date']['ns1:toTime'] != 'undefined') && k['date']['ns1:fromTime'].substring(0, 4) !== k['date']['ns1:toTime'].substring(0, 4)) {
                date_string = k['date']['ns1:fromTime'].substring(0, 4) + '-' + k['date']['ns1:toTime'].substring(0, 4);
            } else {
                date_string = k['date']['ns1:fromTime'].substring(0, 4);
            };

            return '<a style="text-decoration:none;" href="' + k['ns1:url'] + '" target="_blank"><img style="width:150px;" src="' + k['ns1:thumbnail'].substring(0, k['ns1:thumbnail'].length - 7) + '600x600"><p class="img_caption" style="width:150px; color: white;">' + date_string + '</p></a>';
        });
}