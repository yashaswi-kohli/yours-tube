//! we will use both (try, catch) and (then, catch) this is used for promises

//* Then Catch(Resolve, Reject)

const asnycHandler = (requestHandler) => {
  Promise.resolve(requestHandler(req, res, next)).reject((err) => next(err));
};

export { asnycHandler };

//* Try Catch

// const asnycHandler = () => async {};
// const asnycHandler = (func) => async {};
// const asnycHandler = (func) => async { () => {} };
// const asnycHandler = (func) => async () => {}

//  const asnycHandler = (func) => async () => {
//   try {
//     await func(req, res, next);
//   } catch (error) {
//     res
//         .status(err.code || 500)
//         .json({
//             success: false,
//             message: err.message,
//         });
//   }
// };
