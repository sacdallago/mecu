
class LoadingAnimation {

    constructor(htmlId, {size = 120, subElementCreateFunction} = {}) {
        this.htmlId = htmlId;
        this.htmlComponent = document.querySelector(htmlId);
        if(!htmlId || !this.htmlComponent) {
            console.warn(`USE: new LoadingAnimation(<html identifier>) (html identifier cannot be empty)`);
            return {
                start: () => {console.warn(`cannot find ${htmlId}`);},
                stop: () => {console.warn(`cannot find ${htmlId}`);}
            };
        }

        this.width = size;
        this.height = size;
        this.border = size/7.5;
        this.subElementFunction = subElementCreateFunction;

        const style = document.createElement(`style`);
        style.type = `text/css`;
        style.innerHTML = `
        @-webkit-keyframes spin {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }`;
        document.getElementsByTagName(`head`)[0].appendChild(style);
    }

    start() {
        let container = document.createElement(`div`);
        container.style.display = `flex`;
        container.style[`justify-content`] = `center`;
        container.style[`align-items`] = `center`;

        const animation = document.createElement(`div`);
        animation.style.border = `${this.border}px solid #f3f3f3`;
        animation.style[`border-radius`] = `50%`;
        animation.style[`border-top`] = `${this.border}px solid #3498db`;
        animation.style.width = `${this.width}px`;
        animation.style.height = `${this.height}px`;
        animation.style[`-webkit-animation`] = `spin 2s linear infinite`;
        animation.style.aniimation = `spin 2s linear infinite`;

        if(this.subElementFunction) {
            let obj = this.subElementFunction();
            obj[1].appendChild(animation);
            this.htmlComponent.appendChild(obj[0]);
        } else {
            this.htmlComponent.style.display = `flex`;
            this.htmlComponent.style[`justify-content`] = `center`;
            this.htmlComponent.style[`align-items`] = `center`;

            container.appendChild(animation);
            while(this.htmlComponent.firstChild) {
                this.htmlComponent.removeChild(this.htmlComponent.firstChild);
            }
            this.htmlComponent.appendChild(container);
        }
    }

    stop() {
        while(this.htmlComponent.firstChild) {
            this.htmlComponent.removeChild(this.htmlComponent.firstChild);
        }
    }
}
