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
        console.log(data.result)
        
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