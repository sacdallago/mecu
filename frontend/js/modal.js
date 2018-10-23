ModalService = {};

ModalService.show = (htmlIdentifier) => typeof htmlIdentifier === 'string' ? $(htmlIdentifier).modal('show') : htmlIdentifier.modal('show');
ModalService.hide = (htmlIdentifier) => typeof htmlIdentifier === 'string' ? $(htmlIdentifier).modal('hide') : htmlIdentifier.modal('hide');
ModalService.toggle = (htmlIdentifier) => typeof htmlIdentifier === 'string' ? $(htmlIdentifier).modal('toggle') : htmlIdentifier.modal('toggle');


ModalService.create = (htmlIdentifier, title, content, buttons, settings = {}) => {
    const modal = $(htmlIdentifier).addClass(['ui', 'modal']);

    const buttonsArr = [];
    buttons.forEach(button => buttonsArr.push(
        $('<div />')
            .addClass(['ui', 'button'])
            .attr({id: button.id}).text(button.text)
    ));

    modal.append([
        $('<div />').addClass('header').text(title),
        $('<div />').addClass('content').text(content),
        $('<div />').addClass('actions').append(buttonsArr)
    ]);

    modal.modal(
        {
            transition: 'fade',
            closable: settings.closable || false
        }
    );

    $(htmlIdentifier).on('click', '.ui.button', function() {
        buttons.forEach(button => {
            if(button.id === $(this).attr('id')) {
                document.querySelector(htmlIdentifier).dispatchEvent(new Event(`custom-modal-event-${button.action}`));
                ModalService.hide(htmlIdentifier);
            }
        })
    });

    return modal;
}

ModalService.listenForDecision = (identifier, arrayOfActions, handler) => {
    ModalService.show(modalIdentifier);

    const newHandler = (e) => {
        handler(e);
        arrayOfActions.forEach(action =>
            document.querySelector(modalIdentifier).removeEventListener(action, newHandler)
        );
    }

    arrayOfActions.forEach(action =>
        document.querySelector(modalIdentifier).addEventListener(action, newHandler)
    );
}


// -----------------------------------------------------------------------------------------
// custom usages
// -----------------------------------------------------------------------------------------
ModalService.openModalAndDoAction = (
    action1,
    action2,
    action3
) => {
    ModalService.listenForDecision(
        modalIdentifier,
        ['custom-modal-event-no', 'custom-modal-event-yes', 'custom-modal-event-add'],
        (event) => {
            switch(event.type) {
                case 'custom-modal-event-no':
                    action1();
                    break;
                case 'custom-modal-event-yes':
                    action2();
                    break;
                case 'custom-modal-event-add':
                    action3();
                    break;
            }
        }
    );
}
ModalService.createAddProteinToLocalStorageModalWithNoYesAddButtons = (identifier) => {
    return ModalService.create(
        identifier,
        'Proteins already in memory',
        `There are alreay proteins saved. Do you want to overwrite them('Yes') or add them('Add')?`,
        ModalService.createButtonsNoYesAdd(),
        {
            closable: true
        }
    );
}
ModalService.createButtonsNoYesAdd = () => {
    return [
        {
            id: 'modal-deny-button',
            text: 'Cancel',
            action: 'no'
        },
        {
            id: 'modal-approve-button',
            text: 'Overwrite',
            action: 'yes'

        },
        {
            id: 'modal-add-button',
            text: 'Add',
            action: 'add'
        }
    ];
}
