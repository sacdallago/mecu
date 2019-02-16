$(`.dropdown`).dropdown();

tourSettings = {
    canExit: true,
    padding: 5,
    maxHeight: 150,
    maxWidth: 700,
    maskVisible: true,
    maskClickThrough: false,
    maskScrollThrough: true, // Allows the user to scroll the scrollbox or window through the mask
    maskColor: `rgba(0,0,0,.7)`, // The mask color
    scrollBox: `body`, // The container to scroll when searching for elements
    previousText: `Previous`,
    nextText: `Next`,
    finishText: `Finish`,
    showPrevious: true, // Setting to false hides the previous button
    showNext: true, // Setting to false hides the next button
    animationDuration: 400, // Animation Duration for the box and mask
    placement: [`bottom`, `right`, `top`,`left`],
    dark: true, // Dark mode (Works great with `mask.visible = false`)
    disableInteraction: true, // Disable interaction with the highlighted elements
    disableEscExit: false // Disable end of tour when pressing ESC,
}
