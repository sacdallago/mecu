FullscreenHelper = {};

FullscreenHelper.drawPPITable = (theadIdentifier, tbodyIdentifier, data, relativeCorrelation, MAX_ROW_COLS_PPI_TABLE) => {
    const pPlusE = (obj, id) => obj[id]+`-`+obj[id+`_experiment`];
    const extractE = (obj) => {
        return obj.split(`-`)[1];
    };

    const start = new Date();

    const thead = document.getElementById(theadIdentifier);
    while (thead.firstChild) {
        thead.removeChild(thead.firstChild);
    }
    const tbody = document.getElementById(tbodyIdentifier);
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }

    const proteinMap = new Map();
    data.forEach(p => {
        const id1 = pPlusE(p,`interactor1`);
        const id2 = pPlusE(p,`interactor2`);
        if(proteinMap.has(id1)) {
            proteinMap.get(id1).set(id2, p);
        } else {
            const m = new Map();
            m.set(id2, p);
            proteinMap.set(id1, m);
        }
        if(proteinMap.has(id2)) {
            proteinMap.get(id2).set(id1, p);
        } else {
            const m = new Map();
            m.set(id1, p);
            proteinMap.set(id2, m);
        }
    });
    let proteinArray = Array.from( proteinMap.entries() ).map(a => a[0]);

    // sort the table rows/columns by experiment
    proteinArray.sort((a,b) => {
        let tmp1 = a.split(`-`).map(t => t.trim());
        let tmp2 = b.split(`-`).map(t => t.trim());
        if(parseInt(tmp1[1]) < parseInt(tmp2[1])) return -1;
        if(parseInt(tmp1[1]) > parseInt(tmp2[1])) return 1;
        if(parseInt(tmp1[0]) < parseInt(tmp2[0])) return -1;
        if(parseInt(tmp1[0]) > parseInt(tmp2[0])) return 1;
        return 0;
    });

    // only show MAX_ROW_COLS_PPI_TABLE
    if(MAX_ROW_COLS_PPI_TABLE && proteinArray.length > MAX_ROW_COLS_PPI_TABLE) {
        proteinArray = proteinArray.slice(0,MAX_ROW_COLS_PPI_TABLE);
    }

    // popuplate header
    const trhead = document.createElement(`tr`);
    trhead.appendChild(document.createElement(`th`));
    proteinArray.map(p => {
        const th = document.createElement(`th`);
        th.setAttribute(`style`, `background-color: ${HelperFunctions.stringToColor(extractE(p)+`000`)}`);
        const text = document.createTextNode(p);
        th.appendChild(text);
        trhead.appendChild(th);
    });
    thead.appendChild(trhead);

    // find out what's min and max of all correlations to be shown
    const minMaxCorr = {min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER};
    if(relativeCorrelation) {
        proteinArray.forEach(p1 => {
            proteinArray.forEach(p2 => {
                if(proteinMap.get(p1).has(p2)) {
                    if(proteinMap.get(p1).get(p2).correlation !== null && proteinMap.get(p1).get(p2).correlation < minMaxCorr.min) minMaxCorr.min = proteinMap.get(p1).get(p2).correlation;
                    if(proteinMap.get(p1).get(p2).correlation !== null && proteinMap.get(p1).get(p2).correlation > minMaxCorr.max) minMaxCorr.max = proteinMap.get(p1).get(p2).correlation;
                }
            });
        });
    }

    const process = (i) => {

        const row = document.createElement(`tr`);
        const td = document.createElement(`td`);
        td.setAttribute(`style`, `background-color: ${HelperFunctions.stringToColor(extractE(proteinArray[i])+`000`)}`);
        const text = document.createTextNode(proteinArray[i]);
        td.appendChild(text);
        row.appendChild(td);
        for(let j=0; j<i; j++) {
            row.appendChild(document.createElement(`td`));
        }

        for(let j=i; j<proteinArray.length; j++) {
            // const tdata = $('<td />');
            const tdata = document.createElement(`td`);
            let d = proteinMap.get(proteinArray[i]).get(proteinArray[j]);
            if(d) {
                const innerDiv = document.createElement(`div`);
                innerDiv.classList.add(`table-data-content`);
                const leftInnerDiv = document.createElement(`div`);
                const leftText = document.createTextNode(d.distance.toFixed(2));
                leftInnerDiv.appendChild(leftText);
                leftInnerDiv.classList.add(`distance-div`);
                leftInnerDiv.setAttribute(`style`, `background-color: rgba(0,255,0, ${1-d.distance})`);
                const rightInnerDiv = document.createElement(`div`);
                const rightText = document.createTextNode(d.correlation ? d.correlation.toFixed(2) : `-`);
                rightInnerDiv.appendChild(rightText);
                rightInnerDiv.classList.add(`correlation-div`);
                rightInnerDiv.setAttribute(`style`, `background-color: rgb(52, 152, 219, ${
                    relativeCorrelation && d.correlation ?
                        (d.correlation - minMaxCorr.min) / (minMaxCorr.max - minMaxCorr.min):
                        d.correlation || 0
                })`
                );
                innerDiv.appendChild(leftInnerDiv);
                innerDiv.appendChild(rightInnerDiv);

                tdata.appendChild(innerDiv);
            }
            row.appendChild(tdata);
        }


        tbody.appendChild(row);

        setTimeout(() => {
            if(i+1 < proteinArray.length) {
                process(i+1);
            } else {
                console.log(`done drawing table (${i} lines)`, (new Date() - start)/1000);
            }
        }, 0);

    };

    if(proteinArray.length > 0) {
        setTimeout(() => {process(0);}, 10);
    }

};
