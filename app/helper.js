module.exports = {
    retrieveUserGoogleId: (request) => {
        if(request && request.user) {
            return request.user.get(`googleId`);
        } else {
            return ``;
        }
    }
};
