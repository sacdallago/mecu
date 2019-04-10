const lAUsersList = new LoadingAnimation(`#users-list-container`, {
    size: 20,
    subElementCreateFunction: () => {
        const highestElement = document.createElement(`tr`);
        const lowestElement = document.createElement(`td`);
        lowestElement.setAttribute(`colspan`, `1`);
        lowestElement.style.display = `flex`;
        lowestElement.style[`justify-content`] = `center`;
        lowestElement.style[`align-items`] = `center`;
        highestElement.appendChild(lowestElement);
        return [highestElement, lowestElement];
    }
});

const DELAY_REQUEST_UNTIL_NO_KEY_PRESSED_FOR_THIS_AMOUNT_OF_TIME = 400;
const ITEM_PER_PAGE_COUNT = 8;
let usersQuery = {
    search: ``,
    limit: ITEM_PER_PAGE_COUNT,
    offset: 0,
    sortBy: `displayName`,
    order: `ASC`
};

const handleInput = (page, resetOffset) => {
    emptyTable();
    lAUsersList.start();

    if(resetOffset) usersQuery.offset = 0;
    console.log('usersQuery', usersQuery);

    return UserService.findUsers(usersQuery)
        .then(response => {
            console.log(`response`, response);
            if (response.error && response.errorType === 1) {
                throw Error(response.error);
                return;
            }
            lAUsersList.stop();
            drawUsersTable(response.data);
            drawPaginationComponent(page+1, response.total > 0 ? response.total : 0 );
            return response;
        })
        .catch(error => {
            lAUsersList.stop();
            console.error(error);
        });
};

const drawPaginationComponent = (actualPage, totalPages) => {
    new PaginationComponent(
        `#pagination-component`,
        totalPages,
        usersQuery.limit,
        actualPage,
        (newPage) => {
            usersQuery.offset = (newPage-1)*ITEM_PER_PAGE_COUNT;
            handleInput(newPage-1);
        }
    );
};

const emptyTable = () => {
    const t = document.querySelector(`#users-list-container`);
    while(t.firstChild) {
        t.removeChild(t.firstChild);
    }
};

/**
 * draw the experiments data table from the retrieved data
 * @param  [{id: number, description: string, lysate: boolean, uploader:string}] data               [description]
 * @param  string checkboxIdentifier how should the checkboxes be identified
 */
const drawUsersTable = (users) => {
    emptyTable();
    let table = $(`#users-list-container`);
    let tr = $(`<tr />`).addClass(`table-row`);
    let td = $(`<td />`);
    let link = $(`<a />`, {'target':`_blank`});
    let inputCb1 = $(`<input />`, {'class':'checkbox-identifier1', 'type':`checkbox`, 'tabindex':`0`});
    let inputCb2 = $(`<input />`, {'class':'checkbox-identifier2', 'type':`checkbox`, 'tabindex':`0`});
    let label = $(`<label />`);

    users.forEach(user => {
        let row = tr.clone();

        const nameElement = td.clone().text(user.displayName)
        row.append(nameElement);

        const googleId = td.clone()
            .append(
                link.clone()
                    .attr({'href':`https://plus.google.com/`+user.googleId})
                    .text(`Google Plus Profile`)
            );
        row.append(googleId);

        const identifier1 = 'cb'+user.googleId;
        const cb1 = inputCb1.clone().attr({
            'id':identifier1,
            checked: user.allowPost === true ? true : undefined,
            'data-googleid': user.googleId
        });
        const allowedToPostCb1 = td.clone().append(
            cb1,
            label.clone().attr({'for':identifier1})
        );
        row.append(allowedToPostCb1);

        const identifier2 = 'cb'+user.googleId;
        const cb2 = inputCb2.clone().attr({
            'id':identifier2,
            checked: user.isAdmin === true ? true : undefined,
            'data-googleid': user.googleId
        });
        const allowedToPostCb2 = td.clone().append(
            cb2,
            label.clone().attr({'for':identifier2})
        );
        row.append(allowedToPostCb2);

        table.append(row);
    });

    addEventHandlerToUsersTable();
};

const addEventHandlerToUsersTable = () => {
    let list = document.getElementsByClassName('checkbox-identifier1');
    for(let i = 0; i<list.length; i++) {
        list[i].addEventListener(`click`, function() {
            if (this.checked) {
                let googleId = $(this).data(`googleid`);
                UserService.allowUserToPost(googleId);
            } else {
                let googleId = $(this).data(`googleid`);
                UserService.disallowUserToPost(googleId);
            }
        });
    }

    list = document.getElementsByClassName('checkbox-identifier2');
    for(let i = 0; i<list.length; i++) {
        list[i].addEventListener(`click`, function() {
            if (this.checked) {
                let googleId = $(this).data(`googleid`);
                UserService.makeAdmin(googleId);
            } else {
                let googleId = $(this).data(`googleid`);
                UserService.removeAdminRights(googleId);
            }
        });
    }
};

$(document).ready(() => handleInput(0, true));
