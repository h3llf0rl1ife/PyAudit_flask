$(function() {
    window.colors = {
        S1: "#c62828",
        S2: "#ffd600",
        S3: "#2e7d32",
        S4: "#1565c0",
        S5: "#6a1b9a"
    };
    window.pieChartBackupData = {};
    window.chartList = new Array;
    $('select').material_select();
    $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 5, // Creates a dropdown of 15 years to control year,
        closeOnSelect: false, // Close upon selecting a date,
        container: undefined, // ex. 'body' will append picker to body
        today: 'Aujourd\'hui',
        clear: 'Effacer',
        close: 'Ok',
        labelMonthNext: 'Mois suivant',
        labelMonthPrev: 'Mois précedant',
        labelMonthSelect: 'Selectionner un mois',
        labelYearSelect: 'Selectionner une année',
        monthsFull: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthsShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
        weekdaysFull: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        weekdaysShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        weekdaysLetter: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    });

    $.each($("#LineCharts canvas"), function(key, value) {
        getData($(value).attr("id").replace("Zone", ""), "ZoneChart")
    })

    getData("novalue", "LineChartData");
    
    makePieChart();
    mapOpenHandler();

    returnClickHandler()
    selectChangeHandler();
    clearClickHandler();
    searchClickHandler();

    $("#SiteID").trigger('change')
    $('#Search').trigger('click')
});

function getData(value, field) {
    $.getJSON("/dashboard/api", {
        value: value,
        field: field
    }, function(data) {
        if (field === "ZoneChart") {
            let charts_ = makeLineChart($("#Zone" + value), data.result.ZoneName)
            window.chartList.push([value, charts_])

        } else if (field === "LineChartData") {
            $.each(data.result, function(rkey, rvalue) {
                $.each(window.chartList, function(ckey, cvalue) {
                    if (rkey === cvalue[0]) {
                        let chart = cvalue[1][0]
                        //let chart_two = cvalue[1][1]
                        $.each(rvalue, function(skey, svalue) {
                            let label = skey
                            let data = new Array
                            $.each(svalue, function(dkey, dvalue) {
                                let point = {
                                    t: new Date(dkey),
                                    y: dvalue
                                }
                                data.push(point)
                            })
                            let dataset = {
                                label: label,
                                data: data,
                                borderWidth: 2,
                                borderColor: window.colors[label],
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                pointBackgroundColor: window.colors[label]
                            }
                            chart.data.datasets.push(dataset)
                            //chart_two.data.datasets.push(dataset)
                        })
                        chart.update()
                        //chart_two.update()
                    }
                })
            })
        } else if (field === "PieChartData") {
            let pie_data = {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: []
                }]
            }
            window.pieChartDetail = {}
            if (!($.isEmptyObject(data.result))) {
                $.each(data.result, function(ckey, cvalue) {
                    pie_data["labels"].push(cvalue["Description"])
                    pie_data["datasets"][0]["data"].push(cvalue["Total"])
                    pie_data["datasets"][0]["backgroundColor"].push(window.colors[ckey])
                    pieChartDetail[cvalue["Description"]] = cvalue["Detail"]
                })
                window.pieChartBackupData["labels"] = pie_data["labels"].slice(0, pie_data["labels"].length)
                window.pieChartBackupData["data"] = pie_data["datasets"][0]["data"].slice(0, pie_data["datasets"][0]["data"].length)
                window.pieChartBackupData["backgroundColor"] = pie_data["datasets"][0]["backgroundColor"].slice(0, pie_data["datasets"][0]["backgroundColor"].length)
                window.pieChart.data = pie_data
                window.pieChart.options.tooltips.enabled = true
                disableHandler()
                enableHandler()
            } else {
                window.pieChart.data = {
                    labels: ["Aucune donnée"],
                    datasets: [{
                        data: [1],
                        backgroundColor: ["rgba(150, 150, 150, 1)"]
                    }]
                }
                window.pieChart.options.tooltips.enabled = false
                $('#PieChart').off('click')
            }
            window.pieChart.options.title.display = false
            window.pieChart.update()
            $('#Search').removeClass('disabled')
        } else {
            removeOptions(field);

            for (let i = 0, l = data.result.length; i < l; i++) {
                let text_f = data.result[i][field + "Name"];
                
                if (field === "Category" || field === "LocationType") {
                    text_f = data.result[i]["Description"];
                };

                let inputField = $('#' + field + 'ID');

                inputField.append(
                    $("<option></option>")
                    .attr("value", data.result[i][field + "ID"])
                    .text(text_f)
                );
            };

            $('select').material_select();
        }
    })
}


function makeLineChart(canvas, ZoneName) {
    var charts = new Array;
    let ctx = canvas[0].getContext('2d')
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            title: {
                display: false,
                position: 'top',
                text: ZoneName
            },
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Nombre d\'anomalies'
                    },
                    ticks: {
                        beginAtZero: true,
                        stepSize: 1
                    },
                    drawBorder: true
                }],
                xAxes: [{
                    type: 'time',
                    position: 'bottom',
                    time: {
                        displayFormats: {
                            day: 'DD/MM'
                        },
                        minUnit: 'day',
                    //    stepSize: 1
                    },
                    ticks: {
                        source: 'data'
                    },
                    distribution: 'series'
                }],
            },
            legend: {
                display: true,
                position: 'top'
            },
            elements: {
                line: {
                    tension: 0,
                }
            },
            maintainAspectRatio: false,
            responsiveAnimationDuration: 0,
            hover: {
                mode: 'nearest'
            }
        }
    })
    charts.push(chart)
    return charts
}

function makePieChart() {
    let pie_ctx = $("#PieChart")[0].getContext('2d');

    let pie_chart = new Chart(pie_ctx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        },
        options: {
            title: {
                  display: false,
                  position: 'top',
                  text: ''
            },
            legend: {
                position: "top",
            },
            animation: {
                animateRotate: false
            },
            maintainAspectRatio: false
        }
    });
    window.pieChart = pie_chart;
}

function PieClickHandler(e) {
    let firstPoint = window.pieChart.getElementAtEvent(e)[0];

    if (firstPoint) {
        let label = window.pieChart.data.labels[firstPoint._index];
        let pie_labels = []
        let pie_data = []
        
        $.each(pieChartDetail[label], function(ckey, cvalue) {
            pie_labels.push(ckey)
            pie_data.push(cvalue)
        })

        window.pieChart.data.labels = pie_labels.slice(0, pie_labels.length)
        window.pieChart["data"]["datasets"][0]["data"] = pie_data.slice(0, pie_data.length)
        window.pieChart.options.title.display = true
        window.pieChart.options.title.text = label
        window.pieChart.update()
        disableHandler()
        $('#Return').removeClass('hide').addClass('show')
    }
}

function enableHandler() {
    $('#PieChart').on('click', function(evt) {
        PieClickHandler(evt)
    })
}

function disableHandler() {
    $('#PieChart').off('click')
}

function removeOptions(field) {
    $('#' + field + "ID")[0].selectedIndex = 0
    $('#' + field + "ID").children("option:not(:first)").remove()
}

function returnClickHandler() {
    $('#Return').on('click', function() {
        $(this).removeClass('show').addClass('hide');
        window.pieChart["data"]["datasets"][0]["data"] = window.pieChartBackupData['data'];
        window.pieChart["data"]["datasets"][0]["backgroundColor"] = window.pieChartBackupData['backgroundColor'];
        window.pieChart.data.labels = window.pieChartBackupData['labels'];
        window.pieChart.options.title.display = false;
        window.pieChart.update();
        disableHandler();
        enableHandler();
    })
};

function searchClickHandler() {
    $('#Search').on('click', function() {
        let value = {
            dateFrom: $("#dateFrom").val(),
            dateTo: $("#dateTo").val(),
            SiteID: $("#SiteID").val(),
            ZoneID: $("#ZoneID").val(),
            UnitID: $("#UnitID").val(),
            LocationTypeID: $("#LocationTypeID").val(),
            LocationID: $("#LocationID").val()
        };
        $(this).addClass('disabled');
        window.pieDataQuery = JSON.stringify(value);
        getData(window.pieDataQuery, "PieChartData");
    });
};

function clearClickHandler() {
    $('#Clear').on('click', function() {
        let defaultInputs = [$("#dateFrom"), $("#dateTo"), $("#SiteID")];
        let variableInputs = ["Zone", "Unit", "LocationType", "Location"];
        $.each(defaultInputs, function(key, val) {
            val.val("")
        });
        $.each(variableInputs, function(key, val) {
            removeOptions(val)
        });
        $('select').material_select();
    });
};

function selectChangeHandler() {
    let siteInputs = ["Zone", "Unit", "LocationType", "Location"];
    let zoneInputs = siteInputs.slice(1, siteInputs.length);
    let unitInputs = siteInputs.slice(2, siteInputs.length);
    let locationTypeInputs = siteInputs.slice(3, siteInputs.length);
    let selectHandlerArgs = [
        [$("#SiteID"), siteInputs],
        [$("#ZoneID"), zoneInputs],
        [$("#UnitID"), unitInputs],
        [$("#LocationTypeID"), locationTypeInputs]
    ];

    for (let i = 0, l = selectHandlerArgs.length; i < l; i++) {
        let selectObject = selectHandlerArgs[i][0],
            inputs = selectHandlerArgs[i][1];

        let inputArray = inputs.slice(0, inputs.length);
        
        selectObject.on("change", function() {
            for (let i = 0, l = inputArray.length; i < l; i++) {
                removeOptions(inputArray[i]);
            };

            let dataValue = $(this).val()
            if (inputArray[0] == "Location") {
                let unit = $("#UnitID");

                let value = {
                    LocationTypeID: $(this).val(),
                    UnitID: unit.val()
                };

                dataValue = JSON.stringify(value);
            }
            getData(dataValue, inputArray[0]);
        });
    };
};

function makeParetoChart(canvas) {
    var pareto_ctx = "";
    $.each(canvas, function(key, value) {
        pareto_ctx = value.getContext('2d')
    })
    let pareto_chart = new Chart(pareto_ctx, {
        type:"bar",
        data: {
            labels: ["S1", "S2", "S3", "S4", "S5"], // categories
            datasets: [
                {
                    label: "Bar Dataset",
                    data: [66,50,40,24,20],
                    borderColor: "rgb(255, 99, 132)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    yAxisID: 'original'
                }, {
                    label: "Line Dataset",
                    data: [33,58,78,90,100],
                    type:"line",
                    fill: false,
                    borderColor: "rgb(54, 162, 235)",
                    yAxisID: 'test'
                }
            ]
        },
        options: {
            scales: {
                yAxes: [{
                    id: 'original',
                    type: 'linear',
                    ticks: {
                        beginAtZero: true
                    }
                },{
                    id: 'test',
                    type: 'linear',
                    ticks: {
                        beginAtZero: true
                    },
                    position: 'right'
                }]
            }
        }
    })
}

//makeParetoChart($("#ParetoChart"))
function mapOpenHandler() {
    $('.activator').on('click', function() {
        let ZoneID = $(this).attr('id').split('-')[1];
        if (window['map' + ZoneID + 'init'] != null) {
            window['map' + ZoneID + 'init'].remove()
        }
        window['map' + ZoneID + 'init'] = null;
        
          let geojson_data = {
            "type": "FeatureCollection",
            "name": "COPAG_Polygon",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            "features": [
            { "type": "Feature", "properties": { "id": 1, "Zone": "OUEST", "ZoneID": 4 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.79134691000599, 30.510241444922194 ], [ -8.791251814754283, 30.51001552140443 ], [ -8.791551508880879, 30.50992117956033 ], [ -8.791571680600937, 30.509891387380009 ], [ -8.791649485806879, 30.509866560556112 ], [ -8.791707119292763, 30.509993177291733 ], [ -8.792231584014305, 30.509831802991997 ], [ -8.792352614334661, 30.510052761580855 ], [ -8.792450591260662, 30.510025452119557 ], [ -8.792565858232429, 30.510301029059168 ], [ -8.792629255066901, 30.510462402580128 ], [ -8.79265519013555, 30.510462402580128 ], [ -8.792701296924255, 30.510589018539832 ], [ -8.792822327244609, 30.510554261233981 ], [ -8.792701296924255, 30.510301029059168 ], [ -8.792525514792311, 30.509881456651215 ], [ -8.792493816375075, 30.509799528099901 ], [ -8.792577384929606, 30.509769735882315 ], [ -8.792565858232429, 30.509710151419743 ], [ -8.792675361855608, 30.509677876487267 ], [ -8.792660953484138, 30.509605878522397 ], [ -8.792790628827374, 30.509566155484467 ], [ -8.792816563896023, 30.509588499695301 ], [ -8.792957765936439, 30.509551259341045 ], [ -8.792989464353674, 30.509588499695301 ], [ -8.79317965485709, 30.509543811268493 ], [ -8.793502402378037, 30.510166964699618 ], [ -8.793597497629746, 30.510387922526821 ], [ -8.793675302835689, 30.510566674558927 ], [ -8.793629196046982, 30.510626258496597 ], [ -8.792606201672546, 30.510797562114014 ], [ -8.791975115002122, 30.510919212325707 ], [ -8.791371352232748, 30.511026788752709 ], [ -8.791316480971597, 30.510900396869566 ], [ -8.791261429512572, 30.510778296537854 ], [ -8.79118449920986, 30.510593775656474 ], [ -8.791089367248922, 30.51035518400726 ], [ -8.79107627123231, 30.510315856563377 ], [ -8.79134691000599, 30.510241444922194 ] ] ] } },
            { "type": "Feature", "properties": { "id": 2, "Zone": "OUEST", "ZoneID": 4 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.792807918873141, 30.50872451980387 ], [ -8.793026926119499, 30.509235957103545 ], [ -8.792663835158432, 30.509355126573347 ], [ -8.792439064563485, 30.508838724482693 ], [ -8.792807918873141, 30.50872451980387 ] ] ] } },
            { "type": "Feature", "properties": { "id": 3, "Zone": "OUEST", "ZoneID": 4 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.792422238804665, 30.508616309773554 ], [ -8.79228996654979, 30.508309114020228 ], [ -8.792232456873757, 30.508239747102898 ], [ -8.792140441392107, 30.508056420011744 ], [ -8.792100184618885, 30.508056420011744 ], [ -8.792048425910455, 30.507957324142897 ], [ -8.791605601405008, 30.508076239173409 ], [ -8.791513585923358, 30.507922640564935 ], [ -8.791358309798071, 30.507977143324752 ], [ -8.791139773029148, 30.507536165573597 ], [ -8.7910535085151, 30.507318153362394 ], [ -8.791605601405008, 30.507119960018976 ], [ -8.792077180748471, 30.506971314746298 ], [ -8.792422238804665, 30.507754177296022 ], [ -8.792738542022841, 30.508517214475297 ], [ -8.792422238804665, 30.508616309773554 ] ] ] } },
            { "type": "Feature", "properties": { "id": 4, "Zone": "EST", "ZoneID": 3 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.791371352232757, 30.511026788752684 ], [ -8.790540640643078, 30.51116971988036 ], [ -8.789233363899051, 30.511353348793115 ], [ -8.788454681664563, 30.509663949713921 ], [ -8.78848025881825, 30.509637017027124 ], [ -8.788494468348077, 30.509622326467557 ], [ -8.789250415334841, 30.509377483481096 ], [ -8.789321462983976, 30.509426452127698 ], [ -8.789372617291349, 30.509521940917676 ], [ -8.789707962195251, 30.510246673292361 ], [ -8.789668175511737, 30.51027605422064 ], [ -8.789750590784731, 30.510444994385942 ], [ -8.789940998484404, 30.510388681030133 ], [ -8.789955208014232, 30.510410716694988 ], [ -8.790458225370086, 30.510241776470121 ], [ -8.790560533984838, 30.51045478800971 ], [ -8.790745257872581, 30.510410716694988 ], [ -8.790674210223447, 30.510227086001912 ], [ -8.791009555127351, 30.510126701076413 ], [ -8.79107627123231, 30.510315856563377 ], [ -8.791089367248922, 30.510355184007253 ], [ -8.791184499209848, 30.510593775656488 ], [ -8.791261429512573, 30.510778296537854 ], [ -8.791316480971597, 30.510900396869545 ], [ -8.791371352232757, 30.511026788752684 ] ] ] } },
            { "type": "Feature", "properties": { "id": 5, "Zone": "EST", "ZoneID": 3 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.788395001639293, 30.509455833303843 ], [ -8.787900510001334, 30.508388311538905 ], [ -8.788736030355125, 30.508094496152339 ], [ -8.789230521993085, 30.509162021143009 ], [ -8.788395001639293, 30.509455833303843 ] ] ] } },
            { "type": "Feature", "properties": { "id": 6, "Zone": "EST", "ZoneID": 3 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.788521466454748, 30.509550709957818 ], [ -8.788484521677201, 30.509565400528214 ], [ -8.788458944523514, 30.509518880380998 ], [ -8.788507256924923, 30.509506638233297 ], [ -8.788521466454748, 30.509550709957818 ] ] ] } },
            { "type": "Feature", "properties": { "id": 7, "Zone": "CENTRE", "ZoneID": 2 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.789920062493515, 30.510201164762684 ], [ -8.789893958832874, 30.510186171884193 ], [ -8.78980404622399, 30.510018751250584 ], [ -8.789641623446656, 30.509628934926912 ], [ -8.789525607177131, 30.50935656233737 ], [ -8.78937188562001, 30.509006724864516 ], [ -8.789174657961818, 30.508566927398554 ], [ -8.789192060402245, 30.508521948000137 ], [ -8.790262310488615, 30.508174606389421 ], [ -8.790230406014496, 30.508077150606685 ], [ -8.790372525944663, 30.508027173244312 ], [ -8.790398629605306, 30.508077150606685 ], [ -8.790482741400712, 30.508049663060557 ], [ -8.790433434486165, 30.507927218442514 ], [ -8.791094727222458, 30.50770481863988 ], [ -8.79124554837284, 30.508009681161422 ], [ -8.791297755694128, 30.507997186814563 ], [ -8.791413771963651, 30.508232080266787 ], [ -8.791451477251249, 30.508232080266787 ], [ -8.791439875624295, 30.508199595035933 ], [ -8.791825629720467, 30.508077150606685 ], [ -8.791863335008061, 30.508097141544447 ], [ -8.791961948837159, 30.508059658532787 ], [ -8.792025757785398, 30.508054660796798 ], [ -8.792077965106685, 30.508182102984055 ], [ -8.792011255751706, 30.50820959049274 ], [ -8.792037359412351, 30.508272062074489 ], [ -8.792179479342519, 30.508232080266787 ], [ -8.792336101306377, 30.508599412506687 ], [ -8.792347702933331, 30.508639394163342 ], [ -8.792330300492901, 30.508726853979962 ], [ -8.792379607407449, 30.508834304504123 ], [ -8.792347702933331, 30.50883930220002 ], [ -8.792579735472382, 30.509351564668048 ], [ -8.789920062493515, 30.510201164762684 ] ] ] } },
            { "type": "Feature", "properties": { "id": 8, "Zone": "ABORDS VOIRIES", "ZoneID": 1 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.791886283117641, 30.512569575536066 ], [ -8.792142054654516, 30.513073934855729 ], [ -8.790334602460598, 30.513759467599808 ], [ -8.79035733770832, 30.513803537396555 ], [ -8.790255029093569, 30.513837813891328 ], [ -8.790067463299863, 30.513876987013397 ], [ -8.790027676616347, 30.513857400454334 ], [ -8.789953787061251, 30.513597878174146 ], [ -8.789891265130015, 30.513431391818298 ], [ -8.789726434584027, 30.512667509589257 ], [ -8.790118617607236, 30.51251571176476 ], [ -8.791283799053002, 30.512114180892823 ], [ -8.791232644745628, 30.512006452815776 ], [ -8.791357688608098, 30.51195258873247 ], [ -8.791329269548447, 30.511874240921689 ], [ -8.791329269548447, 30.511786099559082 ], [ -8.791369056231961, 30.511776306069418 ], [ -8.791357688608098, 30.511668577617968 ], [ -8.791533886777945, 30.511644093862365 ], [ -8.791448629598989, 30.511222972300803 ], [ -8.791545254401807, 30.511198488432964 ], [ -8.79167598207621, 30.51116421100765 ], [ -8.791886283117641, 30.511154417455341 ], [ -8.792119319406796, 30.511115243236233 ], [ -8.792204576585753, 30.511115243236233 ], [ -8.792369407131739, 30.511634300358388 ], [ -8.79247171574649, 30.511928105048391 ], [ -8.79248308337035, 30.511991762614187 ], [ -8.792574024361238, 30.51237860384861 ], [ -8.791886283117641, 30.512569575536066 ] ] ] } },
            { "type": "Feature", "properties": { "id": 9, "Zone": "ABORDS VOIRIES", "ZoneID": 1 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.787651843229373, 30.515140311737287 ], [ -8.788413474028069, 30.514582100511646 ], [ -8.788930700913749, 30.515096242546552 ], [ -8.78894206853761, 30.515130518585526 ], [ -8.788896598042164, 30.515213760344153 ], [ -8.788629458881429, 30.515409623024443 ], [ -8.788515782642818, 30.515487967986058 ], [ -8.788225908234359, 30.515703416304945 ], [ -8.787651843229373, 30.515140311737287 ] ] ] } },
            { "type": "Feature", "properties": { "id": 10, "Zone": "ABORDS VOIRIES", "ZoneID": 1 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.791005292268403, 30.507503802115711 ], [ -8.790914351277515, 30.507572359535121 ], [ -8.790695524518188, 30.507645813859416 ], [ -8.790547745407993, 30.507694783378113 ], [ -8.790510800630445, 30.507726613552052 ], [ -8.790124301419167, 30.507841691786265 ], [ -8.790021992804416, 30.507628674522032 ], [ -8.790081672829688, 30.5076017412715 ], [ -8.79009872426548, 30.507584601926347 ], [ -8.790485223476757, 30.507452384019444 ], [ -8.790934244619272, 30.507317717447961 ], [ -8.791005292268403, 30.507503802115711 ] ] ] } },
            { "type": "Feature", "properties": { "id": 11, "Zone": "ABORDS VOIRIES", "ZoneID": 1 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ -8.79317965485709, 30.509543811268493 ], [ -8.792989464353674, 30.509588499695301 ], [ -8.792957765936439, 30.509551259341045 ], [ -8.792816563896023, 30.509588499695301 ], [ -8.792790628827374, 30.509566155484467 ], [ -8.792660953484138, 30.509605878522397 ], [ -8.792675361855608, 30.509677876487267 ], [ -8.792565858232429, 30.509710151419743 ], [ -8.792577384929606, 30.509769735882315 ], [ -8.792493816375075, 30.509799528099901 ], [ -8.792525514792311, 30.509881456651215 ], [ -8.792701296924255, 30.510301029059168 ], [ -8.792822327244609, 30.510554261233981 ], [ -8.792701296924255, 30.510589018539832 ], [ -8.79265519013555, 30.510462402580128 ], [ -8.792629255066901, 30.510462402580128 ], [ -8.792565858232429, 30.510301029059168 ], [ -8.792450591260662, 30.510025452119557 ], [ -8.792352614334661, 30.510052761580855 ], [ -8.792231584014305, 30.509831802991997 ], [ -8.791707119292763, 30.509993177291733 ], [ -8.791649485806879, 30.509866560556112 ], [ -8.791571680600937, 30.509891387380009 ], [ -8.791551508880879, 30.50992117956033 ], [ -8.791251814754283, 30.51001552140443 ], [ -8.79134691000599, 30.510241444922194 ], [ -8.79107627123231, 30.510315856563377 ], [ -8.791009555127351, 30.510126701076413 ], [ -8.790674210223447, 30.510227086001912 ], [ -8.790745257872581, 30.510410716694988 ], [ -8.790560533984838, 30.51045478800971 ], [ -8.790458225370086, 30.510241776470121 ], [ -8.789955208014232, 30.510410716694988 ], [ -8.789940998484404, 30.510388681030133 ], [ -8.789750590784731, 30.510444994385942 ], [ -8.789668175511737, 30.51027605422064 ], [ -8.789707962195251, 30.510246673292361 ], [ -8.789372617291349, 30.509521940917676 ], [ -8.789321462983976, 30.509426452127698 ], [ -8.789250415334841, 30.509377483481096 ], [ -8.788494468348077, 30.509622326467557 ], [ -8.788454681664547, 30.509663949713932 ], [ -8.788395001639293, 30.509455833303843 ], [ -8.789230521993085, 30.509162021143009 ], [ -8.788736030355125, 30.508094496152339 ], [ -8.789096203611239, 30.507964319077622 ], [ -8.789255350345339, 30.508324243285767 ], [ -8.790198863126058, 30.508035324639142 ], [ -8.790124301419167, 30.507841691786265 ], [ -8.790510800630445, 30.507726613552052 ], [ -8.790547745407993, 30.507694783378113 ], [ -8.790695524518188, 30.507645813859416 ], [ -8.790914351277515, 30.507572359535121 ], [ -8.791005292268403, 30.507503802115711 ], [ -8.790948698763261, 30.507355575092284 ], [ -8.7910535085151, 30.507318153362394 ], [ -8.791139773029148, 30.507536165573597 ], [ -8.791358309798071, 30.507977143324752 ], [ -8.791513585923358, 30.507922640564935 ], [ -8.791605601405008, 30.508076239173409 ], [ -8.792048425910455, 30.507957324142897 ], [ -8.792100184618885, 30.508056420011744 ], [ -8.792140441392107, 30.508056420011744 ], [ -8.792232456873757, 30.508239747102898 ], [ -8.79228996654979, 30.508309114020228 ], [ -8.792422238804665, 30.508616309773554 ], [ -8.792738542022841, 30.508517214475297 ], [ -8.792807918873141, 30.50872451980387 ], [ -8.792439064563485, 30.508838724482693 ], [ -8.792663835158432, 30.509355126573347 ], [ -8.793026926119499, 30.509235957103545 ], [ -8.79317965485709, 30.509543811268493 ] ], [ [ -8.789920062493515, 30.510201164762684 ], [ -8.792579735472382, 30.509351564668048 ], [ -8.792347702933331, 30.50883930220002 ], [ -8.792379607407449, 30.508834304504123 ], [ -8.792330300492901, 30.508726853979962 ], [ -8.792347702933331, 30.508639394163342 ], [ -8.792336101306377, 30.508599412506687 ], [ -8.792179479342519, 30.508232080266787 ], [ -8.792037359412351, 30.508272062074489 ], [ -8.792011255751706, 30.50820959049274 ], [ -8.792077965106685, 30.508182102984055 ], [ -8.792025757785398, 30.508054660796798 ], [ -8.791961948837159, 30.508059658532787 ], [ -8.791863335008061, 30.508097141544447 ], [ -8.791825629720467, 30.508077150606685 ], [ -8.791439875624295, 30.508199595035933 ], [ -8.791451477251249, 30.508232080266787 ], [ -8.791413771963651, 30.508232080266787 ], [ -8.791297755694128, 30.507997186814563 ], [ -8.79124554837284, 30.508009681161422 ], [ -8.791094727222458, 30.50770481863988 ], [ -8.790433434486165, 30.507927218442514 ], [ -8.790482741400712, 30.508049663060557 ], [ -8.790398629605306, 30.508077150606685 ], [ -8.790372525944663, 30.508027173244312 ], [ -8.790230406014496, 30.508077150606685 ], [ -8.790262310488615, 30.508174606389421 ], [ -8.789192060402245, 30.508521948000137 ], [ -8.789174657961818, 30.508566927398554 ], [ -8.78937188562001, 30.509006724864516 ], [ -8.789525607177131, 30.50935656233737 ], [ -8.789641623446656, 30.509628934926912 ], [ -8.78980404622399, 30.510018751250584 ], [ -8.789893958832874, 30.510186171884193 ], [ -8.789920062493515, 30.510201164762684 ] ], [ [ -8.788521466454748, 30.509550709957818 ], [ -8.788507256924923, 30.509506638233297 ], [ -8.788458944523514, 30.509518880380998 ], [ -8.788484521677201, 30.509565400528214 ], [ -8.788521466454748, 30.509550709957818 ] ] ] } }
            ]
          };
      
          let osmUrl='http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png';
          let osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
          let osm = new L.TileLayer(osmUrl, {minZoom: 3, maxZoom: 18, attribution: osmAttrib});
          let copag = L.geoJSON(geojson_data, {
            onEachFeature: function(feature, layer) {
              bindTooltips(feature, layer)
            }
          });
      
          window['map' + ZoneID + 'init'] = L.map('map' + ZoneID).setView([30.5090965, -8.7930388,17], 14);
          
          let map = window['map' + ZoneID + 'init'];
          map.addLayer(osm);
          
          map.whenReady(function() {
            copag.addTo(map);
            setLayerColor(copag, ZoneID);
            
            setTimeout(function() { map.invalidateSize()}, 400);
            map.flyToBounds(
                copag.getBounds()
            );
            map.setView([30.5106537,-8.7893274], 15);
          })
        
    })
    
    function setLayerColor(Layer, ZoneID) {
        Layer.eachLayer(function(layer) {
        let color = {weight: 0.25, color: 'black', fillColor: 'grey', fillOpacity: 0.8};
    
        if (ZoneID == layer.feature.properties.ZoneID) {
            color = {weight: 0.25, color: 'black', fillColor: 'red', fillOpacity: 0.8}
        }
        layer.setStyle(color);
        })
    }
        
    function bindTooltips(feature, layer) {
        if (window['MapData'] == null) {
            $.getJSON('/dashboard/api', {
                field: 'Zone',
                value: '1'
            }, function(data) {
                for (let i = 0, l = data.result.length; i < l; i++) {
                    if (feature.properties.ZoneID == data.result[i]["ZoneID"]) {
                        layer.bindTooltip(data.result[i]["ZoneName"])
                    }
                }
            })
        }
    }
}
