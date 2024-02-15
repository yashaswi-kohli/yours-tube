//! we will use both (try, catch) and (then, catch) this is used for promises

//* Then Catch(Resolve, Reject)

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
      Promise
       .resolve(requestHandler(req, res, next))
       .reject((err) => next(err));
  }
};

export { asyncHandler };

//* Try Catch

// const asyncHandler = () => async {};
// const asyncHandler = (func) => async {};
// const asyncHandler = (func) => async { () => {} };
// const asyncHandler = (func) => async () => {}

//  const asyncHandler = (func) => async () => {
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
