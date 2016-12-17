var progress = document.getElementById('progressBarContainer');

hideProgress = function(){
    while (progress.firstChild) {
        progress.removeChild(progress.firstChild);
    }
};

renderProgress = function (){
    hideProgress();
    var progressBar = document.createElement("div");
    progressBar.id = "progressBar";
    progress.appendChild(progressBar);
};