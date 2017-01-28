/**
 * Created by chdallago on 24/01/2017.
 */

if (window.File && window.FileReader && window.FileList && window.Blob) {
    console.log('The File APIs are fully supported by your browser.');
} else {
    console.log('The File APIs are not fully supported by your browser.');
    alert("Sorry. Your browser is not compatible with this application. Please change browser.");
    window.location.replace('/');
}

$('.ui.form').form({
    fields: {
        cellLine : 'empty',
        source   : 'empty'
    },
    onSuccess: function(fields){
        console.log(fields);
        console.log(this);
        return false;
    }
});

$('.ui.checkbox')
    .checkbox()
;