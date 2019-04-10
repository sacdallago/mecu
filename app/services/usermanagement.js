module.exports = function(context) {
    const userController = context.component(`controllers`).module(`users`);

    context.api
        .get(`/user/:googleId/removeAdminRights`, userController.removeAdminRights)
        .get(`/user/:googleId/disallowUserPost`, userController.disallowUserToPost)
        .get(`/user/:googleId/allowPost`, userController.allowUserToPost)
        .get(`/user/:googleId/makeAdmin`, userController.makeAdmin)
        .post(`/users`, userController.getUsersPaginated)
    ;
};
