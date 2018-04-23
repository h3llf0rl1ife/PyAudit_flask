$(function() { // On page load
    const csrf_token = $('meta[name=csrf]').attr('content');

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrf_token);
            }
        }
    });

    initMaterialize();
    searchClickHandler();
    clearClickHandler();
    deleteClickHandler();
    editChangeHandler();
    selectChangeHandler()
    applyClickHandler();
    
    $("#SiteID").trigger('change');
    $('#Search').trigger('click');
});

/****************************************************************************************************/

function getData(value, field, editMode) {
    $.getJSON("/consultation/api", {
        value: value,
        field: field
    }, function(data) {
        if (field === "TableData") {
            $("#dataTable tbody tr").remove();
            window.attachments = {};
            window.tableData = data.result;

            if (data.result.length == 0) {
                $("#dataTable tbody").append($("<tr></tr>"));
                for (let i = 1; i <= 15; i++) {
                    $("#dataTable tbody tr").append($("<td></td>").html("&nbsp;"));
                };
            } else {
                makePagination();
                nextPage(0);
                paginationClickHandler();
            };

            $('#Search').removeClass('disabled');
        } else {
            removeOptions(field, editMode);

            for (let i = 0, l = data.result.length; i < l; i++) {
                let text_f = data.result[i][field + "Name"];
                
                if (field === "Category" || field === "LocationType") {
                    text_f = data.result[i]["Description"];
                };

                let inputField = $('#' + field + 'ID');

                if (editMode) {
                    inputField = $('#i-' + field);
                };

                inputField.append(
                    $("<option></option>")
                    .attr("value", data.result[i][field + "ID"])
                    .text(text_f)
                );
            };

            $('select').material_select();
        };
    });
};

function removeOptions(field, editMode) {
    let selectObject = field;

    if (editMode) {
        selectObject = $('#i-' + field);
    } else if (!(field instanceof jQuery)) {
        selectObject = $('#' + field + "ID");
    };

    selectObject[0].selectedIndex = 0;
    selectObject.children("option:not(:first)").remove();
};

function loadAttachments(evaluationID) {
    let images = $("#image-attachments");
    let other = $("#other-attachments");

    images.text("");
    other.addClass("hide");
    $("img", images).remove();
    $("li", other).remove();
    $("h6", other).remove();

    let image_list = window.attachments[evaluationID][0];
    let other_list = window.attachments[evaluationID][1];
    let il = image_list.length;
    let ol = other_list.length;

    if (il !== 0) {
        for (let i = 0; i < il; i++) {
            images.append(
                $("<img>").attr({
                    class: "responsive-img materialboxed col s12",
                    src: image_list[i][1]
                })
            );
        };
        $('.materialboxed').materialbox();

    } else {
        if (ol !== 0) {
            images.text("Aucune photo.");
        } else {
            images.text("Aucune pièce jointe.");
        };
    };

    if (ol !== 0) {
        other.removeClass("hide");
        other.prepend(
            $("<h6></h6>").text("Autres pièces jointes :")
        );

        for (let i = 0; i < ol; i++) {
            let path = other_list[i][1].split("/")
            $('#other-attachments-ul').append(
                $('<li></li>').append(
                    $("<a></a>").attr({
                        href: other_list[i][1]
                    }).text(path[path.length - 1])
                )
            );
        };
    };
};

function selectChangeHandler() {
    let siteInputs = ["Zone", "Unit", "LocationType", "Location"];
    let zoneInputs = siteInputs.slice(1, siteInputs.length);
    let unitInputs = siteInputs.slice(2, siteInputs.length);
    let locationTypeInputs = siteInputs.slice(3, siteInputs.length);
    let selectHandlerArgs = [
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
    ];

    for (let i = 0, l = selectHandlerArgs.length; i < l; i++) {
        let selectObject = selectHandlerArgs[i][0],
            inputs = selectHandlerArgs[i][1],
            editMode = selectHandlerArgs[i][2];

        let inputArray = inputs.slice(0, inputs.length);
        
        selectObject.on("change", function() {
            for (let i = 0, l = inputArray.length; i < l; i++) {
                removeOptions(inputArray[i], editMode);
            };

            let dataValue = $(this).val()
            if (inputArray[0] == "Location") {
                let unit = $("#UnitID");

                if (editMode) {
                    unit = $("#i-Unit")
                };

                let value = {
                    LocationTypeID: $(this).val(),
                    UnitID: unit.val()
                };

                dataValue = JSON.stringify(value);
            }
            getData(dataValue, inputArray[0], editMode);
        });
    };
};

function editChangeHandler() {
    let editHandlerArgs = [
        [$('#checkbox-location'), [$('#i-Site'), $('#i-Zone'), $('#i-Unit'), $('#i-LocationType'), $('#i-Location')]],
        [$('#checkbox-criteria'), [$('#i-Criteria'), $('#i-Category'), $('#i-Validation')]],
        [$('#checkbox-comment'), [$('#i-Comment')]],
        [$('#checkbox-feedback'), [$('#i-Feedback')]],
        [$('#checkbox-attachment'), [$('#i-File'), $('#i-File-Path')]]
    ];

    $.each(editHandlerArgs, function(key, val) {
        let checkbox = val[0],
        inputs = val[1];

        checkbox.on('change', function() {
            let props = {
                disabled: true,
                required: false
            };

            if ($(this).prop('checked')) {
                props = {
                    disabled: false,
                    required: true
                };
            };

            let defaultInputs = ['i-Site', 'i-Criteria', 'i-Validation'];
            
            $.each(inputs, function(key, val) {
                val.prop(props);
                if (props.disabled) {
                    if (val.is('input, textarea') || $.inArray(val.attr('id'), defaultInputs) > -1) {
                        val.val("");
                        $('textarea').trigger('autoresize');
                    } else if (val.is('select')) {
                        removeOptions(val, false);
                    };
                };
            });

            if (checkbox.attr('id') === "checkbox-attachment") {
                $("#attachment-ul .filled-in").prop('disabled', props.disabled);
            };
        });
    });
};

function setEditID(edit_id) {
    window.editID = edit_id;
};

function setDeleteID(delete_id) {
    window.deleteID = delete_id;
};

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
            getData(window.tableDataQuery, "TableData");
        },
        error: function(error) {
            console.log(error);
        }
    });
};

function uploadData(value, field, edit_id, deleted) {
    let formData = new FormData();
    $.each(value, function(key, val) {
        formData.append('value', val);
    });

    formData.append('field', field);
    formData.append('edit_id', edit_id);
    formData.append('deleted', deleted);
    
    $.ajax({
        url: '/consultation/api',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            getData(window.tableDataQuery, "TableData")
        },
        error: function(error) {
            console.log(error);
        }
    });
};

function deleteData() {
    $.ajax({
        url: '/consultation/api',
        type: 'POST',
        data: {
            field: 'DeleteData',
            value: window.deleteID,
        },

        success: function(response) {
            getData(window.tableDataQuery, "TableData");
        },
        error: function(error) {
            console.log(error);
        }
    });
};

function makePagination() {
    let pagination = $('#pagination-ul');
    let first_child = $('li:first', pagination);
    let last_child = $('li:last-child', pagination);
    first_child.addClass('disabled');
    $('li:not(:first)', pagination).remove();
    
    for (let i = 1; i <= Math.ceil(window.tableData.length / 50); i++) {
        let li = '<li class="waves-effect"><a class="page-btn" value="' + i + '">' + i + '</a></li>';
        if (i == 1) {
            li = '<li class="waves-effect active blue-grey darken-1"><a class="page-btn" value="' + i + '">' + i + '</a></li>'
        };
        pagination.append(li);
    }

    pagination.append(last_child);

    if ($('li', pagination).length <= 3) {
        last_child.addClass('disabled');
    } else {
        last_child.removeClass('disabled');
    };
};

function nextPage(value) {
    let x = 0,
        y = 50;
    if (value > 0) {
        y = 50 * value;
        x = y - 50;
    };
    $("#dataTable tbody tr").remove();
    
    let data = window.tableData.slice(x, y);
    let columns = [
        "EvaluationID", "Date", "User", "Site", "Zone", "Unit", "LocationType",
        "Location", "Criteria", "Category", "Validation", "Comment", "Feedback"
    ];

    for (let i = 0, l = data.length; i < l; i++) {
        let tr = $("<tr></tr>");

        for (let j = 0, jl = columns.length; j < jl; j++) {
            tr.append(
                $("<td></td>").text(data[i][columns[j]])
            )
        };

        tr.append(
            $("<td></td>").append(
                $("<a></a>").attr({
                    class: "modal-trigger",
                    href: "#modal-image",
                    onclick: "loadAttachments(" + data[i]["EvaluationID"] + ")"
                }).text("Voir")
            ),
            $("<td></td>").append(
                $("<a></a>").attr({
                    class: "modal-trigger",
                    href: "#modal-edit",
                    onclick: "setEditID(" + data[i]["EvaluationID"] + ")"
                }).append(
                    '<i class="material-icons">&#xE254;</i>'
                ),
                $("<a></a>").attr({
                    class: "modal-trigger",
                    href: "#modal-delete",
                    onclick: "setDeleteID(" + data[i]["EvaluationID"] + ")"
                }).append(
                    '<i class="material-icons">&#xE92B;</i>'
                )
            )
        );
        $("#dataTable tbody").append(tr);
        window.attachments[data[i]["EvaluationID"]] = data[i]["Attachment"];
    }
};

function paginationClickHandler() {
    function getActiveAndLast() {
        let active = parseInt($('#pagination-ul li.active a.page-btn').attr('value'), 10);
        let last = parseInt($('#pagination-ul li:nth-last-child(2) a').attr('value'), 10);
        return [active, last];
    };
    
    $('#chevron-left').on('click', function() {
        let [active, last] = getActiveAndLast();

        if (active !== 1) {
            $('#pagination-ul li a[value=' + (active - 1) + ']').trigger('click');
        };
    });

    $('#chevron-right').on('click', function() {
        let [active, last] = getActiveAndLast();
        
        if (active !== last) {
            $('#pagination-ul li a[value=' + (active + 1) + ']').trigger('click');
        };
    });

    $('.page-btn').on('click', function() {
        let last = getActiveAndLast()[1];
        let active = parseInt($(this).attr('value'), 10);
        
        if (active > 1) {
            $('#chevron-left').removeClass('disabled')
        } else {
            $('#chevron-left').addClass('disabled')
        };
        
        if (active < last) {
            $('#chevron-right').removeClass('disabled')
        } else {
            $('#chevron-right').addClass('disabled')
        };

        $('.page-btn').parent().removeClass('active blue-grey darken-1');
        $(this).parent().addClass('active blue-grey darken-1');
        nextPage(active);
    });
};

function applyClickHandler() {
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
        };

        updateData(JSON.stringify(value), 'UpdateData', window.editID);
        
        if ($('#checkbox-attachment').prop('checked')) {
            let attachments = $('#i-File')[0].files;
            let deleted = new Array;
            $.each($('#attachment-ul input[type=checkbox]'), function(key, val) {
                if (!($(val).prop('checked'))) {
                    let id = $(val).attr('id').split('-')[1];
                    deleted.push(id);
                };
            });
            uploadData(attachments, 'UpdateAttachment', window.editID, deleted);
        };
    });
};

function deleteClickHandler() {
    $('#Delete').on('click', function() {
        deleteData();
    });
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
            LocationID: $("#LocationID").val(),
            CriteriaID: $("#CriteriaID").val(),
            CategoryID: $("#CategoryID").val(),
            Validation: $("#Validation").val()
        };
        $(this).addClass('disabled');
        window.tableDataQuery = JSON.stringify(value);
        getData(window.tableDataQuery, "TableData");
    });
};

function clearClickHandler() {
    $('#Clear').on('click', function() {
        let defaultInputs = [$("#dateFrom"), $("#dateTo"), $("#SiteID"), $("#CriteriaID"), $("#Validation")];
        let variableInputs = ["Zone", "Unit", "LocationType", "Location", "Category"];
        $.each(defaultInputs, function(key, val) {
            val.val("")
        });
        $.each(variableInputs, function(key, val) {
            removeOptions(val, false)
        });
        $('select').material_select();
    });
};

function initMaterialize() {
    $('.datepicker').pickadate({
        selectMonths: true,
        selectYears: 5,
        closeOnSelect: false,
        container: undefined,
        today: 'Aujourd\'hui',
        clear: 'Effacer',
        close: 'Ok',
        labelMonthNext: 'Mois suivant',
        labelMonthPrev: 'Mois précedant',
        labelMonthSelect: 'Selectionner un mois',
        labelYearSelect: 'Selectionner une année',
        monthsFull: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        monthsShort: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 
                    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
        weekdaysFull: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        weekdaysShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        weekdaysLetter: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
    });

    $('select').material_select();
    $('.materialboxed').materialbox();
    $('.modal').modal();
    $('.collapsible').collapsible();
    $('#modal-edit').modal({
        ready: function() {
            $('#attachment-ul li').remove();
            $.each(window.attachments[window.editID], function(key, val) {
                $.each(val, function(akey, aval) {
                    let path = aval[1].split("/");
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
                    );
                });
            });
        },
        complete: function() {
            let checkboxes = [
                $('#checkbox-location'), 
                $('#checkbox-criteria'), 
                $('#checkbox-comment'), 
                $('#checkbox-feedback'), 
                $('#checkbox-attachment')
            ];
            $.each(checkboxes, function(key, val) {
                val.prop('checked', false)
                val.trigger('change')
            });
        }
    });
};