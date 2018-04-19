var chartList = new Array
var pieChartDetail = "";
var pieChart = "";
var pieChartBackupData = {};
const colors = {
    S1: "#c62828",
    S2: "#ffd600",
    S3: "#2e7d32",
    S4: "#1565c0",
    S5: "#6a1b9a"
};

$(function() {
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
        getData($(value).attr("class").replace("Zone", ""), "ZoneChart")
    })
    getData("novalue", "LineChartData");
    
    pieChart = makePieChart($("#PieChart"))

    $('#Search').on('click', function() {
        let value = {
            dateFrom: $("#dateFrom").val(),
            dateTo: $("#dateTo").val(),
            SiteID: $("#SiteID").val(),
            ZoneID: $("#ZoneID").val(),
            UnitID: $("#UnitID").val(),
            LocationTypeID: $("#LocationTypeID").val(),
            LocationID: $("#LocationID").val()
        }
        $('#Search').addClass('disabled')
        $('#Return').removeClass('show').addClass('hide')
        getData(JSON.stringify(value), "PieChartData");
    })
    $('#Clear').on('click', function() {
        $("#dateFrom").val("")
        $("#dateTo").val("")
        $("#SiteID").val("")
        removeOptions("Zone")
        removeOptions("Unit")
        removeOptions("LocationType")
        removeOptions("Location")
        $('select').material_select();
    })
    $('#Search').trigger('click')
    $('#Return').on('click', function() {
        $(this).removeClass('show').addClass('hide')
        pieChart["data"]["datasets"][0]["data"] = pieChartBackupData['data']
        pieChart["data"]["datasets"][0]["backgroundColor"] = pieChartBackupData['backgroundColor']
        pieChart.data.labels = pieChartBackupData['labels']
        pieChart.options.title.display = false
        pieChart.update()
        disableHandler()
        enableHandler()
    })
    $("#SiteID").on("change", function() {
        removeOptions("Zone")
        removeOptions("Unit")
        removeOptions("LocationType")
        removeOptions("Location")
        
        getData($(this).val(), "Zone")
    })
    
    $("#ZoneID").on("change", function() {
        removeOptions("Unit")
        removeOptions("LocationType")
        removeOptions("Location")
        
        getData($(this).val(), "Unit")
    })
    
    $("#UnitID").on("change", function() {
        removeOptions("LocationType")
        removeOptions("Location")
    
        getData($(this).val(), "LocationType")
    })
    
    $("#LocationTypeID").on("change", function() {
        removeOptions("Location")
        let value = {
            LocationTypeID: $(this).val(),
            UnitID: $("#UnitID").val()
        }
        getData(JSON.stringify(value), "Location")
    })
})


function getData(value, field) {
    $.getJSON("/dashboard/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        
        if (field === "ZoneChart") {
            var charts = makeLineChart($(".Zone" + value), data.result.ZoneName)
            chartList.push([value, charts])

        } else if (field === "LineChartData") {
            $.each(data.result, function(rkey, rvalue) {
                $.each(chartList, function(ckey, cvalue) {
                    if (rkey === cvalue[0]) {
                        let chart_one = cvalue[1][0]
                        let chart_two = cvalue[1][1]
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
                                borderColor: colors[label],
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                pointBackgroundColor: colors[label]
                            }
                            chart_one.data.datasets.push(dataset)
                            chart_two.data.datasets.push(dataset)
                        })
                        chart_one.update()
                        chart_two.update()
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
            pieChartDetail = {}
            if (!($.isEmptyObject(data.result))) {
                $.each(data.result, function(ckey, cvalue) {
                    pie_data["labels"].push(cvalue["Description"])
                    pie_data["datasets"][0]["data"].push(cvalue["Total"])
                    pie_data["datasets"][0]["backgroundColor"].push(colors[ckey])
                    pieChartDetail[cvalue["Description"]] = cvalue["Detail"]
                })
                pieChartBackupData["labels"] = pie_data["labels"].slice(0, pie_data["labels"].length)
                pieChartBackupData["data"] = pie_data["datasets"][0]["data"].slice(0, pie_data["datasets"][0]["data"].length)
                pieChartBackupData["backgroundColor"] = pie_data["datasets"][0]["backgroundColor"].slice(0, pie_data["datasets"][0]["backgroundColor"].length)
                pieChart.data = pie_data
                pieChart.options.tooltips.enabled = true
                disableHandler()
                enableHandler()
            } else {
                pieChart.data = {
                    labels: ["Aucune donnée"],
                    datasets: [{
                        data: [1],
                        backgroundColor: ["rgba(150, 150, 150, 1)"]
                    }]
                }
                pieChart.options.tooltips.enabled = false
                $('#PieChart').off('click')
            }
            pieChart.options.title.display = false
            pieChart.update()
            $('#Search').removeClass('disabled')
        } else if (field === "LocationType") {
            removeOptions(field)
            $.each(data.result, function(key, val) {
                $('#' + field + 'ID').append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(val["Description"]));
            });
            $('select').material_select();
        } else {
            removeOptions(field)
            $.each(data.result, function(key, val) {
                $('#' + field + 'ID').append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(val[field + "Name"]));
            });
            $('select').material_select();
        }
    })
}


function makeLineChart(canvas, ZoneName) {
    var charts = new Array;
    $.each(canvas, function(key, value) {
        var ctx = value.getContext('2d')
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
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1
                        }
                    }],
                    xAxes: [{
                        type: 'time',
                        position: 'bottom',
                        time: {
                            minUnit: 'day',
                            stepSize: 1
                        },
                    }]
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
                maintainAspectRatio: false
            }
        })
        charts.push(chart)
    })
    return charts
}

function makePieChart(canvas) {
    var pie_ctx = "";
    $.each(canvas, function(key, value) {
        pie_ctx = value.getContext('2d')
    })
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
    })
    return pie_chart
}

function PieClickHandler(e) {
    let firstPoint = pieChart.getElementAtEvent(e)[0];

    if (firstPoint) {
        let label = pieChart.data.labels[firstPoint._index];
        let pie_labels = []
        let pie_data = []
        
        $.each(pieChartDetail[label], function(ckey, cvalue) {
            pie_labels.push(ckey)
            pie_data.push(cvalue)
        })

        pieChart.data.labels = pie_labels.slice(0, pie_labels.length)
        pieChart["data"]["datasets"][0]["data"] = pie_data.slice(0, pie_data.length)
        pieChart.options.title.display = true
        pieChart.options.title.text = label
        pieChart.update()
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

makeParetoChart($("#ParetoChart"))