function kringla_ajaxCall() {

    jQuery.ajax({
        url: "https://www.europeana.eu/api/v2/search.json?wskey=o8jYoGefk&query=((DATA_PROVIDER%3A%20%22Nationalmuseum%2C%20Sweden%22)%20OR%20(DATA_PROVIDER%3A%20%22Stiftelsen%20Nordiska%20museet%22))%20AND%20(m%C3%A5leri%20OR%20m%C3%A5lning%20OR%20tavla%20OR%20miniatyrm%C3%A5lning%20OR%20painting)%20AND%20(portr%C3%A4tt%20OR%20portrait)&profile=rich&media=true",
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(data);
//            process_data(data);
        }
    });
}

kringla_ajaxCall();

function process_data(x) {
    x = x.result.records;
    var clean_data = [];
    x.forEach(function (d, i) {
        clean_data[i] = d['record']['@graph'];
    });
    console.log(clean_data);
    clean_data.forEach(function (d) {        
        d.forEach(function (j, i) {
            if (j['@type'] == "ns1:Context") {
                console.log(j["ns1:toTime"] + ", " + j["ns1:fromTime"] + ", " + j["ns1:timeText"] + ", " + j["context:Label"]);
            }else if (j['@type'] == "ns2:Context") {
                console.log(j["ns2:toTime"] + ", " + j["ns2:fromTime"] + ", " + j["ns2:timeText"] + ", " + j["context:Label"]);
            }else if (j['@type'] == ":Context") {
                console.log(j[":toTime"] + ", " + j[":fromTime"] + ", " + j[":timeText"] + ", " + j[":contextLabel"]);
            };
            if (i==(d.length - 1)){
                console.log(j);
                console.log(j["ns1:itemLabel"] + ", " + j["ns1:thumbnail"] + ", " + j["ns1:url"]);
            };
        });
    });
}