
class PaginationComponent{
    constructor(htmlId, totalItemCount, itemsPerPage, now = 1, fun) {
        this.htmlId = htmlId;
        this.totalItemCount = totalItemCount;
        this.itemsPerPage = itemsPerPage;
        this.now = now;
        this.fun = fun;
        this.pageElementClass = 'page';
        this.pageElementWithClickHandlerClass = 'page-nr';
        this.arrowLeftClass = 'arrow-left';
        this.arrowRightClass = 'arrow-right';
        this.arrowLeft = '❮';
        this.arrowRight = '❯';
        if(totalItemCount <= itemsPerPage) {
            console.log('not enough elements for pagination');
        } else if(!!htmlId && !!totalItemCount && !!itemsPerPage && !!fun) {
            this.draw();
        }
    }

    draw() {
        const htmlId = $(this.htmlId);
        htmlId.empty();

        const elementCount = Math.ceil(this.totalItemCount/this.itemsPerPage);
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

        // append page number elements
        for(let i=0; i<elementCount; i++) {
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
        const pagesElementsCount = pagesDivs.length;
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
            if(this.now < pagesElementsCount) {
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
}
