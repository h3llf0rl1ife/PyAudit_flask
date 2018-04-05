$(function() {
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
    $('#dataTable').DataTable();
});