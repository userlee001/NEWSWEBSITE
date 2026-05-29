export const recordActionTypeMiddleware = (actionName) => {
    return (request, response, next) => {
        response.locals.audit = { action: actionName, shouldRecord: true };
        next();
    }
}