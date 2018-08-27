
class PaginationComponent{
    // TODO for now the pagination component is redrawn every time the page is changed
    //      but I could actually only update the component if there was a page change
    constructor(htmlId, totalItemCount, itemsPerPage, now = 1, fun, maxNumberPagesToShow) {
        this.pageElementClass = 'page';
        this.pageElementWithClickHandlerClass = 'page-nr';
        this.arrowLeftClass = 'arrow-left';
        this.arrowRightClass = 'arrow-right';
        this.arrowLeft = '❮';
        this.arrowRight = '❯';
        this.maxNumberPagesToShow = maxNumberPagesToShow || 7; // should be odd
        if(this.maxNumberPagesToShow % 2 == 0) {
            console.warn(`Max number of pages elements to show in pagination component has to be odd (${maxNumberPagesToShow})`)
            return;
        }

        this.htmlId = htmlId;
        this.totalItemCount = totalItemCount;
        this.itemsPerPage = itemsPerPage;
        this.now = now;
        this.fun = fun;
        if(totalItemCount <= itemsPerPage || totalItemCount === 0) {
            $(this.htmlId).empty();
        } else if(!!htmlId && !!totalItemCount && !!itemsPerPage && !!fun) {
            this.draw();
        }
    }

    draw() {
        const htmlId = $(this.htmlId);
        htmlId.empty();

        let totalPageCount = this.totalPageCount();
        let elementsStashed = false;
        let elementCount = totalPageCount;
        if(elementCount > this.maxNumberPagesToShow) {
            elementCount = this.maxNumberPagesToShow;
            elementsStashed = true;
        }
        const elementSize = 500 / elementCount-2;

        let container = $('<div />').attr({'class':'container'});
        let arrowElement = $('<div />').addClass(this.pageElementClass);
        let pageElement = $('<div />')
            .addClass(`${this.pageElementClass} ${this.pageElementWithClickHandlerClass}`);

        // append left arrow
        container.append(
            arrowElement.clone()
                .addClass(this.arrowLeftClass)
                .append(
                    $('<div />').text(this.arrowLeft)
                )
            );

        let startPage = 0;
        let endPage = elementCount;
        if(elementsStashed){
            startPage = this.now-1 < (elementCount-1)/2 ?
                0 :
                (this.now-1)-(elementCount-1)/2;
            endPage = this.now+(elementCount-1)/2 > totalPageCount ?
                totalPageCount :
                (this.now)+(elementCount-1)/2;
        }

        // draw ... element if there are more pages before
        if(startPage > 0){
            container.append(
                arrowElement.clone()
                    .append($('<div />').text('...'))
            );
        }
        for(let i=startPage; i<endPage; i++) {
            if(i === this.now-1) {
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
                    .addClass(`${this.pageElementClass}`)
                    .append($('<div />').text(i+1))
                );
            }
        }
        // draw ... element if there are more pages after
        if(endPage < totalPageCount) {
            container.append(
                arrowElement.clone()
                    .append($('<div />').text('...'))
            );
        }

        // append right arrow
        container.append(
            arrowElement.clone()
                .addClass(this.arrowRightClass)
                .append(
                    $('<div />').text(this.arrowRight)
                )
            );

        htmlId.append(container);

        this.addClickHandler();
    }

    addClickHandler() {
        const self = this;
        const pagesDivs = $(`${this.htmlId} .${this.pageElementWithClickHandlerClass}`);
        const arrowLeftDiv = $(`${this.htmlId} .${this.arrowLeftClass}`);
        const arrowRightDiv = $(`${this.htmlId} .${this.arrowRightClass}`);
        arrowLeftDiv[0].addEventListener('click', () => {
            if(this.now !== 1) {
                this.now = this.now-1;
                this.draw();
                this.fun(this.now);
            }
        });
        arrowRightDiv[0].addEventListener('click', (e) => {
            if(this.now < this.totalPageCount()) {
                this.now = this.now+1;
                this.draw();
                this.fun(this.now);
            }
        });
        for(let i=0; i<pagesDivs.length; i++) {
            pagesDivs[i].addEventListener('click', function(e) {
                let newPage = parseInt(this.getAttribute('data-page'))+1;
                self.now = newPage;
                self.draw();
                self.fun(self.now);
            });
        }
    }

    totalPageCount() {
        return Math.ceil(this.totalItemCount/this.itemsPerPage);
    }
}
