$(function() {
    const csrf_token = $('meta[name=csrf]').attr('content');

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
            }
        }
    });

    $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 5, // Creates a dropdown of 15 years to control year,
        closeOnSelect: false, // Close upon selecting a date,
        container: undefined, // ex. 'body' will append picker to body
        today: 'Aujourd\'hui',
        clear: 'Vider',
        close: 'Ok',
        labelMonthNext: 'Mois suivant',
        labelMonthPrev: 'Mois précedant',
        labelMonthSelect: 'Selectionner un mois',
        labelYearSelect: 'Selectionner une année',
        monthsFull: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthsShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
        weekdaysFull: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        weekdaysShort: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
        weekdaysLetter: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],


    });
    $('select').material_select();
    $('.materialboxed').materialbox();
    $('.modal').modal();
    $('.collapsible').collapsible();
    $('.chips').material_chip();

    /*$('th').on('click', function() {
        console.log($(this).text())
        console.log($('td', $('#dataTable tr')[1])[10])
    })*/
    
    (function() {
        let siteInputs = ["Zone", "Unit", "LocationType", "Location"]
        let zoneInputs = siteInputs.slice(1, siteInputs.length)
        let unitInputs = siteInputs.slice(2, siteInputs.length)
        let locationTypeInputs = siteInputs.slice(3, siteInputs.length)
        let handlerArgs = [
            [$("#i-Site"), siteInputs, true],
            [$("#i-Zone"), zoneInputs, true],
            [$("#i-Unit"), unitInputs, true],
            [$("#i-LocationType"), locationTypeInputs, true],
            [$("#i-Criteria"), ["Category"], true],
            [$("#SiteID"), siteInputs, false],
            [$("#ZoneID"), zoneInputs, false],
            [$("#UnitID"), unitInputs, false],
            [$("#LocationTypeID"), locationTypeInputs, false],
            [$("#CriteriaID"), ["Category"], false]
        ]
        $.each(handlerArgs, function(key, val) {
            selectChangeHandler(val[0], val[1], val[2])
        })
    })();
    
    $('#Apply').on('click', function() {
        let value = {
            LocationID: [
                ($('#checkbox-location').prop('checked') ? 1:0),
                ($('#i-Location').val() == null) ? "":$('#i-Location').val()
            ],
            CategoryID: [
                ($('#checkbox-criteria').prop('checked') ? 1:0),
                ($('#i-Category').val() == null) ? "":$('#i-Category').val()
            ],
            Validation: [
                ($('#checkbox-criteria').prop('checked') ? 1:0),
                ($('#i-Validation').val() == null) ? "":$('#i-Validation').val()
            ],
            Comment: [
                ($('#checkbox-comment').prop('checked') ? 1:0),
                ($('#i-Comment').val() == null) ? "":$('#i-Comment').val()
            ],
            Feedback: [
                ($('#checkbox-feedback').prop('checked') ? 1:0),
                ($('#i-Feedback').val() == null) ? "":$('#i-Feedback').val()
            ]
        }

        updateData(JSON.stringify(value), 'UpdateData', window.editID)
        
        if ($('#checkbox-attachment').prop('checked')) {
            let attachments = $('#i-File')[0].files
            let deleted = new Array
            $.each($('#attachment-ul input[type=checkbox]'), function(key, val) {
                if (!($(val).prop('checked'))) {
                    let id = $(val).attr('id').split('-')[1]
                    deleted.push(id)
                }
            })
            uploadData(attachments, 'UpdateAttachment', window.editID, deleted)
        }
    })

    $('#Delete').on('click', function() {
        deleteData()
    })

    $('#Search').on('click', function() {
        let value = {
            dateFrom: $("#dateFrom").val(),
            dateTo: $("#dateTo").val(),
            SiteID: $("#SiteID").val(),
            ZoneID: $("#ZoneID").val(),
            UnitID: $("#UnitID").val(),
            LocationTypeID: $("#LocationTypeID").val(),
            LocationID: $("#LocationID").val(),
            CriteriaID: $("#CriteriaID").val(),
            CategoryID: $("#CategoryID").val(),
            Validation: $("#Validation").val()
        }
        $('#Search').addClass('disabled')
        window.tableDataQuery = JSON.stringify(value)
        getData(window.tableDataQuery, "TableData");
    })
    $('#Clear').on('click', function() {
        let defaultInputs = [$("#dateFrom"), $("#dateTo"), $("#SiteID"), $("#CriteriaID"), $("#Validation")]
        let variableInputs = ["Zone", "Unit", "LocationType", "Location", "Category"]
        $.each(defaultInputs, function(key, val) {
            val.val("")
        })
        $.each(variableInputs, function(key, val) {
            removeOptions(val, false)
        })
        $('select').material_select();
    })

    editChangeHandler($('#checkbox-location'), [$('#i-Site'), $('#i-Zone'), $('#i-Unit'), $('#i-LocationType'), $('#i-Location')])
    editChangeHandler($('#checkbox-criteria'), [$('#i-Criteria'), $('#i-Category'), $('#i-Validation')])
    editChangeHandler($('#checkbox-comment'), [$('#i-Comment')])
    editChangeHandler($('#checkbox-feedback'), [$('#i-Feedback')])
    editChangeHandler($('#checkbox-attachment'), [$('#i-File'), $('#i-File-Path')])

    $('#modal-edit').modal({
        ready: function() {
            $('#attachment-ul li').remove()
            $.each(window.attachments[window.editID], function(key, val) {
                $.each(val, function(akey, aval) {
                    let path = aval[1].split("/")
                    $('#attachment-ul').append(
                        $('<li></li>').append(
                            $('<input>').prop({
                                type: 'checkbox',
                                class: 'filled-in',
                                id: 'attach-' + aval[0],
                                checked: 'checked',
                                disabled: true
                            }),
                            $('<label></label>').prop('for', 'attach-' + aval[0]).text(path[path.length - 1])
                        )
                    )
                })
            })
            
        },
        complete: function() {
            let checkboxes = [
                $('#checkbox-location'), 
                $('#checkbox-criteria'), 
                $('#checkbox-comment'), 
                $('#checkbox-feedback'), 
                $('#checkbox-attachment')
            ]
            $.each(checkboxes, function(key, val) {
                val.prop('checked', false)
                val.trigger('change')
            })
        }
    });

    $('.page-btn').on('click', function() {
        let value = parseInt($(this).attr('value'), 10)
        let last_value = parseInt($('#pagination-ul li:nth-last-child(2) a').attr('value'), 10)
        console.log(typeof(value), last_value)

        if (value > 1) {
            $('#chevron-left').removeClass('disabled')
        } else {
            $('#chevron-left').addClass('disabled')
        }
        
        if (value < last_value) {
            $('#chevron-right').removeClass('disabled')
        } else {
            $('#chevron-right').addClass('disabled')
        }

        $('.page-btn').parent().removeClass('active')
        $(this).parent().addClass('active')
    })

});

function getData(value, field, editMode) {
    $.getJSON("/consultation/api", {
        value: value,
        field: field
    }, function(data) {
        console.log(data.result)
        if (field === "TableData") {
            $("#dataTable tbody tr").remove()
            window.attachments = {}
            window.tableData = data.result
            if (data.result.length == 0) {
                $("#dataTable tbody").append(
                    $("<tr></tr>").append(
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                        $("<td></td>").html("&nbsp;"),
                    )
                )
            } else {
                $.each(data.result.slice(0, 20), function(key, val) {
                    $("#dataTable tbody").append(
                        $("<tr></tr>").append(
                            $("<td></td>").text(val["EvaluationID"]),
                            $("<td></td>").text(val["Date"]),
                            $("<td></td>").text(val["User"]),
                            $("<td></td>").text(val["Site"]),
                            $("<td></td>").text(val["Zone"]),
                            $("<td></td>").text(val["Unit"]),
                            $("<td></td>").text(val["LocationType"]),
                            $("<td></td>").text(val["Location"]),
                            $("<td></td>").text(val["Criteria"]),
                            $("<td></td>").text(val["Category"]),
                            $("<td></td>").text(val["Validation"]),
                            $("<td></td>").text(val["Comment"]),
                            $("<td></td>").text(val["Feedback"]),
                            $("<td></td>").append(
                                $("<a></a>").attr({
                                    class: "modal-trigger",
                                    href: "#modal-image",
                                    onclick: "loadAttachments(" + val["EvaluationID"] + ")"
                                }).text("Voir")
                            ),
                            $("<td></td>").append(
                                $("<a></a>").attr({
                                    class: "modal-trigger",
                                    href: "#modal-edit",
                                    onclick: "setEditID(" + val["EvaluationID"] + ")"
                                }).append(
                                    '<i class="material-icons">&#xE254;</i>'
                                ),
                                $("<a></a>").attr({
                                    class: "modal-trigger",
                                    href: "#modal-delete",
                                    onclick: "setDeleteID(" + val["EvaluationID"] + ")"
                                }).append(
                                    '<i class="material-icons">&#xE92B;</i>'
                                )
                            )
                        )
                    )
                    window.attachments[val["EvaluationID"]] = val["Attachment"]
                });
            }
            $('#Search').removeClass('disabled')
        } else {
            removeOptions(field, editMode)
            $.each(data.result, function(key, val) {
                let text_f = val[field + "Name"]
                if (field === "Category" || field === "LocationType") {
                    text_f = val["Description"]
                }

                let inputField = $('#' + field + 'ID')
                if (editMode) {
                    inputField = $('#i-' + field)
                }
                inputField.append(
                    $("<option></option>")
                    .attr("value", val[field + "ID"])
                    .text(text_f));
            });
            $('select').material_select();
        }
    })
}

function removeOptions(field, editMode) {
    let selectObject = field
    if (editMode) {
        selectObject = $('#i-' + field)
    } else if (!(field instanceof jQuery)) {
        selectObject = $('#' + field + "ID")
    }
    selectObject[0].selectedIndex = 0
    selectObject.children("option:not(:first)").remove()
}

function loadAttachments(evaluationID) {
    let images = $("#image-attachments")
    let other = $("#other-attachments")
    images.text("")
    other.addClass("hide")
    $("img", images).remove()
    $("li", other).remove()
    $("h6", other).remove()
    if (window.attachments[evaluationID][0].length !== 0) {
        $.each(window.attachments[evaluationID][0], function(key, val) {
            images.append(
                $("<img>").attr({
                    class: "responsive-img materialboxed col s12",
                    src: val[1]
                })
            )
            $('.materialboxed').materialbox()
        })
    } else {
        if (window.attachments[evaluationID][1].length !== 0) {
            images.text("Aucune photo.")
        } else {
            images.text("Aucune pièce jointe.")
        }
    }

    if (window.attachments[evaluationID][1].length !== 0) {
        other.removeClass("hide")
        other.prepend(
            $("<h6></h6>").text("Autres pièces jointes :")
        )
        $.each(window.attachments[evaluationID][1], function(key, val) {
            let path = val[1].split("/")
            $('#other-attachments-ul').append(
                $('<li></li>').append(
                    $("<a></a>").attr({
                        href: val[1]
                    }).text(path[path.length - 1])
                ) 
            )
        })
    }
}

function selectChangeHandler(selectObject, inputs, editMode) {
    let inputArray = inputs.slice(0, inputs.length)
    selectObject.on("change", function() {
        $.each(inputArray, function(key, val) {
            removeOptions(val, editMode)
        })

        let dataValue = $(this).val()
        if (inputArray[0] == "Location") {
            let unit = $("#UnitID")
            if (editMode) {
                unit = $("#i-Unit")
            }
            let value = {
                LocationTypeID: $(this).val(),
                UnitID: unit.val()
            }
            dataValue = JSON.stringify(value)
        }
        getData(dataValue, inputArray[0], editMode)
    })
}

function editChangeHandler(checkbox, inputs) {
    checkbox.on('change', function() {
        let props = {
            disabled: true,
            required: false
        }

        if ($(this).prop('checked')) {
            props = {
                disabled: false,
                required: true
            }
        }

        let defaultInputs = ['i-Site', 'i-Criteria', 'i-Validation']
        
        $.each(inputs, function(key, val) {
            val.prop(props)
            if (props.disabled) {
                if (val.is('input, textarea') || $.inArray(val.attr('id'), defaultInputs) > -1) {
                    val.val("")
                    $('textarea').trigger('autoresize');
                } else if (val.is('select')) {
                    removeOptions(val, false)
                }
            }
        })

        if (checkbox.attr('id') === "checkbox-attachment") {
            $("#attachment-ul .filled-in").prop('disabled', props.disabled)
        }
    })
}

function setEditID(edit_id) {
    window.editID = edit_id
}

function setDeleteID(delete_id) {
    window.deleteID = delete_id
}

function updateData(value, field, edit_id) {
    $.ajax({
        url: '/consultation/api',
        type: 'POST',
        data: {
            value: value,
            field: field,
            edit_id: edit_id
        },

        success: function(response) {
            console.log(response);
            getData(window.tableDataQuery, "TableData")
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function uploadData(value, field, edit_id, deleted) {
    let formData = new FormData()
    $.each(value, function(key, val) {
        formData.append('value', val)
    })

    formData.append('field', field)
    formData.append('edit_id', edit_id)
    formData.append('deleted', deleted)
    
    $.ajax({
        url: '/consultation/api',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            console.log(response);
            getData(window.tableDataQuery, "TableData")
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function deleteData() {
    $.ajax({
        url: '/consultation/api',
        type: 'POST',
        data: {
            field: 'DeleteData',
            value: window.deleteID,
        },

        success: function(response) {
            console.log(response);
            getData(window.tableDataQuery, "TableData")
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function nextPage(value) {
    let x = 0
    let y = 20
    if (value > 0) {
        y = 20 * value
        x = y - 20
    }
    $("#dataTable tbody tr").remove()
    $.each(window.tableData.slice(x, y), function(key, val) {
        $("#dataTable tbody").append(
            $("<tr></tr>").append(
                $("<td></td>").text(val["EvaluationID"]),
                $("<td></td>").text(val["Date"]),
                $("<td></td>").text(val["User"]),
                $("<td></td>").text(val["Site"]),
                $("<td></td>").text(val["Zone"]),
                $("<td></td>").text(val["Unit"]),
                $("<td></td>").text(val["LocationType"]),
                $("<td></td>").text(val["Location"]),
                $("<td></td>").text(val["Criteria"]),
                $("<td></td>").text(val["Category"]),
                $("<td></td>").text(val["Validation"]),
                $("<td></td>").text(val["Comment"]),
                $("<td></td>").text(val["Feedback"]),
                $("<td></td>").append(
                    $("<a></a>").attr({
                        class: "modal-trigger",
                        href: "#modal-image",
                        onclick: "loadAttachments(" + val["EvaluationID"] + ")"
                    }).text("Voir")
                ),
                $("<td></td>").append(
                    $("<a></a>").attr({
                        class: "modal-trigger",
                        href: "#modal-edit",
                        onclick: "setEditID(" + val["EvaluationID"] + ")"
                    }).append(
                        '<i class="material-icons">&#xE254;</i>'
                    ),
                    $("<a></a>").attr({
                        class: "modal-trigger",
                        href: "#modal-delete",
                        onclick: "setDeleteID(" + val["EvaluationID"] + ")"
                    }).append(
                        '<i class="material-icons">&#xE92B;</i>'
                    )
                )
            )
        )
        window.attachments[val["EvaluationID"]] = val["Attachment"]
    });
}