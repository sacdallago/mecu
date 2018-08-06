class PaginationComponent{
    constructor(htmlId, totalItemCount, itemsPerPage, now = 1, fun) {
        if(totalItemCount <= itemsPerPage) {
            console.log('not enough elements for pagination');
        } else if(!!htmlId && !!totalItemCount && !!itemsPerPage && !!fun) {
            this.draw(htmlId, totalItemCount, itemsPerPage, now, 'page', 'arrow-left', 'arrow-right', fun);
        }
    }

    draw(id, totalItems, itemsPerPage, now, htmlClassPages, aLClass, aRClass, fun) {
        // const totalSize = 500;
        // const height = 70;

        const htmlId = $(id);
        htmlId.empty();

        const elementCount = Math.ceil(totalItems/itemsPerPage);
        const elementSize = 500 / elementCount-2;

        let container = $('<div />').attr({'class':'container'}); // ,'style':`display:flex;flex-direction:row; width: totalSize; height: height`
        let arrowElement = $('<div />') .addClass(htmlClassPages);
        let pageElement = $('<div />').addClass(`${htmlClassPages} page-nr`);

        container.append(arrowElement.clone().addClass(aLClass).append($('<div />').text('❮')) );
        for(let i=0; i<elementCount; i++) {
            if(i === now-1) {
                container.append(
                    pageElement.clone()
                    .attr({'data-page':i})
                    .addClass(`chosen`)
                    .append($('<div />').text(i+1))
                );
            } else {
                container.append(
                    pageElement.clone()
                    .attr({'data-page':i})
                    .addClass(`${htmlClassPages}`)
                    .append($('<div />').text(i+1))
                );
            }
        }
        container.append(arrowElement.clone().addClass(aRClass).append($('<div />').text('❯')) );
        htmlId.append(container);

        this.addClickHandler(id, totalItems, itemsPerPage, now, 'page-nr', aLClass, aRClass, fun);
    }

    addClickHandler(id, totalItems, itemsPerPage, now, htmlClass, aL, aR, fun) {
        const self = this;
        const pagesDivs = $(`#pagination-component .${htmlClass}`);
        const pagesElementsCount = pagesDivs.length;
        const arrowLeftDiv = $(`#pagination-component .${aL}`);
        const arrowRightDiv = $(`#pagination-component .${aR}`);
        arrowLeftDiv[0].addEventListener('click', () => {
            if(now !== 1) {
                this.draw(id, totalItems, itemsPerPage, now-1, 'page', aL, aR, fun);
                fun(now-1);
            }
        });
        arrowRightDiv[0].addEventListener('click', (e) => {
            if(now < pagesElementsCount) {
                this.draw(id, totalItems, itemsPerPage, now+1, 'page', aL, aR, fun);
                fun(now+1);
            }
        });
        for(let i=0; i<pagesDivs.length; i++) {
            pagesDivs[i].addEventListener('click', function(e) {
                self.draw(id, totalItems, itemsPerPage, parseInt(this.getAttribute('data-page'))+1, 'page', aL, aR, fun);
                fun(parseInt(this.getAttribute('data-page'))+1);
            });
        }
    }
}
